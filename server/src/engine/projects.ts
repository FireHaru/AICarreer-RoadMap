import type { EngineContext } from './context.js';
import { levelOf } from './skills.js';
import type { Project } from './types.js';

export type ProjectStatus = 'ready' | 'almost' | 'future';

export interface ProjectFit {
  project: Project;
  readiness: number;
  status: ProjectStatus;
  relevance: number;
  skills: { skillId: number; required: number; current: number; met: boolean }[];
  missingCourseIds: number[];
}

const LEVEL_RANK: Record<Project['level'], number> = { Beginner: 0, Intermediate: 1, Advanced: 2, Research: 3 };
const STATUS_RANK: Record<ProjectStatus, number> = { ready: 0, almost: 1, future: 2 };

export function projectFit(ctx: EngineContext, project: Project): ProjectFit {
  const skills = project.skills.map((s) => {
    const current = levelOf(ctx.levels, s.skillId);
    return { skillId: s.skillId, required: s.required, current, met: current >= s.required };
  });
  const readiness = skills.length
    ? Math.round((skills.reduce((sum, s) => sum + Math.min(1, s.current / s.required), 0) / skills.length) * 100)
    : 100;
  const status: ProjectStatus = readiness >= 95 ? 'ready' : readiness >= 65 ? 'almost' : 'future';
  const p = ctx.profile;
  let relevance = 0;
  if (p.careerId && project.careerIds.includes(p.careerId)) relevance += 3;
  if (p.researchId && project.researchIds.includes(p.researchId)) relevance += 2;
  if (project.careerIds.some((c) => p.secondaryCareerIds.includes(c))) relevance += 1;
  if (project.researchIds.some((r) => p.secondaryResearchIds.includes(r))) relevance += 1;
  return { project, readiness, status, relevance, skills, missingCourseIds: project.courseIds.filter((c) => !p.completed.has(c)) };
}

/** Projects ordered for the learner: relevant to their goal first, then what they can start now. */
export function rankProjects(ctx: EngineContext): ProjectFit[] {
  return ctx.cat.projects
    .map((p) => projectFit(ctx, p))
    .sort((a, b) =>
      Number(b.relevance > 0) - Number(a.relevance > 0)
      || STATUS_RANK[a.status] - STATUS_RANK[b.status]
      || (a.status === 'ready' ? LEVEL_RANK[b.project.level] - LEVEL_RANK[a.project.level] : LEVEL_RANK[a.project.level] - LEVEL_RANK[b.project.level])
      || b.relevance - a.relevance
      || b.readiness - a.readiness
      || a.project.id - b.project.id);
}

/** The single best next project: the most ambitious relevant one the learner is ready for, else the closest one. */
export function recommendedProject(ctx: EngineContext): ProjectFit | null {
  const ranked = rankProjects(ctx);
  return ranked.find((f) => f.relevance > 0 && f.status !== 'future') ?? ranked.find((f) => f.status !== 'future') ?? ranked[0] ?? null;
}

/** Learning stage = level of the most advanced relevant project the learner is ready (or almost ready) for. */
export function learningStage(ctx: EngineContext): Project['level'] {
  let best: Project['level'] = 'Beginner';
  for (const f of rankProjects(ctx)) {
    if (f.status === 'future') continue;
    if (LEVEL_RANK[f.project.level] > LEVEL_RANK[best] && (f.status === 'ready' || f.readiness >= 85)) best = f.project.level;
  }
  return best;
}
