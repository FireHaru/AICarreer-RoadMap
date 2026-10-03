import { Router } from 'express';
import { z } from 'zod';
import type { Queryable } from '../db/client.js';
import { loadCatalog } from '../engine/catalog.js';
import type { Catalog } from '../engine/types.js';
import { requireAuth } from '../middleware/auth.js';
import { HttpError } from '../middleware/errors.js';
import { getUser, loadProfile, publicUser } from '../services/learner.js';
import { getActiveRoadmap, regenerate } from '../services/roadmapService.js';
import { learner } from './helpers.js';

export const meRouter = Router();
meRouter.use(requireAuth);

const profileSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  university: z.string().trim().max(150).nullable().optional(),
  major: z.string().trim().max(100).nullable().optional(),
  yearOfStudy: z.number().int().min(1).max(8).nullable().optional(),
  gpa: z.number().min(0).max(10).nullable().optional(),
  weeklyHours: z.number().int().min(1).max(80),
});
const skillsSchema = z.array(z.object({ skillId: z.number().int().positive(), level: z.number().int().min(0).max(100) })).max(200);
const completedSchema = z.array(z.number().int().positive()).max(200);
const goalsSchema = z.object({
  careerId: z.number().int().positive(),
  researchId: z.number().int().positive().nullable(),
  secondaryCareerIds: z.array(z.number().int().positive()).max(10).default([]),
  secondaryResearchIds: z.array(z.number().int().positive()).max(10).default([]),
  pathSlug: z.string().max(60).nullable().optional(),
});

function validateIds(cat: Catalog, data: { skills?: z.infer<typeof skillsSchema>; completed?: number[]; goals?: z.infer<typeof goalsSchema> }) {
  for (const s of data.skills ?? []) if (!cat.skills.has(s.skillId)) throw new HttpError(400, 'Unknown skill {id}', { id: s.skillId });
  for (const c of data.completed ?? []) if (!cat.courses.has(c)) throw new HttpError(400, 'Unknown course {id}', { id: c });
  const g = data.goals;
  if (g) {
    if (!cat.careers.has(g.careerId)) throw new HttpError(400, 'Unknown career');
    if (g.researchId && !cat.research.has(g.researchId)) throw new HttpError(400, 'Unknown research direction');
    for (const id of g.secondaryCareerIds) if (!cat.careers.has(id)) throw new HttpError(400, 'Unknown secondary career');
    for (const id of g.secondaryResearchIds) if (!cat.research.has(id)) throw new HttpError(400, 'Unknown secondary research direction');
  }
}

async function writeProfile(q: Queryable, userId: number, p: z.infer<typeof profileSchema>) {
  await q.query(
    `UPDATE users SET full_name = $2, university = $3, major = $4, year_of_study = $5, gpa = $6, weekly_hours = $7, updated_at = now()
     WHERE id = $1`,
    [userId, p.fullName, p.university ?? null, p.major ?? null, p.yearOfStudy ?? null, p.gpa ?? null, p.weeklyHours],
  );
}

async function writeSkills(q: Queryable, userId: number, skills: z.infer<typeof skillsSchema>) {
  await q.query('DELETE FROM user_skills WHERE user_id = $1', [userId]);
  for (const s of skills) {
    if (s.level > 0) await q.query('INSERT INTO user_skills (user_id, skill_id, level) VALUES ($1, $2, $3)', [userId, s.skillId, s.level]);
  }
}

async function writeCompleted(q: Queryable, userId: number, ids: number[], source: 'onboarding' | 'library') {
  const unique = [...new Set(ids)];
  await q.query('DELETE FROM user_completed_courses WHERE user_id = $1 AND NOT (course_id = ANY($2::int[]))', [userId, unique]);
  for (const id of unique) {
    await q.query(
      'INSERT INTO user_completed_courses (user_id, course_id, source) VALUES ($1, $2, $3) ON CONFLICT (user_id, course_id) DO NOTHING',
      [userId, id, source],
    );
  }
}

async function writeGoals(q: Queryable, userId: number, g: z.infer<typeof goalsSchema>) {
  await q.query('UPDATE users SET primary_career_id = $2, primary_research_id = $3, updated_at = now() WHERE id = $1', [userId, g.careerId, g.researchId]);
  await q.query('DELETE FROM user_interests WHERE user_id = $1', [userId]);
  for (const id of new Set(g.secondaryCareerIds.filter((c) => c !== g.careerId))) {
    await q.query(`INSERT INTO user_interests (user_id, kind, ref_id) VALUES ($1, 'career', $2)`, [userId, id]);
  }
  for (const id of new Set(g.secondaryResearchIds.filter((r) => r !== g.researchId))) {
    await q.query(`INSERT INTO user_interests (user_id, kind, ref_id) VALUES ($1, 'research', $2)`, [userId, id]);
  }
}

meRouter.get('/profile', async (req, res) => {
  const { user, profile } = await learner(req);
  res.json({
    user: publicUser(user),
    skills: [...profile.selfSkills].map(([skillId, level]) => ({ skillId, level })),
    completed: [...profile.completed],
    secondaryCareerIds: profile.secondaryCareerIds,
    secondaryResearchIds: profile.secondaryResearchIds,
  });
});

meRouter.put('/profile', async (req, res) => {
  const body = profileSchema.parse(req.body);
  const { db } = await learner(req);
  await writeProfile(db, req.userId!, body);
  res.json({ user: publicUser(await getUser(db, req.userId!)) });
});

meRouter.put('/skills', async (req, res) => {
  const skills = skillsSchema.parse(req.body.skills);
  const { db, cat } = await learner(req);
  validateIds(cat, { skills });
  await db.tx((q) => writeSkills(q, req.userId!, skills));
  res.json({ ok: true });
});

meRouter.put('/completed', async (req, res) => {
  const completed = completedSchema.parse(req.body.courseIds);
  const { db, cat } = await learner(req);
  validateIds(cat, { completed });
  await db.tx((q) => writeCompleted(q, req.userId!, completed, 'library'));
  res.json({ ok: true });
});

/** Changing the goal regenerates the roadmap (completed courses are always kept). */
meRouter.put('/goals', async (req, res) => {
  const goals = goalsSchema.parse(req.body);
  const { db, cat } = await learner(req);
  validateIds(cat, { goals });
  await db.tx((q) => writeGoals(q, req.userId!, goals));
  const { profile } = await loadProfile(db, req.userId!);
  const existing = await getActiveRoadmap(db, req.userId!);
  const keep = goals.pathSlug ?? (existing && existing.careerId === goals.careerId ? cat.paths.get(existing.pathId)?.slug : null);
  await regenerate(db, cat, profile, keep);
  res.json({ user: publicUser(await getUser(db, req.userId!)) });
});

/** Saves the whole onboarding wizard in one transaction and generates the first roadmap. */
meRouter.post('/onboarding', async (req, res) => {
  const body = z.object({
    profile: profileSchema,
    skills: skillsSchema,
    completed: completedSchema,
    goals: goalsSchema,
  }).parse(req.body);
  const { db } = await learner(req);
  const cat = await loadCatalog(db, req.lang);
  validateIds(cat, body);
  await db.tx(async (q) => {
    await writeProfile(q, req.userId!, body.profile);
    await writeSkills(q, req.userId!, body.skills);
    await writeCompleted(q, req.userId!, body.completed, 'onboarding');
    await writeGoals(q, req.userId!, body.goals);
    await q.query('UPDATE users SET onboarded = TRUE WHERE id = $1', [req.userId]);
  });
  const { profile } = await loadProfile(db, req.userId!);
  await regenerate(db, cat, profile, body.goals.pathSlug);
  res.json({ user: publicUser(await getUser(db, req.userId!)) });
});
