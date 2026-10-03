import type {
  Catalog, CareerPath, Course, GapGroup, GapItem, LearnerProfile, LevelInfo, Priority, SkillReq, Target, TargetSource,
} from './types.js';

export function levelWord(level: number): 'none' | 'beginner' | 'basic' | 'intermediate' | 'advanced' {
  if (level <= 0) return 'none';
  if (level <= 30) return 'beginner';
  if (level <= 55) return 'basic';
  if (level <= 80) return 'intermediate';
  return 'advanced';
}

/**
 * A learner's working skill level is the higher of what they self-reported and what their
 * completed courses teach – finishing a course is treated as evidence of its skills.
 */
export function effectiveLevels(cat: Catalog, profile: LearnerProfile): Map<number, LevelInfo> {
  const levels = new Map<number, LevelInfo>();
  for (const [skillId, level] of profile.selfSkills) levels.set(skillId, { level, self: level });
  for (const courseId of profile.completed) {
    const course = cat.courses.get(courseId);
    if (!course) continue;
    for (const s of course.skills) {
      const cur = levels.get(s.skillId) ?? { level: 0, self: 0 };
      if (s.gain > cur.level) levels.set(s.skillId, { level: s.gain, self: cur.self, viaCourseId: courseId });
    }
  }
  return levels;
}

export const levelOf = (levels: Map<number, LevelInfo>, skillId: number) => levels.get(skillId)?.level ?? 0;

export const gainOf = (course: Course, skillId: number) => course.skills.find((s) => s.skillId === skillId)?.gain ?? 0;

/** A course is "mastered" when the learner already has every skill it teaches at the level it teaches it. */
export function isMastered(course: Course, levels: Map<number, LevelInfo>): boolean {
  return course.skills.length > 0 && course.skills.every((s) => levelOf(levels, s.skillId) >= s.gain);
}

export type TargetScope = 'path' | 'career' | 'research';

/**
 * Required skills for a goal. Career requirements always apply; the selected path can raise them,
 * and research-oriented paths fold in the research direction's requirements (scaled by the path's research weight).
 */
export function buildTargets(
  cat: Catalog,
  opts: { careerId: number | null; researchId: number | null; path: CareerPath | null; scope?: TargetScope },
): Map<number, Target> {
  const scope = opts.scope ?? 'path';
  const targets = new Map<number, Target>();
  const add = (req: SkillReq, source: Omit<TargetSource, 'required' | 'weight'>) => {
    const src: TargetSource = { ...source, required: req.required, weight: req.weight };
    const t = targets.get(req.skillId);
    if (!t) {
      targets.set(req.skillId, { skillId: req.skillId, required: req.required, weight: req.weight, sources: [src] });
    } else {
      t.required = Math.max(t.required, req.required);
      t.weight = Math.max(t.weight, req.weight);
      t.sources.push(src);
    }
  };

  const career = opts.careerId ? cat.careers.get(opts.careerId) : undefined;
  const research = opts.researchId ? cat.research.get(opts.researchId) : undefined;

  if (scope !== 'research' && career) {
    for (const r of career.skills) add(r, { type: 'career', id: career.id, name: career.name });
  }
  if (scope === 'path' && opts.path) {
    for (const r of opts.path.skills) add(r, { type: 'path', id: opts.path.id, name: opts.path.name });
  }
  const researchWeight = scope === 'research' ? 1 : scope === 'path' ? (opts.path?.researchWeight ?? 0) : 0;
  if (research && researchWeight > 0) {
    for (const r of research.skills) {
      add({ ...r, weight: Math.round(r.weight * researchWeight * 100) / 100 }, { type: 'research', id: research.id, name: research.name });
    }
  }
  return targets;
}

const GROUP_ORDER: Record<GapGroup, number> = { critical: 0, improve: 1, ready: 2 };

/**
 * Compares current levels with required levels.
 *  - gap% = how much of the required level is still missing
 *  - score = absolute gap × importance weight (drives priority and roadmap ordering)
 *  - critical = at least half the required level missing on an important skill
 */
export function analyzeGap(targets: Map<number, Target>, levels: Map<number, LevelInfo>): GapItem[] {
  const items: GapItem[] = [];
  for (const t of targets.values()) {
    const info = levels.get(t.skillId);
    const current = info?.level ?? 0;
    const gap = Math.max(0, t.required - current);
    const gapPct = t.required > 0 ? Math.round((gap / t.required) * 100) : 0;
    const score = Math.round(gap * t.weight * 10) / 10;
    let group: GapGroup = 'ready';
    if (gap > 0) group = gapPct >= 50 && t.weight >= 0.6 ? 'critical' : 'improve';
    const priority: Priority = gap === 0 ? 'Low' : score >= 35 ? 'High' : score >= 15 ? 'Medium' : 'Low';
    items.push({
      skillId: t.skillId, current, required: t.required, gap, gapPct, weight: t.weight, score, priority, group,
      sources: [...t.sources].sort((a, b) => b.weight - a.weight),
      viaCourseId: info?.viaCourseId,
    });
  }
  return items.sort((a, b) => GROUP_ORDER[a.group] - GROUP_ORDER[b.group] || b.score - a.score || b.required - a.required || a.skillId - b.skillId);
}

/** Weighted share of required skill that the learner already has (0-100). */
export function readiness(gaps: GapItem[]): number {
  let num = 0;
  let den = 0;
  for (const g of gaps) {
    num += g.weight * Math.min(1, g.required ? g.current / g.required : 1);
    den += g.weight;
  }
  return den ? Math.round((num / den) * 100) : 100;
}
