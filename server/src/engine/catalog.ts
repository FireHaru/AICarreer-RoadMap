import type { Queryable } from '../db/client.js';
import type { Lang } from '../i18n.js';
import type { Catalog, Career, CareerPath, Course, Project, Research, Skill, SkillReq } from './types.js';

const cache = new Map<Lang, Catalog>();

function groupBy<T, K>(rows: T[], key: (r: T) => K): Map<K, T[]> {
  const m = new Map<K, T[]>();
  for (const r of rows) {
    const k = key(r);
    const list = m.get(k);
    if (list) list.push(r);
    else m.set(k, [r]);
  }
  return m;
}

const toReq = (r: any): SkillReq => ({ skillId: r.skill_id, required: r.required_level, weight: Number(r.weight) });

/** The catalog is static reference data, so it is loaded once per language and kept in memory. */
export async function loadCatalog(db: Queryable, lang: Lang = 'en', force = false): Promise<Catalog> {
  if (force) cache.clear();
  const hit = cache.get(lang);
  if (hit) return hit;
  if (lang !== 'en') {
    const base = await loadCatalog(db, 'en');
    const rows = await db.query<{ entity: string; ref_id: number; field: string; value: unknown }>(
      'SELECT entity, ref_id, field, value FROM catalog_translations WHERE lang = $1',
      [lang],
    );
    const localized = localize(base, lang, rows);
    cache.set(lang, localized);
    return localized;
  }

  const [skillRows, courseRows, prereqRows, courseSkillRows, careerRows, careerSkillRows, careerCourseRows,
    researchRows, researchSkillRows, researchCourseRows, pathRows, pathSkillRows, pathCourseRows,
    projectRows, projectSkillRows, projectCourseRows, projectCareerRows, projectResearchRows] = await Promise.all([
    db.query('SELECT * FROM skills ORDER BY id'),
    db.query('SELECT * FROM courses ORDER BY code'),
    db.query('SELECT * FROM course_prerequisites'),
    db.query('SELECT * FROM course_skills'),
    db.query('SELECT * FROM careers ORDER BY id'),
    db.query('SELECT * FROM career_skills'),
    db.query('SELECT * FROM career_courses'),
    db.query('SELECT * FROM research_directions ORDER BY id'),
    db.query('SELECT * FROM research_skills'),
    db.query('SELECT * FROM research_courses'),
    db.query('SELECT * FROM career_paths ORDER BY career_id, sort_order'),
    db.query('SELECT * FROM career_path_skills'),
    db.query('SELECT * FROM career_path_courses'),
    db.query('SELECT * FROM projects ORDER BY id'),
    db.query('SELECT * FROM project_skills'),
    db.query('SELECT * FROM project_courses'),
    db.query('SELECT * FROM project_careers'),
    db.query('SELECT * FROM project_research'),
  ]);

  const skills = new Map<number, Skill>(skillRows.map((s) => [s.id, { id: s.id, slug: s.slug, name: s.name, category: s.category, description: s.description }]));

  const prereqs = groupBy(prereqRows, (r) => r.course_id);
  const cSkills = groupBy(courseSkillRows, (r) => r.course_id);
  const careerLinks = groupBy(careerCourseRows, (r) => r.course_id);
  const researchLinks = groupBy(researchCourseRows, (r) => r.course_id);

  const courseList: Course[] = courseRows.map((c) => ({
    id: c.id,
    code: c.code,
    title: c.title,
    category: c.category,
    difficulty: c.difficulty,
    credits: c.credits,
    hours: c.hours,
    kind: c.kind,
    summary: c.summary,
    description: c.description,
    outcomes: c.outcomes,
    prereqIds: (prereqs.get(c.id) ?? []).map((p) => p.prerequisite_id),
    skills: (cSkills.get(c.id) ?? []).map((s) => ({ skillId: s.skill_id, gain: s.gain_level })).sort((a, b) => b.gain - a.gain),
    careers: (careerLinks.get(c.id) ?? []).map((l) => ({ careerId: l.career_id, relevance: l.relevance })),
    research: (researchLinks.get(c.id) ?? []).map((l) => ({ researchId: l.research_id, relevance: l.relevance })),
  }));
  const courses = new Map(courseList.map((c) => [c.id, c]));

  const dependents = new Map<number, number[]>();
  for (const c of courseList) {
    for (const p of c.prereqIds) {
      const list = dependents.get(p);
      if (list) list.push(c.id);
      else dependents.set(p, [c.id]);
    }
  }

  const pathSkills = groupBy(pathSkillRows, (r) => r.path_id);
  const pathCourses = groupBy(pathCourseRows, (r) => r.path_id);
  const paths = new Map<number, CareerPath>(
    pathRows.map((p) => [p.id, {
      id: p.id,
      careerId: p.career_id,
      slug: p.slug,
      name: p.name,
      kind: p.kind,
      description: p.description,
      researchWeight: Number(p.research_weight),
      sortOrder: p.sort_order,
      skills: (pathSkills.get(p.id) ?? []).map(toReq),
      courseIds: (pathCourses.get(p.id) ?? []).map((r) => r.course_id),
    }]),
  );
  const pathsByCareer = groupBy([...paths.values()], (p) => p.careerId);

  const careerSkills = groupBy(careerSkillRows, (r) => r.career_id);
  const careerCourses = groupBy(careerCourseRows, (r) => r.career_id);
  const careers = new Map<number, Career>(
    careerRows.map((c) => [c.id, {
      id: c.id,
      slug: c.slug,
      name: c.name,
      icon: c.icon,
      tagline: c.tagline,
      description: c.description,
      portfolio: c.portfolio,
      skills: (careerSkills.get(c.id) ?? []).map(toReq).sort((a, b) => b.weight - a.weight || b.required - a.required),
      courses: (careerCourses.get(c.id) ?? []).map((r) => ({ courseId: r.course_id, relevance: r.relevance })),
      paths: (pathsByCareer.get(c.id) ?? []).sort((a, b) => a.sortOrder - b.sortOrder),
    }]),
  );

  const researchSkills = groupBy(researchSkillRows, (r) => r.research_id);
  const researchCourses = groupBy(researchCourseRows, (r) => r.research_id);
  const research = new Map<number, Research>(
    researchRows.map((r) => [r.id, {
      id: r.id,
      slug: r.slug,
      name: r.name,
      icon: r.icon,
      description: r.description,
      skills: (researchSkills.get(r.id) ?? []).map(toReq).sort((a, b) => b.weight - a.weight || b.required - a.required),
      courses: (researchCourses.get(r.id) ?? []).map((x) => ({ courseId: x.course_id, relevance: x.relevance })),
    }]),
  );

  const pSkills = groupBy(projectSkillRows, (r) => r.project_id);
  const pCourses = groupBy(projectCourseRows, (r) => r.project_id);
  const pCareers = groupBy(projectCareerRows, (r) => r.project_id);
  const pResearch = groupBy(projectResearchRows, (r) => r.project_id);
  const projects: Project[] = projectRows.map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    level: p.level,
    hours: p.hours,
    summary: p.summary,
    description: p.description,
    outcomes: p.outcomes,
    skills: (pSkills.get(p.id) ?? []).map((s) => ({ skillId: s.skill_id, required: s.required_level })),
    courseIds: (pCourses.get(p.id) ?? []).map((r) => r.course_id),
    careerIds: (pCareers.get(p.id) ?? []).map((r) => r.career_id),
    researchIds: (pResearch.get(p.id) ?? []).map((r) => r.research_id),
  }));

  const catalog: Catalog = {
    lang: 'en',
    skills,
    skillsBySlug: new Map([...skills.values()].map((s) => [s.slug, s])),
    courses,
    courseList,
    coursesByCode: new Map(courseList.map((c) => [c.code, c])),
    dependents,
    careers,
    careersBySlug: new Map([...careers.values()].map((c) => [c.slug, c])),
    research,
    researchBySlug: new Map([...research.values()].map((r) => [r.slug, r])),
    paths,
    projects,
  };
  cache.set('en', catalog);
  return catalog;
}

/** Copies the English catalog with translated text; ids, links and numbers are shared. */
function localize(base: Catalog, lang: Lang, rows: { entity: string; ref_id: number; field: string; value: unknown }[]): Catalog {
  const t = new Map<string, Record<string, any>>();
  for (const r of rows) {
    const key = `${r.entity}:${r.ref_id}`;
    const entry = t.get(key) ?? {};
    entry[r.field] = r.value;
    t.set(key, entry);
  }
  const over = <T extends object>(entity: string, id: number, obj: T): T => ({ ...obj, ...(t.get(`${entity}:${id}`) ?? {}) });

  const skills = new Map([...base.skills].map(([id, s]) => [id, over('skill', id, s)]));
  const courseList = base.courseList.map((c) => over('course', c.id, c));
  const courses = new Map(courseList.map((c) => [c.id, c]));
  const paths = new Map([...base.paths].map(([id, p]) => [id, over('path', id, p)]));
  const careers = new Map([...base.careers].map(([id, c]) => [id, { ...over('career', id, c), paths: c.paths.map((p) => paths.get(p.id)!) }]));
  const research = new Map([...base.research].map(([id, r]) => [id, over('research', id, r)]));
  const projects = base.projects.map((p) => over('project', p.id, p));

  return {
    lang,
    skills,
    skillsBySlug: new Map([...skills.values()].map((s) => [s.slug, s])),
    courses,
    courseList,
    coursesByCode: new Map(courseList.map((c) => [c.code, c])),
    dependents: base.dependents,
    careers,
    careersBySlug: new Map([...careers.values()].map((c) => [c.slug, c])),
    research,
    researchBySlug: new Map([...research.values()].map((r) => [r.slug, r])),
    paths,
    projects,
  };
}
