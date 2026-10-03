import crypto from 'node:crypto';
import { VI_CAREERS, VI_COURSES, VI_PATHS, VI_PROJECTS, VI_RESEARCH, VI_SKILLS } from '../data/vi.js';
import type { Queryable } from './client.js';

type Row = [entity: string, refId: number, field: string, value: string | string[]];

async function buildViRows(q: Queryable): Promise<Row[]> {
  const rows: Row[] = [];
  const ids = async (sql: string) => new Map((await q.query<{ k: string; id: number }>(sql)).map((r) => [r.k, r.id]));

  const skills = await ids('SELECT slug AS k, id FROM skills');
  for (const [slug, [name, description]] of Object.entries(VI_SKILLS)) {
    const id = skills.get(slug);
    if (id) rows.push(['skill', id, 'name', name], ['skill', id, 'description', description]);
  }

  const courses = await ids('SELECT code AS k, id FROM courses');
  for (const [code, [title, summary, description, outcomes]] of Object.entries(VI_COURSES)) {
    const id = courses.get(code);
    if (id) rows.push(['course', id, 'title', title], ['course', id, 'summary', summary], ['course', id, 'description', description], ['course', id, 'outcomes', outcomes]);
  }

  const careers = await ids('SELECT slug AS k, id FROM careers');
  for (const [slug, [name, tagline, description, portfolio]] of Object.entries(VI_CAREERS)) {
    const id = careers.get(slug);
    if (id) rows.push(['career', id, 'name', name], ['career', id, 'tagline', tagline], ['career', id, 'description', description], ['career', id, 'portfolio', portfolio]);
  }

  const paths = await q.query<{ id: number; slug: string; kind: string; career: string }>(
    'SELECT p.id, p.slug, p.kind, c.slug AS career FROM career_paths p JOIN careers c ON c.id = p.career_id',
  );
  for (const p of paths) {
    const career = VI_CAREERS[p.career];
    if (!career) continue;
    if (p.kind === 'specialization') {
      rows.push(['path', p.id, 'name', career[4]], ['path', p.id, 'description', career[5]]);
    } else {
      const t = VI_PATHS[p.kind as 'standard' | 'research'];
      rows.push(['path', p.id, 'name', t.name], ['path', p.id, 'description', t.description(career[0])]);
    }
  }

  const research = await ids('SELECT slug AS k, id FROM research_directions');
  for (const [slug, [name, description]] of Object.entries(VI_RESEARCH)) {
    const id = research.get(slug);
    if (id) rows.push(['research', id, 'name', name], ['research', id, 'description', description]);
  }

  const projects = await ids('SELECT slug AS k, id FROM projects');
  for (const [slug, [title, summary, description, outcomes]] of Object.entries(VI_PROJECTS)) {
    const id = projects.get(slug);
    if (id) rows.push(['project', id, 'title', title], ['project', id, 'summary', summary], ['project', id, 'description', description], ['project', id, 'outcomes', outcomes]);
  }
  return rows;
}

/** (Re)seeds the Vietnamese catalog text whenever data/vi.ts changes, so edits show up on the next start. */
export async function syncTranslations(db: { query: Queryable['query']; tx<T>(fn: (q: Queryable) => Promise<T>): Promise<T> }) {
  const version = crypto
    .createHash('sha256')
    .update(JSON.stringify([VI_SKILLS, VI_COURSES, VI_CAREERS, VI_RESEARCH, VI_PROJECTS, VI_PATHS.standard.name, VI_PATHS.research.name, VI_PATHS.standard.description('·')]))
    .digest('hex')
    .slice(0, 16);
  const [current] = await db.query<{ value: string }>(`SELECT value FROM app_meta WHERE key = 'translations_vi'`);
  if (current?.value === version) return false;

  await db.tx(async (q) => {
    const rows = await buildViRows(q);
    await q.query(`DELETE FROM catalog_translations WHERE lang = 'vi'`);
    for (const [entity, refId, field, value] of rows) {
      await q.query(
        `INSERT INTO catalog_translations (entity, ref_id, lang, field, value) VALUES ($1, $2, 'vi', $3, $4)`,
        [entity, refId, field, JSON.stringify(value)],
      );
    }
    await q.query(
      `INSERT INTO app_meta (key, value) VALUES ('translations_vi', $1) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
      [version],
    );
  });
  console.log('[db] Synced Vietnamese catalog translations');
  return true;
}
