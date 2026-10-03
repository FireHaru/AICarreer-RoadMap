import { msg } from '../i18n';
import type { CourseStatus, Difficulty, ProjectLevel } from './types';

export const LEVELS = [
  { label: msg('None'), value: 0 },
  { label: msg('Beginner'), value: 20 },
  { label: msg('Basic'), value: 45 },
  { label: msg('Intermediate'), value: 70 },
  { label: msg('Advanced'), value: 90 },
] as const;

/** English level name (translate with t()). */
export function levelLabel(level: number) {
  if (level <= 0) return msg('None');
  if (level <= 30) return msg('Beginner');
  if (level <= 55) return msg('Basic');
  if (level <= 80) return msg('Intermediate');
  return msg('Advanced');
}

export const STATUS_META: Record<CourseStatus, { label: string; dot: string; text: string; ring: string; bg: string }> = {
  completed: { label: msg('Completed'), dot: 'bg-emerald-400', text: 'text-emerald-300', ring: 'border-emerald-400/40', bg: 'bg-emerald-400/10' },
  current: { label: msg('Current'), dot: 'bg-cyan-400', text: 'text-cyan-300', ring: 'border-cyan-400/70', bg: 'bg-cyan-400/10' },
  recommended: { label: msg('Recommended'), dot: 'bg-violet-400', text: 'text-violet-300', ring: 'border-violet-400/40', bg: 'bg-violet-400/10' },
  locked: { label: msg('Locked'), dot: 'bg-slate-500', text: 'text-slate-400', ring: 'border-white/10', bg: 'bg-white/5' },
  skipped: { label: msg('Skipped'), dot: 'bg-amber-400', text: 'text-amber-300', ring: 'border-amber-400/30', bg: 'bg-amber-400/10' },
};

export const DIFFICULTY_META: Record<Difficulty, { dots: number; text: string }> = {
  Beginner: { dots: 1, text: 'text-emerald-300' },
  Intermediate: { dots: 2, text: 'text-sky-300' },
  Advanced: { dots: 3, text: 'text-violet-300' },
  Expert: { dots: 4, text: 'text-fuchsia-300' },
};

export const PROJECT_LEVEL_META: Record<ProjectLevel, string> = {
  Beginner: 'text-emerald-300 border-emerald-400/30 bg-emerald-400/10',
  Intermediate: 'text-sky-300 border-sky-400/30 bg-sky-400/10',
  Advanced: 'text-violet-300 border-violet-400/30 bg-violet-400/10',
  Research: 'text-fuchsia-300 border-fuchsia-400/30 bg-fuchsia-400/10',
};

export const PRIORITY_META = {
  High: 'text-rose-300 border-rose-400/30 bg-rose-400/10',
  Medium: 'text-amber-300 border-amber-400/30 bg-amber-400/10',
  Low: 'text-slate-300 border-white/10 bg-white/5',
} as const;

/** Category, difficulty, level and priority values are English keys; these lists mark them for translation. */
export const ENUM_LABELS = [
  msg('Programming'), msg('Mathematics'), msg('Data Science'), msg('Machine Learning'), msg('Deep Learning'),
  msg('Computer Vision'), msg('NLP'), msg('Embedded Systems'), msg('IoT'), msg('Semiconductor'), msg('Physics'),
  msg('Robotics'), msg('Research Methods'), msg('Projects'),
  msg('AI & Data'), msg('Hardware & Systems'), msg('Science'), msg('Research'),
  msg('Expert'), msg('High'), msg('Medium'), msg('Low'),
];

export function weeks(hours: number, weekly: number) {
  return Math.max(1, Math.round(hours / Math.max(1, weekly)));
}

export function formatDate(iso: string, locale = 'en-GB') {
  return new Date(iso).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatMonth(iso: string, locale = 'en-GB') {
  // Vietnamese short months ("thg 9") read poorly; the long form is "tháng 9 năm 2027".
  return new Date(iso).toLocaleDateString(locale, { month: locale.startsWith('vi') ? 'long' : 'short', year: 'numeric' });
}

export function firstName(full: string, lang: 'en' | 'vi' = 'en') {
  const parts = full.trim().split(/\s+/);
  // Vietnamese names put the given name last ("Nguyễn Văn An" → "An").
  return (lang === 'vi' ? parts[parts.length - 1] : parts[0]) ?? full;
}

export function initials(full: string) {
  return full.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('');
}

/** Skill category → onboarding group. */
export const SKILL_GROUPS: { key: string; label: string; description: string; categories: string[] }[] = [
  { key: 'programming', label: msg('Programming'), description: msg('Languages, algorithms and engineering practice'), categories: ['Programming'] },
  { key: 'math', label: msg('Mathematics'), description: msg('The maths behind ML, physics and engineering'), categories: ['Mathematics'] },
  { key: 'ai', label: msg('AI / ML'), description: msg('Data, machine learning and its specialisations'), categories: ['AI & Data'] },
  { key: 'other', label: msg('Other technical'), description: msg('Hardware, science and research skills'), categories: ['Hardware & Systems', 'Science', 'Research'] },
];
