import type { Lang } from '../i18n.js';

export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';

export interface Skill {
  id: number;
  slug: string;
  name: string;
  category: string;
  description: string;
}

export interface CourseSkill {
  skillId: number;
  gain: number;
}

export interface Course {
  id: number;
  code: string;
  title: string;
  category: string;
  difficulty: Difficulty;
  credits: number;
  hours: number;
  kind: 'course' | 'project';
  summary: string;
  description: string;
  outcomes: string[];
  prereqIds: number[];
  skills: CourseSkill[];
  careers: { careerId: number; relevance: 'core' | 'elective' }[];
  research: { researchId: number; relevance: 'core' | 'elective' }[];
}

export interface SkillReq {
  skillId: number;
  required: number;
  weight: number;
}

export interface CareerPath {
  id: number;
  careerId: number;
  slug: string;
  name: string;
  kind: 'standard' | 'research' | 'specialization';
  description: string;
  researchWeight: number;
  sortOrder: number;
  skills: SkillReq[];
  courseIds: number[];
}

export interface Career {
  id: number;
  slug: string;
  name: string;
  icon: string;
  tagline: string;
  description: string;
  portfolio: string[];
  skills: SkillReq[];
  courses: { courseId: number; relevance: 'core' | 'elective' }[];
  paths: CareerPath[];
}

export interface Research {
  id: number;
  slug: string;
  name: string;
  icon: string;
  description: string;
  skills: SkillReq[];
  courses: { courseId: number; relevance: 'core' | 'elective' }[];
}

export interface Project {
  id: number;
  slug: string;
  title: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Research';
  hours: number;
  summary: string;
  description: string;
  outcomes: string[];
  skills: { skillId: number; required: number }[];
  courseIds: number[];
  careerIds: number[];
  researchIds: number[];
}

export interface Catalog {
  /** Language of all text in this catalog (names, titles, descriptions). */
  lang: Lang;
  skills: Map<number, Skill>;
  skillsBySlug: Map<string, Skill>;
  courses: Map<number, Course>;
  courseList: Course[];
  coursesByCode: Map<string, Course>;
  /** courseId -> ids of courses that list it as a prerequisite */
  dependents: Map<number, number[]>;
  careers: Map<number, Career>;
  careersBySlug: Map<string, Career>;
  research: Map<number, Research>;
  researchBySlug: Map<string, Research>;
  paths: Map<number, CareerPath>;
  projects: Project[];
}

/** Everything the engine needs to know about a learner. */
export interface LearnerProfile {
  userId: number | null;
  fullName: string;
  major: string | null;
  yearOfStudy: number | null;
  weeklyHours: number;
  /** Self-reported skill levels (0-100). */
  selfSkills: Map<number, number>;
  completed: Set<number>;
  careerId: number | null;
  researchId: number | null;
  secondaryCareerIds: number[];
  secondaryResearchIds: number[];
}

export interface LevelInfo {
  level: number;
  self: number;
  /** Set when a completed course lifts the level above the self-reported value. */
  viaCourseId?: number;
}

export type TargetSource = { type: 'career' | 'research' | 'path'; id: number; name: string; required: number; weight: number };

export interface Target {
  skillId: number;
  required: number;
  weight: number;
  sources: TargetSource[];
}

export type GapGroup = 'critical' | 'improve' | 'ready';
export type Priority = 'High' | 'Medium' | 'Low';

export interface GapItem {
  skillId: number;
  current: number;
  required: number;
  gap: number;
  gapPct: number;
  weight: number;
  score: number;
  priority: Priority;
  group: GapGroup;
  sources: TargetSource[];
  viaCourseId?: number;
}

/** Stored with each roadmap course so the recommendation can always be explained. */
export type Reason =
  | { type: 'skill_gap'; skillId: number }
  | { type: 'prerequisite'; forCourseId: number }
  | { type: 'path_milestone'; pathId: number }
  | { type: 'user_added' };

export type Origin = 'skill_gap' | 'prerequisite' | 'path' | 'user';

export interface PlanItem {
  courseId: number;
  origin: Origin;
  reasons: Reason[];
  priority: number;
  position: number;
  skipped: boolean;
}

export interface AutoSkip {
  courseId: number;
  forCourseId: number;
  /** Skill levels that show the learner already knows this material. */
  evidence: { skillId: number; level: number; gain: number }[];
}

export type CourseStatus = 'completed' | 'current' | 'recommended' | 'locked' | 'skipped';
