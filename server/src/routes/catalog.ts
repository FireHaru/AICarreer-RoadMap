import { Router } from 'express';
import { COURSE_CATEGORIES } from '../data/courses.js';
import { MAJORS, majorLabel } from '../data/majors.js';
import { buildContext } from '../engine/context.js';
import { explainOutsideCourse, explainRoadmapCourse } from '../engine/explain.js';
import { projectFit } from '../engine/projects.js';
import { computeStatuses, generateRoadmap } from '../engine/roadmap.js';
import { analyzeGap, levelOf, readiness } from '../engine/skills.js';
import type { Catalog, Project } from '../engine/types.js';
import { optionalAuth } from '../middleware/auth.js';
import { HttpError } from '../middleware/errors.js';
import { ensureRoadmap, previewFromGenerated, resolvePath } from '../services/roadmapService.js';
import { careerRef, courseRef, courseSummary, pathRef, researchRef, skillRef } from '../services/serialize.js';
import { findCourse, maybeLearner } from './helpers.js';

export const catalogRouter = Router();
catalogRouter.use(optionalAuth);

export function projectSummary(cat: Catalog, p: Project) {
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    level: p.level,
    hours: p.hours,
    summary: p.summary,
    description: p.description,
    outcomes: p.outcomes,
    skills: p.skills.map((s) => ({ ...skillRef(cat, s.skillId), required: s.required })),
    courses: p.courseIds.map((id) => courseRef(cat, id)),
    careers: p.careerIds.map((id) => careerRef(cat.careers.get(id)!)),
    research: p.researchIds.map((id) => researchRef(cat.research.get(id)!)),
  };
}

/** Reference data the client needs everywhere: skills, careers, research directions, majors. */
catalogRouter.get('/meta', async (req, res) => {
  const { cat } = await maybeLearner(req);
  res.json({
    skills: [...cat.skills.values()].map((s) => ({ ...skillRef(cat, s.id), description: s.description })),
    careers: [...cat.careers.values()].map((c) => ({
      ...careerRef(c),
      tagline: c.tagline,
      paths: c.paths.map(pathRef),
      topSkills: c.skills.slice(0, 5).map((s) => cat.skills.get(s.skillId)!.name),
    })),
    research: [...cat.research.values()].map((r) => ({ ...researchRef(r), description: r.description })),
    majors: MAJORS.map((m) => ({ name: m.name, label: majorLabel(m.name, cat.lang), baseline: Object.fromEntries(Object.entries(m.baseline).map(([slug, v]) => [cat.skillsBySlug.get(slug)!.id, v])) })),
    categories: COURSE_CATEGORIES,
    difficulties: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
    courseCount: cat.courseList.length,
  });
});

catalogRouter.get('/courses', async (req, res) => {
  const { db, cat, profile } = await maybeLearner(req);
  const roadmap = profile.userId ? await ensureRoadmap(db, cat, profile) : null;
  const planned = new Map(roadmap?.items.map((i) => [i.courseId, i]) ?? []);
  const statuses = roadmap ? computeStatuses(cat, roadmap.items, profile.completed, buildContext(cat, profile).levels) : null;
  res.json({
    courses: cat.courseList.map((c) => ({
      ...courseSummary(cat, c),
      personal: profile.userId
        ? { completed: profile.completed.has(c.id), inRoadmap: planned.has(c.id), status: statuses?.get(c.id)?.status ?? null }
        : null,
    })),
  });
});

catalogRouter.get('/courses/:key', async (req, res) => {
  const { db, cat, profile } = await maybeLearner(req);
  const course = findCourse(cat, req.params.key);
  const dependents = (cat.dependents.get(course.id) ?? []).map((id) => courseSummary(cat, cat.courses.get(id)!));
  const projects = cat.projects.filter((p) => p.courseIds.includes(course.id)).map((p) => projectSummary(cat, p));

  let personal = null;
  if (profile.userId) {
    const roadmap = await ensureRoadmap(db, cat, profile);
    const path = roadmap ? cat.paths.get(roadmap.pathId)! : undefined;
    const ctx = buildContext(cat, profile, path);
    const item = roadmap?.items.find((i) => i.courseId === course.id);
    let status = profile.completed.has(course.id) ? 'completed' : null;
    let explanation;
    if (roadmap && item) {
      const st = computeStatuses(cat, roadmap.items, profile.completed, ctx.levels).get(course.id)!;
      status = st.status;
      explanation = explainRoadmapCourse(ctx, item, st, new Map(roadmap.items.map((i) => [i.courseId, i])));
    } else {
      explanation = explainOutsideCourse(ctx, course);
    }
    personal = {
      completed: profile.completed.has(course.id),
      inRoadmap: Boolean(item),
      skipped: item?.skipped ?? false,
      status,
      explanation,
      weeklyHours: profile.weeklyHours,
      levels: Object.fromEntries(course.skills.map((s) => [s.skillId, levelOf(ctx.levels, s.skillId)])),
      prereqCompleted: course.prereqIds.filter((p) => profile.completed.has(p)),
    };
  }

  res.json({
    course: { ...courseSummary(cat, course), description: course.description, outcomes: course.outcomes },
    prerequisites: course.prereqIds.map((id) => courseSummary(cat, cat.courses.get(id)!)),
    dependents,
    projects,
    personal,
  });
});

catalogRouter.get('/careers', async (req, res) => {
  const { cat } = await maybeLearner(req);
  res.json({
    careers: [...cat.careers.values()].map((c) => ({
      ...careerRef(c),
      tagline: c.tagline,
      description: c.description,
      skills: c.skills.map((s) => ({ ...skillRef(cat, s.skillId), required: s.required, weight: s.weight })),
      courseCount: c.courses.filter((x) => x.relevance === 'core').length,
    })),
  });
});

/** Reverse explorer: career → skills → courses → projects → portfolio, plus the roadmap this learner would get. */
catalogRouter.get('/careers/:slug', async (req, res) => {
  const { cat, profile } = await maybeLearner(req);
  const career = cat.careersBySlug.get(req.params.slug);
  if (!career) throw new HttpError(404, 'Career not found');
  const path = resolvePath(cat, career.id, typeof req.query.path === 'string' ? req.query.path : null);

  const asCandidate = { ...profile, careerId: career.id };
  const gen = generateRoadmap(cat, asCandidate, path);
  const ctx = buildContext(cat, asCandidate, path, 'career');
  const careerGaps = analyzeGap(ctx.targets, ctx.levels);

  const projects = cat.projects
    .filter((p) => p.careerIds.includes(career.id))
    .map((p) => {
      const fit = projectFit(ctx, p);
      return { ...projectSummary(cat, p), readiness: profile.userId ? fit.readiness : null, status: profile.userId ? fit.status : null };
    })
    .sort((a, b) => ['Beginner', 'Intermediate', 'Advanced', 'Research'].indexOf(a.level) - ['Beginner', 'Intermediate', 'Advanced', 'Research'].indexOf(b.level));

  res.json({
    career: { ...careerRef(career), tagline: career.tagline, description: career.description, portfolio: career.portfolio },
    skills: career.skills.map((s) => ({
      ...skillRef(cat, s.skillId),
      required: s.required,
      weight: s.weight,
      current: profile.userId ? levelOf(ctx.levels, s.skillId) : null,
    })),
    courses: {
      core: career.courses.filter((c) => c.relevance === 'core').map((c) => courseSummary(cat, cat.courses.get(c.courseId)!)),
      elective: career.courses.filter((c) => c.relevance === 'elective').map((c) => courseSummary(cat, cat.courses.get(c.courseId)!)),
    },
    projects,
    paths: career.paths.map(pathRef),
    selectedPath: path.slug,
    personalized: Boolean(profile.userId),
    isCurrentGoal: profile.careerId === career.id,
    readiness: profile.userId ? readiness(careerGaps) : null,
    preview: previewFromGenerated(cat, asCandidate, gen),
  });
});

catalogRouter.get('/research', async (req, res) => {
  const { cat } = await maybeLearner(req);
  res.json({
    research: [...cat.research.values()].map((r) => ({
      ...researchRef(r),
      description: r.description,
      skills: r.skills.map((s) => ({ ...skillRef(cat, s.skillId), required: s.required, weight: s.weight })),
      courses: r.courses.map((c) => ({ ...courseRef(cat, c.courseId), relevance: c.relevance })),
    })),
  });
});
