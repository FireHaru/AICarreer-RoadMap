import { Router, type Request } from 'express';
import { z } from 'zod';
import { buildContext } from '../engine/context.js';
import { computeStatuses, generateRoadmap, missingPrereqClosure } from '../engine/roadmap.js';
import { requireAuth } from '../middleware/auth.js';
import { HttpError } from '../middleware/errors.js';
import { ensureRoadmap, regenerate, roadmapView, saveOrder, stableReorder, type StoredRoadmap } from '../services/roadmapService.js';
import { courseRef, pathRef } from '../services/serialize.js';
import { findCourse, learner } from './helpers.js';

export const roadmapRouter = Router();
roadmapRouter.use(requireAuth);

async function current(req: Request) {
  const ctx = await learner(req);
  const roadmap = await ensureRoadmap(ctx.db, ctx.cat, ctx.profile);
  return { ...ctx, roadmap };
}

async function requireRoadmap(req: Request): Promise<Awaited<ReturnType<typeof current>> & { roadmap: StoredRoadmap }> {
  const ctx = await current(req);
  if (!ctx.roadmap) throw new HttpError(409, 'Set a career goal to generate your roadmap');
  return ctx as typeof ctx & { roadmap: StoredRoadmap };
}

/** Fresh view after a change; `before` lets us report which courses just unlocked. */
async function respond(req: Request, before?: Map<number, string>) {
  const { cat, profile, roadmap } = await requireRoadmap(req);
  const view = roadmapView(cat, profile, roadmap);
  const unlocked = before
    ? view.items.filter((i) => before.get(i.course.id) === 'locked' && (i.status === 'current' || i.status === 'recommended')).map((i) => courseRef(cat, i.course.id))
    : [];
  return { roadmap: view, unlocked };
}

function statusSnapshot(ctx: Awaited<ReturnType<typeof requireRoadmap>>) {
  const levels = buildContext(ctx.cat, ctx.profile).levels;
  return new Map([...computeStatuses(ctx.cat, ctx.roadmap.items, ctx.profile.completed, levels)].map(([id, s]) => [id, s.status as string]));
}

roadmapRouter.get('/', async (req, res) => {
  const { cat, profile, roadmap } = await current(req);
  res.json({ roadmap: roadmap ? roadmapView(cat, profile, roadmap) : null });
});

/** Alternative roadmaps: what each path would look like for this learner right now. */
roadmapRouter.get('/paths', async (req, res) => {
  const { cat, profile, roadmap } = await current(req);
  if (!profile.careerId) throw new HttpError(409, 'Set a career goal first');
  const career = cat.careers.get(profile.careerId)!;
  res.json({
    activePathId: roadmap?.pathId ?? null,
    paths: career.paths.map((path) => {
      const gen = generateRoadmap(cat, profile, path);
      const todo = gen.items.filter((i) => !profile.completed.has(i.courseId)).map((i) => cat.courses.get(i.courseId)!);
      const hours = todo.reduce((s, c) => s + c.hours, 0);
      return {
        ...pathRef(path),
        courseCount: todo.length,
        hours,
        weeks: Math.ceil(hours / Math.max(1, profile.weeklyHours)),
        credits: todo.reduce((s, c) => s + c.credits, 0),
        sequence: todo.map((c) => courseRef(cat, c.id)),
      };
    }),
  });
});

roadmapRouter.post('/generate', async (req, res) => {
  const { pathSlug } = z.object({ pathSlug: z.string().max(60).nullable().optional() }).parse(req.body ?? {});
  const { db, cat, profile } = await learner(req);
  await regenerate(db, cat, profile, pathSlug);
  res.json(await respond(req));
});

/** Works for any course; completing a course unlocks roadmap courses whose prerequisites are now satisfied. */
roadmapRouter.post('/courses/:key/complete', async (req, res) => {
  const { completed } = z.object({ completed: z.boolean() }).parse(req.body);
  const ctx = await requireRoadmap(req);
  const course = findCourse(ctx.cat, String(req.params.key));
  const before = statusSnapshot(ctx);
  if (completed) {
    const source = ctx.roadmap.items.some((i) => i.courseId === course.id) ? 'roadmap' : 'library';
    await ctx.db.query(
      'INSERT INTO user_completed_courses (user_id, course_id, source) VALUES ($1, $2, $3) ON CONFLICT (user_id, course_id) DO NOTHING',
      [req.userId, course.id, source],
    );
    // A completed course is no longer "skipped".
    await ctx.db.query('UPDATE roadmap_courses SET skipped = FALSE WHERE roadmap_id = $1 AND course_id = $2', [ctx.roadmap.id, course.id]);
  } else {
    await ctx.db.query('DELETE FROM user_completed_courses WHERE user_id = $1 AND course_id = $2', [req.userId, course.id]);
  }
  await ctx.db.query('UPDATE roadmaps SET updated_at = now() WHERE id = $1', [ctx.roadmap.id]);
  res.json(await respond(req, before));
});

roadmapRouter.post('/courses/:key/skip', async (req, res) => {
  const { skipped } = z.object({ skipped: z.boolean() }).parse(req.body);
  const ctx = await requireRoadmap(req);
  const course = findCourse(ctx.cat, String(req.params.key));
  if (!ctx.roadmap.items.some((i) => i.courseId === course.id)) throw new HttpError(404, 'That course is not in your roadmap');
  if (skipped && ctx.profile.completed.has(course.id)) throw new HttpError(409, 'You have already completed this course');
  const before = statusSnapshot(ctx);
  await ctx.db.query('UPDATE roadmap_courses SET skipped = $3 WHERE roadmap_id = $1 AND course_id = $2', [ctx.roadmap.id, course.id, skipped]);
  res.json(await respond(req, before));
});

/** Adds a course plus any prerequisites the learner is missing, keeping the order valid. */
roadmapRouter.post('/courses', async (req, res) => {
  const { courseId } = z.object({ courseId: z.union([z.number().int().positive(), z.string().min(2)]) }).parse(req.body);
  const ctx = await requireRoadmap(req);
  const course = findCourse(ctx.cat, String(courseId));
  if (ctx.roadmap.items.some((i) => i.courseId === course.id)) throw new HttpError(409, '{title} is already in your roadmap', { title: course.title });
  const levels = buildContext(ctx.cat, ctx.profile).levels;
  const have = new Set(ctx.roadmap.items.map((i) => i.courseId));
  const prereqs = missingPrereqClosure(ctx.cat, course.id, have, ctx.profile.completed, levels);
  const base = ctx.roadmap.items.length;
  const added = [
    ...prereqs.reverse().map((id, i) => ({ courseId: id, origin: 'prerequisite' as const, reasons: [{ type: 'prerequisite' as const, forCourseId: course.id }], priority: 0, position: base + i, skipped: false })),
    { courseId: course.id, origin: 'user' as const, reasons: [{ type: 'user_added' as const }], priority: 0, position: base + prereqs.length, skipped: false },
  ];
  const ordered = stableReorder(ctx.cat, [...ctx.roadmap.items, ...added]);
  await ctx.db.tx(async (q) => {
    for (const it of added) {
      await q.query(
        `INSERT INTO roadmap_courses (roadmap_id, course_id, position, origin, skipped, priority, reasons) VALUES ($1, $2, $3, $4, FALSE, 0, $5)`,
        [ctx.roadmap.id, it.courseId, it.position, it.origin, JSON.stringify(it.reasons)],
      );
    }
    await saveOrder(q, ctx.roadmap.id, ordered);
  });
  res.status(201).json({ ...(await respond(req)), added: added.map((a) => courseRef(ctx.cat, a.courseId)) });
});

roadmapRouter.delete('/courses/:key', async (req, res) => {
  const ctx = await requireRoadmap(req);
  const course = findCourse(ctx.cat, String(req.params.key));
  if (!ctx.roadmap.items.some((i) => i.courseId === course.id)) throw new HttpError(404, 'That course is not in your roadmap');
  const dependents = (ctx.cat.dependents.get(course.id) ?? []).filter((d) => ctx.roadmap.items.some((i) => i.courseId === d));
  await ctx.db.tx(async (q) => {
    await q.query('DELETE FROM roadmap_courses WHERE roadmap_id = $1 AND course_id = $2', [ctx.roadmap.id, course.id]);
    const remaining = ctx.roadmap.items.filter((i) => i.courseId !== course.id).map((i, position) => ({ ...i, position }));
    await saveOrder(q, ctx.roadmap.id, remaining);
  });
  res.json({ ...(await respond(req)), affected: dependents.map((d) => courseRef(ctx.cat, d)) });
});

/** Moves a course one step earlier/later, only when that keeps prerequisites before the courses that need them. */
roadmapRouter.post('/courses/:key/move', async (req, res) => {
  const { direction } = z.object({ direction: z.enum(['up', 'down']) }).parse(req.body);
  const ctx = await requireRoadmap(req);
  const course = findCourse(ctx.cat, String(req.params.key));
  const items = [...ctx.roadmap.items];
  const idx = items.findIndex((i) => i.courseId === course.id);
  if (idx < 0) throw new HttpError(404, 'That course is not in your roadmap');
  const other = direction === 'up' ? idx - 1 : idx + 1;
  if (other < 0 || other >= items.length) throw new HttpError(409, direction === 'up' ? 'It is already the first course' : 'It is already the last course');
  const [first, second] = direction === 'up' ? [items[other], items[idx]] : [items[idx], items[other]];
  // Swapping adjacent courses is only invalid when the earlier one is a direct prerequisite of the later one.
  if (ctx.cat.courses.get(second.courseId)!.prereqIds.includes(first.courseId)) {
    const a = ctx.cat.courses.get(first.courseId)!;
    const b = ctx.cat.courses.get(second.courseId)!;
    throw new HttpError(409, '{a} is a prerequisite of {b}, so it has to come first', { a: a.title, b: b.title });
  }
  [items[idx], items[other]] = [items[other], items[idx]];
  await ctx.db.tx((q) => saveOrder(q, ctx.roadmap.id, items.map((i, position) => ({ ...i, position }))));
  res.json(await respond(req));
});

roadmapRouter.put('/weekly-hours', async (req, res) => {
  const { weeklyHours } = z.object({ weeklyHours: z.number().int().min(1).max(80) }).parse(req.body);
  const { db } = await learner(req);
  await db.query('UPDATE users SET weekly_hours = $2, updated_at = now() WHERE id = $1', [req.userId, weeklyHours]);
  res.json(await respond(req));
});
