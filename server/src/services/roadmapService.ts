import type { Queryable } from '../db/client.js';
import { buildContext, type EngineContext } from '../engine/context.js';
import { explainAutoSkip, explainRoadmapCourse, shortReason } from '../engine/explain.js';
import { computeStatuses, generateRoadmap, progressOf, schedule, topoOrder, type GeneratedRoadmap } from '../engine/roadmap.js';
import type { AutoSkip, CareerPath, Catalog, LearnerProfile, Origin, PlanItem, Reason } from '../engine/types.js';
import { HttpError } from '../middleware/errors.js';
import { careerRef, courseSummary, pathRef, researchRef } from './serialize.js';

export interface StoredRoadmap {
  id: number;
  careerId: number;
  researchId: number | null;
  pathId: number;
  autoSkipped: AutoSkip[];
  items: PlanItem[];
  updatedAt: string;
}

export async function getActiveRoadmap(db: Queryable, userId: number): Promise<StoredRoadmap | null> {
  const [r] = await db.query('SELECT * FROM roadmaps WHERE user_id = $1 AND is_active', [userId]);
  if (!r) return null;
  const rows = await db.query('SELECT * FROM roadmap_courses WHERE roadmap_id = $1 ORDER BY position', [r.id]);
  return {
    id: r.id,
    careerId: r.career_id,
    researchId: r.research_id,
    pathId: r.path_id,
    autoSkipped: r.auto_skipped,
    updatedAt: r.updated_at,
    items: rows.map((row) => ({
      courseId: row.course_id,
      origin: row.origin as Origin,
      reasons: row.reasons as Reason[],
      priority: Number(row.priority),
      position: row.position,
      skipped: row.skipped,
    })),
  };
}

export function resolvePath(cat: Catalog, careerId: number, slug?: string | null): CareerPath {
  const career = cat.careers.get(careerId);
  if (!career) throw new HttpError(400, 'Choose a career goal first');
  const path = (slug && career.paths.find((p) => p.slug === slug)) || career.paths[0];
  if (!path) throw new HttpError(500, `Career ${career.name} has no roadmap paths`);
  return path;
}

async function insertItems(q: Queryable, roadmapId: number, items: PlanItem[]) {
  for (const it of items) {
    await q.query(
      `INSERT INTO roadmap_courses (roadmap_id, course_id, position, origin, skipped, priority, reasons)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [roadmapId, it.courseId, it.position, it.origin, it.skipped, it.priority, JSON.stringify(it.reasons)],
    );
  }
}

/** Runs the engine and stores the result as the user's active roadmap (previous ones are kept as history). */
export async function regenerate(db: { tx<T>(fn: (q: Queryable) => Promise<T>): Promise<T> }, cat: Catalog, profile: LearnerProfile, pathSlug?: string | null) {
  if (!profile.userId || !profile.careerId) throw new HttpError(400, 'Choose a career goal first');
  const path = resolvePath(cat, profile.careerId, pathSlug);
  const gen = generateRoadmap(cat, profile, path);
  await db.tx(async (q) => {
    await q.query('UPDATE roadmaps SET is_active = FALSE, updated_at = now() WHERE user_id = $1 AND is_active', [profile.userId]);
    const [row] = await q.query<{ id: number }>(
      `INSERT INTO roadmaps (user_id, career_id, research_id, path_id, auto_skipped) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [profile.userId, profile.careerId, profile.researchId, path.id, JSON.stringify(gen.autoSkipped)],
    );
    await insertItems(q, row.id, gen.items);
  });
  return gen;
}

/**
 * Returns the active roadmap, generating one when the learner has a goal but no roadmap yet,
 * or when the stored roadmap was built for a different career / research direction.
 */
export async function ensureRoadmap(
  db: Queryable & { tx<T>(fn: (q: Queryable) => Promise<T>): Promise<T> },
  cat: Catalog,
  profile: LearnerProfile,
): Promise<StoredRoadmap | null> {
  if (!profile.userId || !profile.careerId) return null;
  const existing = await getActiveRoadmap(db, profile.userId);
  if (existing && existing.careerId === profile.careerId && existing.researchId === profile.researchId) return existing;
  const keepSlug = existing ? cat.paths.get(existing.pathId)?.slug : null;
  await regenerate(db, cat, profile, keepSlug);
  return getActiveRoadmap(db, profile.userId);
}

/** Re-sorts a roadmap topologically while respecting the current order as closely as possible. */
export function stableReorder(cat: Catalog, items: PlanItem[]): PlanItem[] {
  const rank = new Map(items.map((it, i) => [it.courseId, i]));
  const order = topoOrder(cat, items.map((i) => i.courseId), (a, b) => rank.get(a)! - rank.get(b)!);
  const byId = new Map(items.map((i) => [i.courseId, i]));
  return order.map((id, position) => ({ ...byId.get(id)!, position }));
}

export async function saveOrder(q: Queryable, roadmapId: number, items: PlanItem[]) {
  for (const it of items) {
    await q.query('UPDATE roadmap_courses SET position = $3 WHERE roadmap_id = $1 AND course_id = $2', [roadmapId, it.courseId, it.position]);
  }
  await q.query('UPDATE roadmaps SET updated_at = now() WHERE id = $1', [roadmapId]);
}

type RoadmapLike = { careerId: number; researchId: number | null; pathId: number; items: PlanItem[]; autoSkipped: AutoSkip[] };

/** The full roadmap payload: ordered nodes with status, explanation and schedule, plus edges and progress. */
export function roadmapView(cat: Catalog, profile: LearnerProfile, rm: RoadmapLike & { id?: number; updatedAt?: string }) {
  const path = cat.paths.get(rm.pathId)!;
  const ctx: EngineContext = buildContext(cat, profile, path);
  const career = cat.careers.get(rm.careerId)!;
  const research = rm.researchId ? cat.research.get(rm.researchId) ?? null : null;
  const statuses = computeStatuses(cat, rm.items, profile.completed, ctx.levels);
  const sched = schedule(cat, rm.items, profile.completed, profile.weeklyHours);
  const inRoadmap = new Map(rm.items.map((i) => [i.courseId, i]));

  const items = rm.items.map((it) => {
    const course = cat.courses.get(it.courseId)!;
    const st = statuses.get(it.courseId)!;
    return {
      course: { ...courseSummary(cat, course), description: course.description },
      position: it.position,
      origin: it.origin,
      skipped: it.skipped,
      priority: it.priority,
      status: st.status,
      unmet: st.unmet,
      missing: st.missing,
      reason: shortReason(ctx, it),
      explanation: explainRoadmapCourse(ctx, it, st, inRoadmap),
      schedule: sched.get(it.courseId) ?? null,
    };
  });

  const edges: { source: number; target: number }[] = [];
  for (const it of rm.items) {
    for (const p of cat.courses.get(it.courseId)!.prereqIds) {
      if (inRoadmap.has(p)) edges.push({ source: p, target: it.courseId });
    }
  }

  const current = items.find((i) => i.status === 'current') ?? null;
  const next = current
    ? items.find((i) => i.position > current.position && i.status !== 'completed' && i.status !== 'skipped') ?? null
    : null;

  return {
    id: rm.id ?? null,
    updatedAt: rm.updatedAt ?? null,
    career: careerRef(career),
    research: research ? researchRef(research) : null,
    path: pathRef(path),
    paths: career.paths.map(pathRef),
    weeklyHours: profile.weeklyHours,
    items,
    edges,
    autoSkipped: rm.autoSkipped
      .filter((s) => !profile.completed.has(s.courseId) && !inRoadmap.has(s.courseId))
      .map((s) => ({ course: courseSummary(cat, cat.courses.get(s.courseId)!), reason: explainAutoSkip(ctx, s) })),
    progress: progressOf(cat, rm.items, profile.completed, profile.weeklyHours),
    currentCourseId: current?.course.id ?? null,
    nextCourseId: next?.course.id ?? null,
  };
}

export type RoadmapView = ReturnType<typeof roadmapView>;

export function previewFromGenerated(cat: Catalog, profile: LearnerProfile, gen: GeneratedRoadmap) {
  return roadmapView(cat, profile, {
    careerId: gen.path.careerId,
    researchId: profile.researchId,
    pathId: gen.path.id,
    items: gen.items,
    autoSkipped: gen.autoSkipped,
  });
}
