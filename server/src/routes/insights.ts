import { Router } from 'express';
import { z } from 'zod';
import { buildContext } from '../engine/context.js';
import { learningStage, rankProjects, recommendedProject, type ProjectFit } from '../engine/projects.js';
import { generateRoadmap } from '../engine/roadmap.js';
import { analyzeGap, readiness } from '../engine/skills.js';
import type { Catalog } from '../engine/types.js';
import { requireAuth } from '../middleware/auth.js';
import { HttpError } from '../middleware/errors.js';
import { ensureRoadmap, roadmapView } from '../services/roadmapService.js';
import { careerRef, courseRef, gapView, pathRef, researchRef, skillRef } from '../services/serialize.js';
import { projectSummary } from './catalog.js';
import { learner } from './helpers.js';

export const insightsRouter = Router();
insightsRouter.use(requireAuth);

function fitView(cat: Catalog, f: ProjectFit) {
  return {
    ...projectSummary(cat, f.project),
    readiness: f.readiness,
    status: f.status,
    relevance: f.relevance,
    skills: f.skills.map((s) => ({ ...skillRef(cat, s.skillId), required: s.required, current: s.current, met: s.met })),
    missingCourses: f.missingCourseIds.map((id) => courseRef(cat, id)),
  };
}

/** Skill gap analysis: current vs required for the active path, the career alone, or the research direction alone. */
insightsRouter.get('/gap', async (req, res) => {
  const scope = z.enum(['path', 'career', 'research']).catch('path').parse(req.query.scope);
  const { db, cat, profile } = await learner(req);
  if (!profile.careerId) throw new HttpError(409, 'Choose a career goal first');
  if (scope === 'research' && !profile.researchId) throw new HttpError(409, 'Choose a research direction first');
  const roadmap = await ensureRoadmap(db, cat, profile);
  const path = roadmap ? cat.paths.get(roadmap.pathId)! : cat.careers.get(profile.careerId)!.paths[0];
  const ctx = buildContext(cat, profile, path, scope);
  const gaps = analyzeGap(ctx.targets, ctx.levels);
  const plan = generateRoadmap(cat, profile, path).skillPlan;
  const counts = { critical: 0, improve: 0, ready: 0 };
  for (const g of gaps) counts[g.group] += 1;

  res.json({
    scope,
    career: ctx.career ? careerRef(ctx.career) : null,
    research: ctx.research ? researchRef(ctx.research) : null,
    path: pathRef(path),
    readiness: readiness(gaps),
    counts,
    items: gaps.map((g) => gapView(cat, g, plan.get(g.skillId))),
  });
});

insightsRouter.get('/dashboard', async (req, res) => {
  const { db, cat, user, profile } = await learner(req);
  const roadmap = await ensureRoadmap(db, cat, profile);
  if (!roadmap) {
    res.json({ user: { fullName: user.full_name }, roadmap: null });
    return;
  }
  const view = roadmapView(cat, profile, roadmap);
  const path = cat.paths.get(roadmap.pathId)!;
  const ctx = buildContext(cat, profile, path);
  const gaps = analyzeGap(ctx.targets, ctx.levels);
  const rec = recommendedProject(ctx);
  const byId = new Map(view.items.map((i) => [i.course.id, i]));
  const compact = (id: number | null) => {
    const it = id ? byId.get(id) : undefined;
    return it
      ? { course: { id: it.course.id, code: it.course.code, title: it.course.title, category: it.course.category, hours: it.course.hours, difficulty: it.course.difficulty }, reason: it.reason, schedule: it.schedule, status: it.status }
      : null;
  };

  res.json({
    user: { fullName: user.full_name, major: user.major, university: user.university, yearOfStudy: user.year_of_study },
    goal: { career: view.career, research: view.research, path: view.path },
    weeklyHours: profile.weeklyHours,
    progress: view.progress,
    current: compact(view.currentCourseId),
    next: compact(view.nextCourseId),
    gap: {
      readiness: readiness(gaps),
      critical: gaps.filter((g) => g.group === 'critical').length,
      improve: gaps.filter((g) => g.group === 'improve').length,
      ready: gaps.filter((g) => g.group === 'ready').length,
      topCritical: gaps.filter((g) => g.group === 'critical').slice(0, 3).map((g) => cat.skills.get(g.skillId)!.name),
    },
    stage: learningStage(ctx),
    recommendedProject: rec ? fitView(cat, rec) : null,
    preview: view.items.map((i) => ({ id: i.course.id, code: i.course.code, title: i.course.title, category: i.course.category, status: i.status, kind: i.course.kind })),
    checklist: view.items
      .filter((i) => i.status !== 'skipped')
      .map((i) => ({ id: i.course.id, code: i.course.code, title: i.course.title, hours: i.course.hours, category: i.course.category, status: i.status, reason: i.reason })),
  });
});

insightsRouter.get('/projects', async (req, res) => {
  const { db, cat, profile } = await learner(req);
  const roadmap = await ensureRoadmap(db, cat, profile);
  const ctx = buildContext(cat, profile, roadmap ? cat.paths.get(roadmap.pathId)! : undefined);
  const ranked = rankProjects(ctx);
  const rec = recommendedProject(ctx);
  res.json({
    stage: learningStage(ctx),
    recommendedId: rec?.project.id ?? null,
    projects: ranked.map((f) => fitView(cat, f)),
  });
});
