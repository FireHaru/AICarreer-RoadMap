import { buildTargets, effectiveLevels, type TargetScope } from './skills.js';
import type { Career, CareerPath, Catalog, LearnerProfile, LevelInfo, Research, Target } from './types.js';

/** Everything derived from a learner + goal that explanations, projects and the assistant need. */
export interface EngineContext {
  cat: Catalog;
  profile: LearnerProfile;
  levels: Map<number, LevelInfo>;
  targets: Map<number, Target>;
  career: Career | null;
  research: Research | null;
  path: CareerPath | null;
}

export function defaultPath(cat: Catalog, careerId: number | null): CareerPath | null {
  if (!careerId) return null;
  return cat.careers.get(careerId)?.paths[0] ?? null;
}

export function buildContext(cat: Catalog, profile: LearnerProfile, path?: CareerPath | null, scope: TargetScope = 'path'): EngineContext {
  const career = profile.careerId ? cat.careers.get(profile.careerId) ?? null : null;
  const research = profile.researchId ? cat.research.get(profile.researchId) ?? null : null;
  const p = path === undefined ? defaultPath(cat, profile.careerId) : path;
  return {
    cat,
    profile,
    levels: effectiveLevels(cat, profile),
    targets: buildTargets(cat, { careerId: profile.careerId, researchId: profile.researchId, path: p, scope }),
    career,
    research,
    path: p,
  };
}

export function emptyProfile(): LearnerProfile {
  return {
    userId: null, fullName: '', major: null, yearOfStudy: null, weeklyHours: 10,
    selfSkills: new Map(), completed: new Set(), careerId: null, researchId: null, secondaryCareerIds: [], secondaryResearchIds: [],
  };
}
