import type { Career, CareerPath, Catalog, Course, GapItem, Research } from '../engine/types.js';

export const skillRef = (cat: Catalog, id: number) => {
  const s = cat.skills.get(id)!;
  return { id: s.id, slug: s.slug, name: s.name, category: s.category };
};

export const courseRef = (cat: Catalog, id: number) => {
  const c = cat.courses.get(id)!;
  return { id: c.id, code: c.code, title: c.title };
};

export const careerRef = (c: Career) => ({ id: c.id, slug: c.slug, name: c.name, icon: c.icon });
export const researchRef = (r: Research) => ({ id: r.id, slug: r.slug, name: r.name, icon: r.icon });
export const pathRef = (p: CareerPath) => ({ id: p.id, slug: p.slug, name: p.name, kind: p.kind, description: p.description });

/** Compact course shape used in lists, graphs and the library. */
export function courseSummary(cat: Catalog, c: Course) {
  return {
    id: c.id,
    code: c.code,
    title: c.title,
    category: c.category,
    difficulty: c.difficulty,
    credits: c.credits,
    hours: c.hours,
    kind: c.kind,
    summary: c.summary,
    prerequisites: c.prereqIds.map((p) => courseRef(cat, p)),
    skills: c.skills.map((s) => ({ ...skillRef(cat, s.skillId), gain: s.gain })),
    careers: c.careers.map((l) => ({ ...careerRef(cat.careers.get(l.careerId)!), relevance: l.relevance })),
    research: c.research.map((l) => ({ ...researchRef(cat.research.get(l.researchId)!), relevance: l.relevance })),
  };
}

export function gapView(cat: Catalog, g: GapItem, closingCourseId?: number) {
  return {
    skill: skillRef(cat, g.skillId),
    current: g.current,
    required: g.required,
    gap: g.gap,
    gapPct: g.gapPct,
    weight: g.weight,
    score: g.score,
    priority: g.priority,
    group: g.group,
    sources: g.sources.map((s) => ({ type: s.type, name: s.name, required: s.required })),
    viaCourse: g.viaCourseId ? courseRef(cat, g.viaCourseId) : null,
    closingCourse: closingCourseId ? courseRef(cat, closingCourseId) : null,
  };
}
