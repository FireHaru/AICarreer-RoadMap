import { clsx } from 'clsx';
import { ArrowRight, BookOpen, CircleCheck, Clock, ExternalLink, FolderKanban, Layers, LockOpen, Plus, RotateCcw, SkipForward, Trash, Trophy } from 'lucide-react';
import { Link } from 'react-router';
import { useI18n } from '../../i18n';
import { PROJECT_LEVEL_META, weeks } from '../../lib/format';
import { DomainIcon } from '../../lib/icons';
import type { CourseDetail, RoadmapMutation } from '../../lib/types';
import { Button, ButtonLink } from '../ui/Button';
import { DifficultyTag, StatusPill } from './Badges';
import { WhyRecommended } from './Explanation';
import { useCourseActions } from './useCourseActions';

function Section({ title, icon, children, className }: { title: string; icon?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={className}>
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
        {icon && <span className="text-slate-500">{icon}</span>}
        {title}
      </h2>
      {children}
    </section>
  );
}

export function CourseDetailView({ detail, onChanged, inDrawer }: { detail: CourseDetail; onChanged?: (m: RoadmapMutation) => void; inDrawer?: boolean }) {
  const { course, prerequisites, dependents, projects, personal } = detail;
  const { run, busy } = useCourseActions(onChanged);
  const { t } = useI18n();
  const weekly = personal?.weeklyHours ?? 10;

  return (
    <div className="space-y-7">
      {/* Header */}
      <header>
        <div className={clsx('flex flex-wrap items-center gap-2 text-xs text-slate-500', inDrawer && 'pr-10')}>
          <span className="font-mono font-medium">{course.code}</span>
          <span>·</span>
          <span>{t(course.category)}</span>
          {course.kind === 'project' && <span className="rounded-md bg-violet-400/15 px-1.5 py-0.5 font-medium text-violet-200">{t('Milestone project')}</span>}
          {personal?.status && <StatusPill status={personal.status} className="ml-auto" />}
        </div>
        <h1 className={clsx('mt-2 font-semibold tracking-tight text-white', inDrawer ? 'pr-8 text-xl' : 'text-2xl sm:text-3xl')}>{course.title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-400">{course.summary}</p>

        <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: t('Difficulty'), value: <DifficultyTag level={course.difficulty} className="text-xs" /> },
            { label: t('Credits'), value: t('{n} credits', { n: course.credits }) },
            { label: t('Study time'), value: t('{n} hours', { n: course.hours }) },
            { label: personal ? t('At your pace') : t('At 10 h/week'), value: t('~{n} weeks', { n: weeks(course.hours, weekly) }) },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
              <dt className="text-[11px] text-slate-500">{s.label}</dt>
              <dd className="mt-1 text-sm font-medium text-slate-100">{s.value}</dd>
            </div>
          ))}
        </dl>

        {personal && (
          <div className="mt-4 flex flex-wrap gap-2">
            {personal.completed ? (
              <Button variant="secondary" size="sm" icon={<RotateCcw className="size-3.5" />} loading={busy === 'uncomplete'} onClick={() => run('uncomplete', course.code, course.title)}>
                {t('Mark as not completed')}
              </Button>
            ) : (
              <Button size="sm" icon={<CircleCheck className="size-4" />} loading={busy === 'complete'} onClick={() => run('complete', course.code, course.title)}>
                {t('Mark as completed')}
              </Button>
            )}
            {personal.inRoadmap && !personal.completed && (
              <Button variant="secondary" size="sm" icon={<SkipForward className="size-3.5" />} loading={busy === 'skip' || busy === 'unskip'} onClick={() => run(personal.skipped ? 'unskip' : 'skip', course.code, course.title)}>
                {personal.skipped ? t('Un-skip') : t('Skip course')}
              </Button>
            )}
            {personal.inRoadmap ? (
              <Button variant="ghost" size="sm" icon={<Trash className="size-3.5" />} loading={busy === 'remove'} onClick={() => run('remove', course.code, course.title)}>
                {t('Remove from roadmap')}
              </Button>
            ) : (
              !personal.completed && (
                <Button variant="outline" size="sm" icon={<Plus className="size-3.5" />} loading={busy === 'add'} onClick={() => run('add', course.code, course.title)}>
                  {t('Add to roadmap')}
                </Button>
              )
            )}
            {inDrawer && (
              <ButtonLink to={`/courses/${course.code}`} variant="ghost" size="sm" icon={<ExternalLink className="size-3.5" />}>
                {t('Full page')}
              </ButtonLink>
            )}
          </div>
        )}
      </header>

      {personal ? (
        <WhyRecommended explanation={personal.explanation} title={personal.inRoadmap ? t('Why is this course recommended?') : t('How does this course fit you?')} />
      ) : (
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4 text-sm text-slate-400">
          <Link to="/register" className="font-medium text-cyan-300 hover:underline">{t('Create a free profile')}</Link> {t('to see whether this course belongs in your roadmap — and why.')}
        </div>
      )}

      <Section title={t('About this course')} icon={<BookOpen className="size-4" />}>
        <p className="text-sm leading-relaxed text-slate-300">{course.description}</p>
      </Section>

      <Section title={t('Learning outcomes')} icon={<Trophy className="size-4" />}>
        <ul className="grid gap-2 sm:grid-cols-2">
          {course.outcomes.map((o) => (
            <li key={o} className="flex items-start gap-2 text-sm text-slate-300">
              <CircleCheck className="mt-0.5 size-4 shrink-0 text-emerald-400/80" />
              {o}
            </li>
          ))}
        </ul>
      </Section>

      <Section title={t('Skills you will gain')} icon={<Layers className="size-4" />}>
        <div className="space-y-3">
          {course.skills.map((s) => {
            const mine = personal?.levels[s.id];
            return (
              <div key={s.id}>
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-200">{s.name}</span>
                  <span className="text-slate-500">
                    {mine !== undefined && <>{t('you {n}%', { n: mine })} · </>}{t('reaches {n}%', { n: s.gain })}
                  </span>
                </div>
                <div className="relative h-2 rounded-full bg-white/[0.06]">
                  <div className="absolute inset-y-0 left-0 rounded-full bg-violet-500/30" style={{ width: `${s.gain}%` }} />
                  {mine !== undefined && <div className="absolute inset-y-0 left-0 rounded-full bg-linear-to-r from-cyan-400 to-violet-500" style={{ width: `${Math.min(mine, 100)}%` }} />}
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      <div className="grid gap-7 md:grid-cols-2">
        <Section title={t('Prerequisites')} icon={<LockOpen className="size-4" />}>
          {prerequisites.length ? (
            <ul className="space-y-2">
              {prerequisites.map((p) => {
                const done = personal?.prereqCompleted.includes(p.id);
                return (
                  <li key={p.id}>
                    <Link to={`/courses/${p.code}`} className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2 transition hover:border-white/15">
                      {done ? <CircleCheck className="size-4 text-emerald-400" /> : <span className="size-4 rounded-full border border-white/20" />}
                      <span className="min-w-0 flex-1 truncate text-sm text-slate-200">{p.title}</span>
                      <span className="font-mono text-[11px] text-slate-500">{p.code}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">{t('None — you can start right away.')}</p>
          )}
        </Section>
        <Section title={t('Unlocks')} icon={<ArrowRight className="size-4" />}>
          {dependents.length ? (
            <div className="flex flex-wrap gap-2">
              {dependents.map((d) => (
                <Link key={d.id} to={`/courses/${d.code}`} className="chip transition hover:border-white/20 hover:text-white">
                  {d.title}
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">{t('This is a final step — nothing depends on it.')}</p>
          )}
        </Section>
      </div>

      <div className="grid gap-7 md:grid-cols-2">
        <Section title={t('Related careers')}>
          {course.careers.length ? (
            <div className="flex flex-wrap gap-2">
              {course.careers.map((c) => (
                <Link key={c.id} to={`/careers/${c.slug}`} className="chip transition hover:border-white/20 hover:text-white">
                  <DomainIcon name={c.icon} className="size-3 text-cyan-300" />
                  {c.name}
                  {c.relevance === 'core' && <span className="text-[10px] text-cyan-300">{t('core')}</span>}
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">{t('Used as groundwork for other courses.')}</p>
          )}
        </Section>
        <Section title={t('Research directions')}>
          {course.research.length ? (
            <div className="flex flex-wrap gap-2">
              {course.research.map((r) => (
                <span key={r.id} className="chip">
                  <DomainIcon name={r.icon} className="size-3 text-fuchsia-300" />
                  {r.name}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">{t('No specific research direction.')}</p>
          )}
        </Section>
      </div>

      {projects.length > 0 && (
        <Section title={t('Recommended projects')} icon={<FolderKanban className="size-4" />}>
          <div className="grid gap-3 sm:grid-cols-2">
            {projects.map((p) => (
              <Link key={p.id} to="/projects" className="card-interactive block p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className={clsx('rounded-full border px-2 py-0.5 text-[11px] font-medium', PROJECT_LEVEL_META[p.level])}>{t(p.level)}</span>
                  <span className="inline-flex items-center gap-1 text-[11px] text-slate-500"><Clock className="size-3" />{t('{n} h', { n: p.hours })}</span>
                </div>
                <p className="mt-2 text-sm font-medium text-white">{p.title}</p>
                <p className="mt-1 line-clamp-2 text-xs text-slate-400">{p.summary}</p>
              </Link>
            ))}
          </div>
        </Section>
      )}

    </div>
  );
}
