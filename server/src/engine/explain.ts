import { majorBaseline, majorLabel } from '../data/majors.js';
import type { EngineContext } from './context.js';
import { phrases } from './phrases.js';
import type { StatusInfo } from './roadmap.js';
import { gainOf, isMastered, levelOf } from './skills.js';
import type { AutoSkip, Course, PlanItem, Reason, Target, TargetSource } from './types.js';

export type BulletKind = 'gap' | 'met' | 'unlocks' | 'ready' | 'locked' | 'background' | 'research' | 'time' | 'skipped' | 'path' | 'info';

export interface Explanation {
  headline: string;
  bullets: { kind: BulletKind; text: string }[];
}

function mainSource(t: Target): TargetSource {
  return [...t.sources].sort((a, b) => b.weight - a.weight || (a.type === 'career' ? -1 : 1))[0];
}

function skillName(ctx: EngineContext, id: number) {
  return ctx.cat.skills.get(id)?.name ?? '';
}

function goalName(ctx: EngineContext) {
  return ctx.career?.name ?? phrases(ctx.cat.lang).goalFallback;
}

function timeText(ctx: EngineContext, course: Course) {
  const weeks = Math.max(1, Math.round(course.hours / Math.max(1, ctx.profile.weeklyHours)));
  return phrases(ctx.cat.lang).time(course.hours, weeks, ctx.profile.weeklyHours);
}

function skillReasonSentence(ctx: EngineContext, skillId: number) {
  const P = phrases(ctx.cat.lang);
  const t = ctx.targets.get(skillId);
  const name = skillName(ctx, skillId);
  if (!t) return P.buildsSkill(name);
  const src = mainSource(t);
  if (src.type === 'research') return P.becauseResearch(name, src.weight, src.name);
  if (src.type === 'path') return P.becausePath(name, src.name);
  return P.becauseCareer(name, src.weight, src.name);
}

function backgroundBullet(ctx: EngineContext, course: Course): string | null {
  if (!ctx.profile.major) return null;
  const base = majorBaseline(ctx.profile.major);
  const related = new Set<number>([...course.skills.map((s) => s.skillId)]);
  for (const p of course.prereqIds) for (const s of ctx.cat.courses.get(p)!.skills) related.add(s.skillId);
  const strong = [...related]
    .map((id) => ctx.cat.skills.get(id)!)
    .filter((s) => (base[s.slug] ?? 0) >= 50 && levelOf(ctx.levels, s.id) >= 50)
    .map((s) => s.name);
  if (!strong.length) return null;
  const P = phrases(ctx.cat.lang);
  return P.background(majorLabel(ctx.profile.major, ctx.cat.lang), P.join(strong.slice(0, 3)));
}

/** Personalised "Why is this course recommended?" for a course in the learner's roadmap. */
export function explainRoadmapCourse(ctx: EngineContext, item: PlanItem, status: StatusInfo, inRoadmap: Map<number, PlanItem>): Explanation {
  const { cat } = ctx;
  const P = phrases(cat.lang);
  const course = cat.courses.get(item.courseId)!;
  const bullets: Explanation['bullets'] = [];
  const sentences: string[] = [];
  const titles = (ids: number[]) => P.join(ids.map((id) => cat.courses.get(id)!.title));

  const gapReasons = item.reasons.filter((r): r is Extract<Reason, { type: 'skill_gap' }> => r.type === 'skill_gap');
  const rankedGaps = [...gapReasons].sort((a, b) => {
    const ta = ctx.targets.get(a.skillId);
    const tb = ctx.targets.get(b.skillId);
    const sa = ta ? (ta.required - levelOf(ctx.levels, a.skillId)) * ta.weight + ta.weight : 0;
    const sb = tb ? (tb.required - levelOf(ctx.levels, b.skillId)) * tb.weight + tb.weight : 0;
    return sb - sa;
  });
  const dependentsInRoadmap = (cat.dependents.get(course.id) ?? []).filter((d) => inRoadmap.has(d));
  const milestone = item.reasons.find((r) => r.type === 'path_milestone');

  if (status.status === 'completed') {
    sentences.push(P.completedEvidence(P.join(course.skills.map((s) => skillName(ctx, s.skillId)))));
    if (dependentsInRoadmap.length) sentences.push(P.unlocksSentence(titles(dependentsInRoadmap)));
  } else {
    if (rankedGaps.length) {
      sentences.push(skillReasonSentence(ctx, rankedGaps[0].skillId));
      if (rankedGaps.length > 1) sentences.push(P.alsoBuilds(P.join(rankedGaps.slice(1).map((r) => skillName(ctx, r.skillId)))));
    } else if (milestone && ctx.path) {
      sentences.push(P.milestone(ctx.path.name, goalName(ctx)));
    } else if (dependentsInRoadmap.length) {
      sentences.push(P.prerequisiteFor(titles(dependentsInRoadmap), goalName(ctx)));
    } else if (item.origin === 'user') {
      sentences.push(P.userAdded);
    } else {
      sentences.push(P.supportsGoal(goalName(ctx)));
    }

    // Readiness: what the learner already has, and whether they can start now.
    const satisfied = course.prereqIds.filter((p) => ctx.profile.completed.has(p) || isMastered(cat.courses.get(p)!, ctx.levels) || inRoadmap.get(p)?.skipped);
    const readySkills = [...new Set(satisfied.map((p) => cat.courses.get(p)!.skills[0]?.skillId).filter((x): x is number => x !== undefined))];
    const isCurrent = status.status === 'current';
    if (status.status === 'locked') {
      sentences.push(P.finishFirst(titles(status.unmet), status.unmet.length > 1));
    } else if (course.prereqIds.length === 0) {
      sentences.push(P.noPrereq(isCurrent));
    } else if (readySkills.length) {
      sentences.push(P.alreadyHave(P.join(readySkills.map((id) => P.skillAtLevel(skillName(ctx, id), levelOf(ctx.levels, id)))), isCurrent));
    } else {
      sentences.push(P.prereqsDone(isCurrent));
    }
  }

  for (const r of rankedGaps) {
    const t = ctx.targets.get(r.skillId);
    if (!t) continue;
    const cur = levelOf(ctx.levels, r.skillId);
    const src = mainSource(t);
    if (cur >= t.required) bullets.push({ kind: 'met', text: P.bulletMet(skillName(ctx, r.skillId), cur, t.required, src.name) });
    else bullets.push({ kind: 'gap', text: P.bulletGap(skillName(ctx, r.skillId), cur, gainOf(course, r.skillId), src.name, t.required) });
  }
  if (milestone && ctx.path && rankedGaps.length) bullets.push({ kind: 'path', text: P.bulletMilestone(ctx.path.name) });
  if (dependentsInRoadmap.length && status.status !== 'completed') bullets.push({ kind: 'unlocks', text: P.bulletUnlocks(titles(dependentsInRoadmap)) });
  for (const p of status.missing) bullets.push({ kind: 'locked', text: P.bulletRemoved(cat.courses.get(p)!.title) });
  const skippedPrereqs = course.prereqIds.filter((p) => !inRoadmap.has(p) && !ctx.profile.completed.has(p) && isMastered(cat.courses.get(p)!, ctx.levels));
  for (const p of skippedPrereqs) {
    const pc = cat.courses.get(p)!;
    const s = pc.skills[0];
    bullets.push({ kind: 'skipped', text: P.bulletAutoSkipped(pc.title, skillName(ctx, s.skillId), levelOf(ctx.levels, s.skillId)) });
  }
  const bg = backgroundBullet(ctx, course);
  if (bg && status.status !== 'completed') bullets.push({ kind: 'background', text: bg });
  if (ctx.research && course.research.some((l) => l.researchId === ctx.research!.id)) bullets.push({ kind: 'research', text: P.researchAlso(ctx.research.name) });
  if (status.status !== 'completed' && status.status !== 'skipped') bullets.push({ kind: 'time', text: timeText(ctx, course) });

  return { headline: sentences.join(' '), bullets };
}

/** Explanation for a course that is not part of the learner's roadmap. */
export function explainOutsideCourse(ctx: EngineContext, course: Course): Explanation {
  const P = phrases(ctx.cat.lang);
  const bullets: Explanation['bullets'] = [];
  if (ctx.profile.completed.has(course.id)) return { headline: P.outsideCompleted, bullets };
  const helps: string[] = [];
  for (const s of course.skills) {
    const t = ctx.targets.get(s.skillId);
    if (!t) continue;
    const cur = levelOf(ctx.levels, s.skillId);
    const name = skillName(ctx, s.skillId);
    if (cur >= t.required) bullets.push({ kind: 'met', text: P.outsideMet(name, cur, t.required) });
    else if (s.gain > cur) {
      helps.push(name);
      bullets.push({ kind: 'gap', text: P.outsideRaise(name, cur, Math.min(s.gain, 100), t.required) });
    }
  }
  if (isMastered(course, ctx.levels)) bullets.push({ kind: 'skipped', text: P.outsideMastered });
  const bg = backgroundBullet(ctx, course);
  if (bg) bullets.push({ kind: 'background', text: bg });
  if (ctx.research && course.research.some((l) => l.researchId === ctx.research!.id)) bullets.push({ kind: 'research', text: P.outsideResearch(ctx.research.name) });
  bullets.push({ kind: 'time', text: timeText(ctx, course) });

  let headline: string;
  if (!ctx.career) headline = P.outsideNoCareer;
  else if (helps.length) headline = P.outsideHelps(P.join(helps), helps.length, ctx.career.name);
  else headline = P.outsideNotNeeded(ctx.career.name);
  return { headline, bullets };
}

export function explainAutoSkip(ctx: EngineContext, skip: AutoSkip): string {
  const P = phrases(ctx.cat.lang);
  const course = ctx.cat.courses.get(skip.courseId)!;
  return P.autoSkip(course.title, P.join(skip.evidence.map((e) => P.evidence(skillName(ctx, e.skillId), e.level, e.gain))));
}

/** One short line per reason, used on roadmap nodes. */
export function shortReason(ctx: EngineContext, item: PlanItem): string {
  const P = phrases(ctx.cat.lang);
  const gap = item.reasons.find((r) => r.type === 'skill_gap') as Extract<Reason, { type: 'skill_gap' }> | undefined;
  if (gap) {
    const t = ctx.targets.get(gap.skillId);
    const cur = levelOf(ctx.levels, gap.skillId);
    return t && cur < t.required ? P.shortCloses(skillName(ctx, gap.skillId), cur, t.required) : P.shortBuilds(skillName(ctx, gap.skillId));
  }
  if (item.reasons.some((r) => r.type === 'path_milestone')) return P.shortMilestone;
  const pre = item.reasons.find((r) => r.type === 'prerequisite') as Extract<Reason, { type: 'prerequisite' }> | undefined;
  if (pre) return P.shortPrereq(ctx.cat.courses.get(pre.forCourseId)!.title);
  return P.shortUser;
}
