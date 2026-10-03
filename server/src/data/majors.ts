import { VI_MAJORS } from './vi.js';

/**
 * Typical starting skill levels by major. Onboarding pre-fills these (the student adjusts them),
 * and explanations use them to point out where a background already gives a head start.
 */
export const MAJORS: { name: string; baseline: Record<string, number> }[] = [
  { name: 'Physics', baseline: { calculus: 70, linalg: 55, physics: 75, quantum: 40, probstat: 40, comp_physics: 30, python: 25 } },
  { name: 'Computer Science', baseline: { python: 60, dsa: 55, discrete: 60, swe: 45, sql: 40, calculus: 45, linalg: 40, systems: 35 } },
  { name: 'Electrical Engineering', baseline: { circuits: 65, digital: 55, signals: 55, calculus: 65, linalg: 45, cpp: 40, embedded: 30, physics: 50 } },
  { name: 'Electronics & Telecommunications', baseline: { circuits: 60, signals: 60, networking: 45, digital: 50, cpp: 35, calculus: 60 } },
  { name: 'Mathematics', baseline: { calculus: 80, linalg: 75, probstat: 60, discrete: 60, optimization: 45, python: 30 } },
  { name: 'Information Technology', baseline: { python: 50, sql: 50, webdev: 45, networking: 40, swe: 40, dsa: 35 } },
  { name: 'Mechanical Engineering', baseline: { calculus: 65, physics: 60, linalg: 45, robotics: 30, comp_physics: 25 } },
  { name: 'Materials Science', baseline: { physics: 60, quantum: 30, semiconductor: 30, calculus: 55 } },
  { name: 'Economics', baseline: { probstat: 50, data_analysis: 40, calculus: 45, sql: 25 } },
  { name: 'Biology / Biotechnology', baseline: { probstat: 35, data_analysis: 30, python: 20 } },
  { name: 'Other', baseline: {} },
];

export function majorBaseline(major: string | null | undefined): Record<string, number> {
  return MAJORS.find((m) => m.name === major)?.baseline ?? {};
}

export function majorLabel(major: string, lang: 'en' | 'vi'): string {
  return lang === 'vi' ? VI_MAJORS[major] ?? major : major;
}
