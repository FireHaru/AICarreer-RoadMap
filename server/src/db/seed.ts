import bcrypt from 'bcryptjs';
import type { Queryable } from './client.js';
import { SKILLS } from '../data/skills.js';
import { COURSES } from '../data/courses.js';
import { CAREERS, RESEARCH, pathsFor, type Req } from '../data/careers.js';
import { PROJECTS } from '../data/projects.js';

/** Demo account seeded on first start (local test data – documented in the README). */
export const DEMO_USER = {
  email: 'demo@pathforge.dev',
  password: 'pathforge123',
  fullName: 'Alex Tran',
  university: 'University of Science',
  major: 'Physics',
  yearOfStudy: 3,
  gpa: 3.4,
  weeklyHours: 12,
  career: 'ai-engineer',
  research: 'computational-physics',
  secondaryResearch: ['computer-vision'],
  skills: { calculus: 75, linalg: 55, physics: 80, quantum: 45, probstat: 45, comp_physics: 30, python: 35, data_analysis: 25 } as Record<string, number>,
  completed: ['MA101', 'PH101', 'CS101', 'MA110'],
};

type IdMap = Map<string, number>;

function lookup(map: IdMap, key: string, what: string): number {
  const id = map.get(key);
  if (id === undefined) throw new Error(`Seed data error: unknown ${what} "${key}"`);
  return id;
}

async function insertReqs(q: Queryable, table: string, ownerCol: string, ownerId: number, reqs: Req[], skillIds: IdMap) {
  for (const [slug, required, weight] of reqs) {
    await q.query(
      `INSERT INTO ${table} (${ownerCol}, skill_id, required_level, weight) VALUES ($1, $2, $3, $4)
       ON CONFLICT (${ownerCol}, skill_id) DO UPDATE SET required_level = EXCLUDED.required_level, weight = EXCLUDED.weight`,
      [ownerId, lookup(skillIds, slug, 'skill'), required, weight],
    );
  }
}

export async function seedCatalog(q: Queryable) {
  const skillIds: IdMap = new Map();
  for (const s of SKILLS) {
    const [row] = await q.query<{ id: number }>(
      'INSERT INTO skills (slug, name, category, description) VALUES ($1, $2, $3, $4) RETURNING id',
      [s.slug, s.name, s.category, s.description],
    );
    skillIds.set(s.slug, row.id);
  }

  const courseIds: IdMap = new Map();
  for (const c of COURSES) {
    const [row] = await q.query<{ id: number }>(
      `INSERT INTO courses (code, title, category, difficulty, credits, hours, kind, summary, description, outcomes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
      [c.code, c.title, c.category, c.difficulty, c.credits, c.hours, c.kind ?? 'course', c.summary, c.description, JSON.stringify(c.outcomes)],
    );
    courseIds.set(c.code, row.id);
  }
  for (const c of COURSES) {
    const id = courseIds.get(c.code)!;
    for (const p of c.prereqs) {
      await q.query('INSERT INTO course_prerequisites (course_id, prerequisite_id) VALUES ($1, $2)', [id, lookup(courseIds, p, 'course')]);
    }
    for (const [slug, gain] of Object.entries(c.skills)) {
      await q.query('INSERT INTO course_skills (course_id, skill_id, gain_level) VALUES ($1, $2, $3)', [id, lookup(skillIds, slug, 'skill'), gain]);
    }
  }

  const careerIds: IdMap = new Map();
  for (const c of CAREERS) {
    const [row] = await q.query<{ id: number }>(
      'INSERT INTO careers (slug, name, icon, tagline, description, portfolio) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      [c.slug, c.name, c.icon, c.tagline, c.description, JSON.stringify(c.portfolio)],
    );
    careerIds.set(c.slug, row.id);
    await insertReqs(q, 'career_skills', 'career_id', row.id, c.skills, skillIds);
    for (const [relevance, codes] of [['core', c.core], ['elective', c.elective]] as const) {
      for (const code of codes) {
        await q.query('INSERT INTO career_courses (career_id, course_id, relevance) VALUES ($1, $2, $3)', [row.id, lookup(courseIds, code, 'course'), relevance]);
      }
    }
    for (const [i, p] of pathsFor(c).entries()) {
      const [path] = await q.query<{ id: number }>(
        `INSERT INTO career_paths (career_id, slug, name, kind, description, research_weight, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
        [row.id, p.slug, p.name, p.kind, p.description, p.researchWeight, i],
      );
      await insertReqs(q, 'career_path_skills', 'path_id', path.id, p.skills, skillIds);
      for (const code of p.courses) {
        await q.query('INSERT INTO career_path_courses (path_id, course_id) VALUES ($1, $2)', [path.id, lookup(courseIds, code, 'course')]);
      }
    }
  }

  const researchIds: IdMap = new Map();
  for (const r of RESEARCH) {
    const [row] = await q.query<{ id: number }>(
      'INSERT INTO research_directions (slug, name, icon, description) VALUES ($1, $2, $3, $4) RETURNING id',
      [r.slug, r.name, r.icon, r.description],
    );
    researchIds.set(r.slug, row.id);
    await insertReqs(q, 'research_skills', 'research_id', row.id, r.skills, skillIds);
    for (const [relevance, codes] of [['core', r.core], ['elective', r.elective]] as const) {
      for (const code of codes) {
        await q.query('INSERT INTO research_courses (research_id, course_id, relevance) VALUES ($1, $2, $3)', [row.id, lookup(courseIds, code, 'course'), relevance]);
      }
    }
  }

  for (const p of PROJECTS) {
    const [row] = await q.query<{ id: number }>(
      'INSERT INTO projects (slug, title, level, hours, summary, description, outcomes) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
      [p.slug, p.title, p.level, p.hours, p.summary, p.description, JSON.stringify(p.outcomes)],
    );
    for (const [slug, level] of Object.entries(p.skills)) {
      await q.query('INSERT INTO project_skills (project_id, skill_id, required_level) VALUES ($1, $2, $3)', [row.id, lookup(skillIds, slug, 'skill'), level]);
    }
    for (const code of p.courses) {
      await q.query('INSERT INTO project_courses (project_id, course_id) VALUES ($1, $2)', [row.id, lookup(courseIds, code, 'course')]);
    }
    for (const slug of p.careers) {
      await q.query('INSERT INTO project_careers (project_id, career_id) VALUES ($1, $2)', [row.id, lookup(careerIds, slug, 'career')]);
    }
    for (const slug of p.research) {
      await q.query('INSERT INTO project_research (project_id, research_id) VALUES ($1, $2)', [row.id, lookup(researchIds, slug, 'research direction')]);
    }
  }

  return { skillIds, courseIds, careerIds, researchIds };
}

async function seedDemoUser(q: Queryable, ids: Awaited<ReturnType<typeof seedCatalog>>) {
  const d = DEMO_USER;
  const hash = await bcrypt.hash(d.password, 10);
  const [user] = await q.query<{ id: number }>(
    `INSERT INTO users (email, password_hash, full_name, university, major, year_of_study, gpa, weekly_hours,
                        primary_career_id, primary_research_id, onboarded)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, TRUE) RETURNING id`,
    [d.email, hash, d.fullName, d.university, d.major, d.yearOfStudy, d.gpa, d.weeklyHours,
      ids.careerIds.get(d.career), ids.researchIds.get(d.research)],
  );
  for (const [slug, level] of Object.entries(d.skills)) {
    await q.query('INSERT INTO user_skills (user_id, skill_id, level) VALUES ($1, $2, $3)', [user.id, ids.skillIds.get(slug), level]);
  }
  for (const code of d.completed) {
    await q.query(`INSERT INTO user_completed_courses (user_id, course_id, source) VALUES ($1, $2, 'onboarding')`, [user.id, ids.courseIds.get(code)]);
  }
  for (const slug of d.secondaryResearch) {
    await q.query(`INSERT INTO user_interests (user_id, kind, ref_id) VALUES ($1, 'research', $2)`, [user.id, ids.researchIds.get(slug)]);
  }
}

export async function seedIfEmpty(db: { query: Queryable['query']; tx<T>(fn: (q: Queryable) => Promise<T>): Promise<T> }) {
  const [{ count }] = await db.query<{ count: number }>('SELECT count(*)::int AS count FROM skills');
  if (count > 0) return false;
  await db.tx(async (q) => {
    const ids = await seedCatalog(q);
    await seedDemoUser(q, ids);
  });
  console.log('[db] Seeded catalog and demo account (%s)', DEMO_USER.email);
  return true;
}
