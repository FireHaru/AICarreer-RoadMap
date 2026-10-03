import { clsx } from 'clsx';
import { ArrowRight, CalendarClock, CircleCheck, FolderKanban, Gauge, Play, Route, Sparkles, Target } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { CategoryHoursChart, CHART, Legend } from '../components/charts';
import { StatusIcon } from '../components/course/Badges';
import { CourseDrawer } from '../components/course/CourseDrawer';
import { useCourseActions } from '../components/course/useCourseActions';
import { ButtonLink } from '../components/ui/Button';
import { Card, EmptyState, ErrorState, PageLoader, ProgressBar, ProgressRing, StatTile } from '../components/ui/primitives';
import { useI18n } from '../i18n';
import { firstName, formatMonth, PROJECT_LEVEL_META, STATUS_META } from '../lib/format';
import { useApi, useDocumentTitle, useMeta } from '../lib/hooks';
import { DomainIcon } from '../lib/icons';
import type { Dashboard as DashboardData } from '../lib/types';

export default function Dashboard() {
  const { t, tn, lang, locale } = useI18n();
  useDocumentTitle(t('Dashboard'));
  const meta = useMeta();
  const { data, error, loading, reload } = useApi<DashboardData>('/insights/dashboard');
  const [open, setOpen] = useState<string | null>(null);
  const { run, busy } = useCourseActions(() => void reload());
  const [pending, setPending] = useState<number | null>(null);

  if (loading && !data) return <PageLoader />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!data) return null;
  if (!data.goal) {
    return <EmptyState icon={<Target className="size-8" />} title={t('Choose a goal to get started')} description={t('Pick a career goal and PathForge will build your roadmap.')} action={<ButtonLink to="/settings">{t('Choose a goal')}</ButtonLink>} />;
  }

  const { progress, current, next, gap, recommendedProject: project, goal } = data;
  const upcoming = data.checklist.filter((c) => c.status !== 'completed').slice(0, 6);
  const done = data.checklist.filter((c) => c.status === 'completed');
  const major = data.user.major ? meta?.majors.find((m) => m.name === data.user.major)?.label ?? data.user.major : null;

  return (
    <div className="space-y-6">
      {/* Welcome + progress */}
      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Card className="relative overflow-hidden p-6 sm:p-7">
          <div className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full bg-cyan-400/10 blur-3xl" />
          <p className="eyebrow">{[major, data.user.university, data.user.yearOfStudy ? t('Year {n}', { n: data.user.yearOfStudy }) : null].filter(Boolean).join(' · ')}</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">{t('Welcome back, {name}', { name: firstName(data.user.fullName, lang) })}</h1>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-3 py-1.5 text-sm text-cyan-100">
              <DomainIcon name={goal.career.icon} className="size-4" /> {goal.career.name}
            </span>
            <span className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-sm text-slate-300">{goal.path.name}</span>
            {goal.research && <span className="rounded-xl border border-fuchsia-400/25 bg-fuchsia-400/[0.07] px-3 py-1.5 text-sm text-fuchsia-100">{t('Research · {name}', { name: goal.research.name })}</span>}
          </div>
          {current ? (
            <div className="mt-6 rounded-xl border border-white/[0.07] bg-navy-900/60 p-4">
              <p className="text-xs text-slate-500">{t('Current focus')}</p>
              <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-white">{current.course.title}</p>
                  <p className="mt-0.5 truncate text-sm text-slate-400">{current.reason}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button onClick={() => setOpen(current.course.code)} className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.05] px-3 text-sm text-slate-200 hover:bg-white/10">
                    {t('Why this?')}
                  </button>
                  <ButtonLink to="/roadmap" size="sm" className="h-9" icon={<Play className="size-3.5" />}>{t('Continue')}</ButtonLink>
                </div>
              </div>
            </div>
          ) : (
            <p className="mt-6 text-sm text-emerald-300">{t('Every course in your roadmap is done — time to build projects!')}</p>
          )}
        </Card>

        <Card className="flex items-center gap-6 p-6">
          <ProgressRing value={progress.pct} size={128} stroke={11}>
            <span className="text-3xl font-semibold text-white">{progress.pct}%</span>
            <span className="text-[11px] text-slate-500">{t('complete')}</span>
          </ProgressRing>
          <div className="min-w-0 space-y-3 text-sm">
            <div>
              <p className="text-slate-500">{t('Roadmap progress')}</p>
              <p className="font-medium text-white">{t('{done} of {total} courses', { done: progress.completed, total: progress.total })}</p>
            </div>
            <div>
              <p className="text-slate-500">{t('Hours')}</p>
              <p className="font-medium text-white">{t('{done} / {total} h', { done: progress.completedHours, total: progress.totalHours })}</p>
            </div>
            <div>
              <p className="text-slate-500">{t('Remaining')}</p>
              <p className="font-medium text-white">{tn('{n} course', '{n} courses', progress.remaining)}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile icon={<Target className="size-4" />} label={t('Current focus')} value={current?.course.title ?? '—'} hint={current ? `${t('{n} h', { n: current.course.hours })} · ${t(current.course.difficulty)}` : t('All done')} />
        <StatTile icon={<ArrowRight className="size-4" />} label={t('Next step')} accent="violet" value={next?.course.title ?? '—'} hint={next?.reason ?? t('Nothing queued')} />
        <StatTile icon={<Gauge className="size-4" />} label={t('Skill gap')} accent="rose" value={tn('{n} critical skill', '{n} critical skills', gap.critical)} hint={gap.topCritical.length ? gap.topCritical.join(', ') : t('{n}% ready', { n: gap.readiness })} />
        <StatTile icon={<CalendarClock className="size-4" />} label={t('Estimated finish')} accent="emerald" value={progress.remainingHours ? formatMonth(progress.etaDate, locale) : t('Done')} hint={t('{weeks} weeks at {hours} h/week', { weeks: progress.etaWeeks, hours: data.weeklyHours })} />
      </div>

      {/* Roadmap preview */}
      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-white">{t('Roadmap preview')}</h2>
            <p className="text-xs text-slate-500">{t('{path} · {n} steps to {career}', { path: goal.path.name, n: data.preview.length, career: goal.career.name })}</p>
          </div>
          <Link to="/roadmap" className="inline-flex items-center gap-1 text-sm text-cyan-300 hover:underline">{t('Open graph')} <ArrowRight className="size-4" /></Link>
        </div>
        <div className="-mx-1 flex items-center gap-1.5 overflow-x-auto px-1 pb-2">
          {data.preview.map((p, i) => (
            <div key={p.id} className="flex shrink-0 items-center gap-1.5">
              <button onClick={() => setOpen(p.code)} className={clsx('flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs transition hover:border-white/25', STATUS_META[p.status].ring, p.status === 'current' && 'bg-cyan-400/10', p.status === 'completed' && 'bg-emerald-400/[0.06]', (p.status === 'locked' || p.status === 'skipped') && 'opacity-60')}>
                <StatusIcon status={p.status} className="size-3.5" />
                <span className="max-w-[150px] truncate font-medium text-slate-100">{p.title}</span>
              </button>
              {i < data.preview.length - 1 && <ArrowRight className="size-3.5 shrink-0 text-slate-600" />}
            </div>
          ))}
          <ArrowRight className="size-3.5 shrink-0 text-slate-600" />
          <span className="flex shrink-0 items-center gap-2 rounded-xl border border-violet-400/40 bg-violet-400/10 px-3 py-2 text-xs font-medium text-violet-100">
            <DomainIcon name={goal.career.icon} className="size-3.5" /> {goal.career.name}
          </span>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1.25fr_1fr]">
        {/* Checklist */}
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-white">{t('Up next')}</h2>
            <span className="text-xs text-slate-500">{t('{n} completed', { n: done.length })}</span>
          </div>
          {upcoming.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">{t('Nothing left — great work.')}</p>
          ) : (
            <ul className="divide-y divide-white/[0.05]">
              {upcoming.map((c) => (
                <li key={c.id} className="flex items-center gap-3 py-3">
                  <input
                    type="checkbox"
                    aria-label={t('Mark {title} as completed', { title: c.title })}
                    className="size-4 shrink-0 cursor-pointer rounded accent-cyan-400"
                    disabled={busy !== null}
                    checked={pending === c.id}
                    onChange={async () => {
                      setPending(c.id);
                      await run('complete', c.code, c.title);
                      setPending(null);
                    }}
                  />
                  <button onClick={() => setOpen(c.code)} className="min-w-0 flex-1 text-left">
                    <p className="truncate text-sm font-medium text-slate-100 hover:text-white">{c.title}</p>
                    <p className="truncate text-xs text-slate-500">{c.reason}</p>
                  </button>
                  <span className={clsx('hidden shrink-0 text-xs sm:inline', STATUS_META[c.status].text)}>{t(STATUS_META[c.status].label)}</span>
                  <span className="shrink-0 font-mono text-xs text-slate-500">{t('{n} h', { n: c.hours })}</span>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-xs text-slate-500">{t('Tick a course when you finish it — courses that depend on it unlock automatically.')}</p>
        </Card>

        <div className="space-y-4">
          {/* Recommended project */}
          {project && (
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 font-semibold text-white"><FolderKanban className="size-4 text-violet-300" /> {t('Recommended project')}</h2>
                <span className={clsx('rounded-full border px-2 py-0.5 text-[11px] font-medium', PROJECT_LEVEL_META[project.level])}>{t(project.level)}</span>
              </div>
              <p className="mt-3 font-medium text-white">{project.title}</p>
              <p className="mt-1 text-sm text-slate-400">{project.summary}</p>
              <div className="mt-4 flex items-center gap-3">
                <ProgressBar value={project.readiness} size="sm" className="flex-1" />
                <span className="text-xs text-slate-400">{t('{n}% ready', { n: project.readiness })}</span>
              </div>
              <p className="mt-3 text-xs text-slate-500">{t('Your stage:')} <span className="text-slate-300">{t(data.stage)}</span></p>
              <Link to="/projects" className="mt-3 inline-flex items-center gap-1 text-sm text-cyan-300 hover:underline">{t('All project ideas')} <ArrowRight className="size-4" /></Link>
            </Card>
          )}
          <Card className="flex items-start gap-3 p-5">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-violet-400/15 text-violet-200"><Sparkles className="size-4" /></span>
            <div>
              <p className="font-medium text-white">{t('Ask PathGPT')}</p>
              <p className="mt-1 text-sm text-slate-400">{t('"Can I skip {course}?" · "I only have 6 months — what first?"', { course: next?.course.title ?? t('a course') })}</p>
              <Link to="/assistant" className="mt-2 inline-flex items-center gap-1 text-sm text-cyan-300 hover:underline">{t('Open assistant')} <ArrowRight className="size-4" /></Link>
            </div>
          </Card>
        </div>
      </div>

      {/* Category progress */}
      <Card className="p-5">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-white">{t('Progress by category')}</h2>
            <p className="text-xs text-slate-500">{t('Study hours in your roadmap, completed vs remaining')}</p>
          </div>
          <Legend items={[{ label: t('Completed'), color: CHART.have }, { label: t('Remaining'), color: CHART.remaining }]} />
        </div>
        <CategoryHoursChart data={progress.categories} />
        <details className="mt-3 text-xs text-slate-400">
          <summary className="cursor-pointer text-slate-500 hover:text-slate-300">{t('Show as table')}</summary>
          <table className="mt-2 w-full text-left">
            <thead className="text-slate-500"><tr><th className="py-1 font-medium">{t('Category')}</th><th className="font-medium">{t('Courses')}</th><th className="font-medium">{t('Hours')}</th><th className="font-medium">{t('Done')}</th></tr></thead>
            <tbody>
              {progress.categories.map((c) => (
                <tr key={c.category} className="border-t border-white/[0.05]"><td className="py-1.5 text-slate-300">{t(c.category)}</td><td>{c.completed}/{c.total}</td><td>{c.completedHours}/{c.hours}</td><td>{c.pct}%</td></tr>
              ))}
            </tbody>
          </table>
        </details>
      </Card>

      {done.length > 0 && (
        <Card className="p-5">
          <h2 className="mb-3 flex items-center gap-2 font-semibold text-white"><CircleCheck className="size-4 text-emerald-400" /> {t('Completed')}</h2>
          <div className="flex flex-wrap gap-2">
            {done.map((c) => (
              <button key={c.id} onClick={() => setOpen(c.code)} className="chip hover:border-white/20">{c.title}</button>
            ))}
          </div>
        </Card>
      )}

      <div className="flex justify-center pt-2">
        <ButtonLink to="/roadmap" variant="secondary" icon={<Route className="size-4" />}>{t('Open full roadmap')}</ButtonLink>
      </div>

      <CourseDrawer code={open} onClose={() => setOpen(null)} onChanged={() => void reload()} />
    </div>
  );
}
