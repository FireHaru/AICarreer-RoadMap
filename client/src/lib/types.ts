export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
export type CourseStatus = 'completed' | 'current' | 'recommended' | 'locked' | 'skipped';
export type PathKind = 'standard' | 'research' | 'specialization';
export type ProjectLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'Research';

export interface CourseRef { id: number; code: string; title: string }
export interface SkillRef { id: number; slug: string; name: string; category: string }
export interface CareerRef { id: number; slug: string; name: string; icon: string }
export interface ResearchRef { id: number; slug: string; name: string; icon: string }
export interface PathRef { id: number; slug: string; name: string; kind: PathKind; description: string }

export interface CourseSummary {
  id: number;
  code: string;
  title: string;
  category: string;
  difficulty: Difficulty;
  credits: number;
  hours: number;
  kind: 'course' | 'project';
  summary: string;
  prerequisites: CourseRef[];
  skills: (SkillRef & { gain: number })[];
  careers: (CareerRef & { relevance: 'core' | 'elective' })[];
  research: (ResearchRef & { relevance: 'core' | 'elective' })[];
}

export interface Explanation {
  headline: string;
  bullets: { kind: string; text: string }[];
}

export interface RoadmapItem {
  course: CourseSummary & { description: string };
  position: number;
  origin: 'skill_gap' | 'prerequisite' | 'path' | 'user';
  skipped: boolean;
  priority: number;
  status: CourseStatus;
  unmet: number[];
  missing: number[];
  reason: string;
  explanation: Explanation;
  schedule: { startWeek: number; endWeek: number; weeks: number } | null;
}

export interface Progress {
  pct: number;
  completed: number;
  total: number;
  skipped: number;
  remaining: number;
  totalHours: number;
  completedHours: number;
  remainingHours: number;
  etaWeeks: number;
  etaDate: string;
  categories: { category: string; total: number; completed: number; hours: number; completedHours: number; pct: number }[];
}

export interface Roadmap {
  id: number | null;
  updatedAt: string | null;
  career: CareerRef;
  research: ResearchRef | null;
  path: PathRef;
  paths: PathRef[];
  weeklyHours: number;
  items: RoadmapItem[];
  edges: { source: number; target: number }[];
  autoSkipped: { course: CourseSummary; reason: string }[];
  progress: Progress;
  currentCourseId: number | null;
  nextCourseId: number | null;
}

export interface RoadmapMutation {
  roadmap: Roadmap;
  unlocked: CourseRef[];
  added?: CourseRef[];
  affected?: CourseRef[];
}

export interface User {
  id: number;
  email: string;
  fullName: string;
  university: string | null;
  major: string | null;
  yearOfStudy: number | null;
  gpa: number | null;
  weeklyHours: number;
  careerId: number | null;
  researchId: number | null;
  onboarded: boolean;
  createdAt: string;
}

export interface Meta {
  skills: (SkillRef & { description: string })[];
  careers: (CareerRef & { tagline: string; paths: PathRef[]; topSkills: string[] })[];
  research: (ResearchRef & { description: string })[];
  majors: { name: string; label: string; baseline: Record<string, number> }[];
  categories: string[];
  difficulties: Difficulty[];
  courseCount: number;
}

export interface GapItem {
  skill: SkillRef;
  current: number;
  required: number;
  gap: number;
  gapPct: number;
  weight: number;
  score: number;
  priority: 'High' | 'Medium' | 'Low';
  group: 'critical' | 'improve' | 'ready';
  sources: { type: 'career' | 'research' | 'path'; name: string; required: number }[];
  viaCourse: CourseRef | null;
  closingCourse: CourseRef | null;
}

export interface GapResponse {
  scope: 'path' | 'career' | 'research';
  career: CareerRef | null;
  research: ResearchRef | null;
  path: PathRef;
  readiness: number;
  counts: { critical: number; improve: number; ready: number };
  items: GapItem[];
}

export interface ProjectSummary {
  id: number;
  slug: string;
  title: string;
  level: ProjectLevel;
  hours: number;
  summary: string;
  description: string;
  outcomes: string[];
  skills: (SkillRef & { required: number })[];
  courses: CourseRef[];
  careers: CareerRef[];
  research: ResearchRef[];
}

export interface ProjectFit extends Omit<ProjectSummary, 'skills'> {
  readiness: number;
  status: 'ready' | 'almost' | 'future';
  relevance: number;
  skills: (SkillRef & { required: number; current: number; met: boolean })[];
  missingCourses: CourseRef[];
}

export interface Dashboard {
  user: { fullName: string; major: string | null; university: string | null; yearOfStudy: number | null };
  roadmap?: null;
  goal: { career: CareerRef; research: ResearchRef | null; path: PathRef };
  weeklyHours: number;
  progress: Progress;
  current: DashboardCourse | null;
  next: DashboardCourse | null;
  gap: { readiness: number; critical: number; improve: number; ready: number; topCritical: string[] };
  stage: ProjectLevel;
  recommendedProject: ProjectFit | null;
  preview: { id: number; code: string; title: string; category: string; status: CourseStatus; kind: 'course' | 'project' }[];
  checklist: { id: number; code: string; title: string; hours: number; category: string; status: CourseStatus; reason: string }[];
}

export interface DashboardCourse {
  course: { id: number; code: string; title: string; category: string; hours: number; difficulty: Difficulty };
  reason: string;
  schedule: { startWeek: number; endWeek: number; weeks: number } | null;
  status: CourseStatus;
}

export interface LibraryCourse extends CourseSummary {
  personal: { completed: boolean; inRoadmap: boolean; status: CourseStatus | null } | null;
}

export interface CourseDetail {
  course: CourseSummary & { description: string; outcomes: string[] };
  prerequisites: CourseSummary[];
  dependents: CourseSummary[];
  projects: ProjectSummary[];
  personal: {
    completed: boolean;
    inRoadmap: boolean;
    skipped: boolean;
    status: CourseStatus | null;
    explanation: Explanation;
    weeklyHours: number;
    levels: Record<string, number>;
    prereqCompleted: number[];
  } | null;
}

export interface CareerDetail {
  career: CareerRef & { tagline: string; description: string; portfolio: string[] };
  skills: (SkillRef & { required: number; weight: number; current: number | null })[];
  courses: { core: CourseSummary[]; elective: CourseSummary[] };
  projects: (ProjectSummary & { readiness: number | null; status: ProjectFit['status'] | null })[];
  paths: PathRef[];
  selectedPath: string;
  personalized: boolean;
  isCurrentGoal: boolean;
  readiness: number | null;
  preview: Roadmap;
}

export interface CareerListItem extends CareerRef {
  tagline: string;
  description: string;
  skills: (SkillRef & { required: number; weight: number })[];
  courseCount: number;
}

export interface PathPreview extends PathRef {
  courseCount: number;
  hours: number;
  weeks: number;
  credits: number;
  sequence: CourseRef[];
}

export type AssistantAction =
  | { type: 'open_course'; code: string; label: string }
  | { type: 'skip_course'; code: string; label: string }
  | { type: 'complete_course'; code: string; label: string }
  | { type: 'set_weekly_hours'; hours: number; label: string }
  | { type: 'navigate'; to: string; label: string };

export interface ChatMessage {
  id: number | string;
  role: 'user' | 'assistant';
  content: string;
  actions?: AssistantAction[];
  provider?: string;
  createdAt?: string;
}
