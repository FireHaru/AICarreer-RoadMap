import { analyzeGap, buildTargets, effectiveLevels, gainOf, isMastered, levelOf } from './skills.js';
import type {
  AutoSkip, Catalog, CareerPath, Course, CourseStatus, GapItem, LearnerProfile, LevelInfo, Origin, PlanItem, Reason, Target,
} from './types.js';

export const DIFFICULTY_RANK: Record<Course['difficulty'], number> = { Beginner: 0, Intermediate: 1, Advanced: 2, Expert: 3 };

const ORIGIN_RANK: Record<Origin, number> = { skill_gap: 0, path: 1, prerequisite: 2, user: 3 };

/** How directly a course serves the learner's goal; used to choose between courses that teach the same skill. */
export function courseRelevance(course: Course, careerId: number | null, researchId: number | null): number {
  let r = 0;
  const cl = course.careers.find((l) => l.careerId === careerId);
  if (cl) r += cl.relevance === 'core' ? 2 : 1;
  const rl = course.research.find((l) => l.researchId === researchId);
  if (rl) r += rl.relevance === 'core' ? 1 : 0.5;
  return r;
}

function sameReason(a: Reason, b: Reason) {
  if (a.type !== b.type) return false;
  switch (a.type) {
    case 'skill_gap': return a.skillId === (b as typeof a).skillId;
    case 'prerequisite': return a.forCourseId === (b as typeof a).forCourseId;
    case 'path_milestone': return a.pathId === (b as typeof a).pathId;
    default: return true;
  }
}

/**
 * Kahn's topological sort restricted to `ids`: a course always comes after its prerequisites,
 * and among the courses that are ready at each step, `compare` decides which goes first.
 */
export function topoOrder(cat: Catalog, ids: number[], compare: (a: number, b: number) => number): number[] {
  const set = new Set(ids);
  const indeg = new Map<number, number>();
  for (const id of ids) indeg.set(id, cat.courses.get(id)!.prereqIds.filter((p) => set.has(p)).length);
  const ready = ids.filter((id) => indeg.get(id) === 0);
  const out: number[] = [];
  while (ready.length) {
    ready.sort(compare);
    const id = ready.shift()!;
    out.push(id);
    for (const d of cat.dependents.get(id) ?? []) {
      if (!set.has(d)) continue;
      const n = indeg.get(d)! - 1;
      indeg.set(d, n);
      if (n === 0) ready.push(d);
    }
  }
  // The catalog is validated to be acyclic; this only guards against corrupted data.
  for (const id of ids) if (!out.includes(id)) out.push(id);
  return out;
}

export interface GeneratedRoadmap {
  path: CareerPath;
  items: PlanItem[];
  autoSkipped: AutoSkip[];
  /** skillId -> course chosen to close that gap */
  skillPlan: Map<number, number>;
  targets: Map<number, Target>;
  gaps: GapItem[];
  levels: Map<number, LevelInfo>;
}

/**
 * The deterministic recommendation engine.
 *
 *  1. Required skills for the career (+ path, + research direction for research paths)
 *  2. Compare with the learner's effective levels → skill gaps
 *  3. For each gap (largest weighted gap first) pick the course that closes it:
 *     the most goal-relevant course that reaches the required level, preferring the smallest sufficient step
 *  4. Add the path's milestone (capstone)
 *  5. Walk prerequisites: completed ones are kept as completed nodes, ones the learner has already
 *     mastered are skipped automatically, the rest are added
 *  6. Priority = own gap score + 0.9 × the highest priority of anything it unlocks
 *  7. Topological sort, higher priority first among courses that are ready
 */
export function generateRoadmap(cat: Catalog, profile: LearnerProfile, path: CareerPath): GeneratedRoadmap {
  const levels = effectiveLevels(cat, profile);
  const targets = buildTargets(cat, { careerId: profile.careerId, researchId: profile.researchId, path });
  const gaps = analyzeGap(targets, levels);

  const selected = new Map<number, { origin: Origin; reasons: Reason[]; own: number }>();
  const skillPlan = new Map<number, number>();
  const add = (courseId: number, origin: Origin, reason: Reason, score: number) => {
    let entry = selected.get(courseId);
    if (!entry) {
      entry = { origin, reasons: [], own: 0 };
      selected.set(courseId, entry);
    } else if (ORIGIN_RANK[origin] < ORIGIN_RANK[entry.origin]) {
      entry.origin = origin;
    }
    if (!entry.reasons.some((r) => sameReason(r, reason))) entry.reasons.push(reason);
    entry.own += score;
  };
  const relevance = (c: Course) => courseRelevance(c, profile.careerId, profile.researchId);
  const better = (skillId: number) => (a: Course, b: Course) =>
    relevance(b) - relevance(a) || gainOf(a, skillId) - gainOf(b, skillId) || a.hours - b.hours || a.code.localeCompare(b.code);

  const open = gaps.filter((g) => g.gap > 0).sort((a, b) => b.score - a.score || a.skillId - b.skillId);
  for (const g of open) {
    const covering = [...selected.keys()].map((id) => cat.courses.get(id)!).filter((c) => gainOf(c, g.skillId) >= g.required);
    if (covering.length) {
      const c = covering.sort(better(g.skillId))[0];
      add(c.id, 'skill_gap', { type: 'skill_gap', skillId: g.skillId }, g.score);
      skillPlan.set(g.skillId, c.id);
      continue;
    }
    const candidates = cat.courseList.filter(
      (c) => c.kind === 'course' && !profile.completed.has(c.id) && gainOf(c, g.skillId) > g.current,
    );
    if (!candidates.length) continue;
    let pool = candidates.filter((c) => gainOf(c, g.skillId) >= g.required);
    if (!pool.length) {
      const best = Math.max(...candidates.map((c) => gainOf(c, g.skillId)));
      pool = candidates.filter((c) => gainOf(c, g.skillId) === best);
    }
    const pick = pool.sort(better(g.skillId))[0];
    add(pick.id, 'skill_gap', { type: 'skill_gap', skillId: g.skillId }, g.score);
    skillPlan.set(g.skillId, pick.id);
  }

  for (const courseId of path.courseIds) {
    if (!profile.completed.has(courseId)) add(courseId, 'path', { type: 'path_milestone', pathId: path.id }, 0);
  }

  const autoSkipped = new Map<number, AutoSkip>();
  const queue = [...selected.keys()];
  while (queue.length) {
    const courseId = queue.shift()!;
    if (profile.completed.has(courseId)) continue;
    for (const p of cat.courses.get(courseId)!.prereqIds) {
      const reason: Reason = { type: 'prerequisite', forCourseId: courseId };
      if (selected.has(p) || profile.completed.has(p)) {
        add(p, 'prerequisite', reason, 0);
        continue;
      }
      const pc = cat.courses.get(p)!;
      if (isMastered(pc, levels)) {
        if (!autoSkipped.has(p)) {
          autoSkipped.set(p, {
            courseId: p,
            forCourseId: courseId,
            evidence: pc.skills.map((s) => ({ skillId: s.skillId, level: levelOf(levels, s.skillId), gain: s.gain })),
          });
        }
        continue;
      }
      add(p, 'prerequisite', reason, 0);
      queue.push(p);
    }
  }

  const priority = new Map<number, number>();
  const prioOf = (id: number): number => {
    const known = priority.get(id);
    if (known !== undefined) return known;
    let downstream = 0;
    for (const d of cat.dependents.get(id) ?? []) if (selected.has(d)) downstream = Math.max(downstream, prioOf(d));
    const value = Math.round((selected.get(id)!.own + 0.9 * downstream) * 10) / 10;
    priority.set(id, value);
    return value;
  };
  for (const id of selected.keys()) prioOf(id);

  const ordered = topoOrder(cat, [...selected.keys()], (a, b) => {
    const ca = cat.courses.get(a)!;
    const cb = cat.courses.get(b)!;
    return Number(profile.completed.has(b)) - Number(profile.completed.has(a))
      || priority.get(b)! - priority.get(a)!
      || DIFFICULTY_RANK[ca.difficulty] - DIFFICULTY_RANK[cb.difficulty]
      || ca.code.localeCompare(cb.code);
  });

  const items: PlanItem[] = ordered.map((courseId, position) => {
    const e = selected.get(courseId)!;
    return { courseId, origin: e.origin, reasons: e.reasons, priority: priority.get(courseId)!, position, skipped: false };
  });

  return { path, items, autoSkipped: [...autoSkipped.values()], skillPlan, targets, gaps, levels };
}

export interface StatusInfo {
  status: CourseStatus;
  /** Prerequisites inside the roadmap that still block this course. */
  unmet: number[];
  /** Prerequisites the learner removed from the roadmap and has not completed (warning only). */
  missing: number[];
}

/**
 * Status of each roadmap course. Prerequisites that are completed or skipped count as satisfied.
 * The first unlocked course is "current"; other unlocked ones are "recommended"; the rest are "locked".
 */
export function computeStatuses(
  cat: Catalog,
  items: Pick<PlanItem, 'courseId' | 'skipped'>[],
  completed: Set<number>,
  levels: Map<number, LevelInfo>,
): Map<number, StatusInfo> {
  const inRoadmap = new Map(items.map((i) => [i.courseId, i]));
  const out = new Map<number, StatusInfo>();
  let currentAssigned = false;
  for (const item of items) {
    const course = cat.courses.get(item.courseId)!;
    const unmet = course.prereqIds.filter((p) => inRoadmap.has(p) && !completed.has(p) && !inRoadmap.get(p)!.skipped);
    const missing = course.prereqIds.filter((p) => !inRoadmap.has(p) && !completed.has(p) && !isMastered(cat.courses.get(p)!, levels));
    let status: CourseStatus;
    if (completed.has(item.courseId)) status = 'completed';
    else if (item.skipped) status = 'skipped';
    else if (unmet.length) status = 'locked';
    else if (!currentAssigned) {
      status = 'current';
      currentAssigned = true;
    } else status = 'recommended';
    out.set(item.courseId, { status, unmet, missing });
  }
  return out;
}

/** Sequential schedule at the learner's weekly pace (completed and skipped courses take no time). */
export function schedule(cat: Catalog, items: Pick<PlanItem, 'courseId' | 'skipped'>[], completed: Set<number>, weeklyHours: number) {
  const out = new Map<number, { startWeek: number; endWeek: number; weeks: number }>();
  let week = 0;
  for (const item of items) {
    if (item.skipped || completed.has(item.courseId)) continue;
    const weeks = cat.courses.get(item.courseId)!.hours / Math.max(1, weeklyHours);
    out.set(item.courseId, { startWeek: Math.round(week * 10) / 10, endWeek: Math.round((week + weeks) * 10) / 10, weeks: Math.round(weeks * 10) / 10 });
    week += weeks;
  }
  return out;
}

export function progressOf(cat: Catalog, items: Pick<PlanItem, 'courseId' | 'skipped'>[], completed: Set<number>, weeklyHours: number) {
  const active = items.filter((i) => !i.skipped).map((i) => cat.courses.get(i.courseId)!);
  const done = active.filter((c) => completed.has(c.id));
  const totalHours = active.reduce((s, c) => s + c.hours, 0);
  const completedHours = done.reduce((s, c) => s + c.hours, 0);
  const remainingHours = totalHours - completedHours;
  const etaWeeks = Math.ceil(remainingHours / Math.max(1, weeklyHours));
  const eta = new Date(Date.now() + etaWeeks * 7 * 24 * 3600 * 1000);

  const byCategory = new Map<string, { category: string; total: number; completed: number; hours: number; completedHours: number }>();
  for (const c of active) {
    const row = byCategory.get(c.category) ?? { category: c.category, total: 0, completed: 0, hours: 0, completedHours: 0 };
    row.total += 1;
    row.hours += c.hours;
    if (completed.has(c.id)) {
      row.completed += 1;
      row.completedHours += c.hours;
    }
    byCategory.set(c.category, row);
  }

  return {
    pct: totalHours ? Math.round((completedHours / totalHours) * 100) : 0,
    completed: done.length,
    total: active.length,
    skipped: items.length - active.length,
    remaining: active.length - done.length,
    totalHours,
    completedHours,
    remainingHours,
    etaWeeks,
    etaDate: eta.toISOString().slice(0, 10),
    categories: [...byCategory.values()].map((r) => ({ ...r, pct: r.hours ? Math.round((r.completedHours / r.hours) * 100) : 0 })),
  };
}

/** Missing prerequisites of `courseId` (transitively) that are neither completed, mastered nor already planned. */
export function missingPrereqClosure(cat: Catalog, courseId: number, have: Set<number>, completed: Set<number>, levels: Map<number, LevelInfo>): number[] {
  const out: number[] = [];
  const seen = new Set<number>();
  const visit = (id: number) => {
    for (const p of cat.courses.get(id)!.prereqIds) {
      if (seen.has(p)) continue;
      seen.add(p);
      if (have.has(p) || completed.has(p) || isMastered(cat.courses.get(p)!, levels)) continue;
      out.push(p);
      visit(p);
    }
  };
  visit(courseId);
  return out;
}
