import { clsx } from 'clsx';
import { CircleCheck, Clock, FolderKanban, Sparkles, Target } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { Card, EmptyState, ErrorState, PageHeader, PageLoader, ProgressBar, Segmented } from '../components/ui/primitives';
import { msg, useI18n } from '../i18n';
import { PROJECT_LEVEL_META } from '../lib/format';
import { useApi, useDocumentTitle } from '../lib/hooks';
import type { ProjectFit, ProjectLevel } from '../lib/types';

type LevelFilter = 'all' | ProjectLevel;

const STATUS = {
  ready: { label: msg('Ready now'), className: 'text-emerald-300', bar: 'emerald' as const },
  almost: { label: msg('Almost there'), className: 'text-amber-300', bar: 'amber' as const },
  future: { label: msg('Build up first'), className: 'text-slate-400', bar: 'slate' as const },
};

const STAGE_TEXT: Record<ProjectLevel, string> = {
  Beginner: msg('Start with small, complete projects that use the basics you already have.'),
  Intermediate: msg('You can tackle real datasets and full applications — aim for one polished portfolio piece.'),
  Advanced: msg('You are ready for deep-learning and systems projects that look like industry work.'),
  Research: msg('You can reproduce papers and run original experiments — talk to a supervisor.'),
};

const LEVELS: ProjectLevel[] = ['Beginner', 'Intermediate', 'Advanced', 'Research'];

function ProjectCard({ p, featured }: { p: ProjectFit; featured?: boolean }) {
  const { t } = useI18n();
  const st = STATUS[p.status];
  return (
    <Card className={clsx('flex flex-col p-5', featured && 'border-violet-400/30 bg-linear-to-br from-violet-500/[0.08] to-cyan-400/[0.05]')}>
      <div className="flex items-center justify-between gap-2">
        <span className={clsx('rounded-full border px-2 py-0.5 text-[11px] font-medium', PROJECT_LEVEL_META[p.level])}>{t(p.level)}</span>
        <span className="inline-flex items-center gap-1 text-xs text-slate-500"><Clock className="size-3" />{t('{n} h', { n: p.hours })}</span>
      </div>
      <h3 className="mt-3 text-base font-semibold text-white">{p.title}</h3>
      <p className="mt-1 text-sm leading-relaxed text-slate-400">{featured ? p.description : p.summary}</p>

      <div className="mt-4">
        <div className="mb-1.5 flex justify-between text-xs">
          <span className={st.className}>{t(st.label)}</span>
          <span className="text-slate-500">{t('{n}% ready', { n: p.readiness })}</span>
        </div>
        <ProgressBar value={p.readiness} tone={st.bar} size="sm" />
      </div>

      <div className="mt-4">
        <p className="mb-1.5 text-[11px] font-medium text-slate-500">{t('Required skills')}</p>
        <div className="flex flex-wrap gap-1.5">
          {p.skills.map((s) => (
            <span key={s.id} className={clsx('inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px]', s.met ? 'border-emerald-400/25 bg-emerald-400/[0.07] text-emerald-200' : 'border-white/10 bg-white/[0.03] text-slate-300')}>
              {s.met && <CircleCheck className="size-3" />}
              {s.name}
              {!s.met && <span className="text-slate-500">{s.current}→{s.required}%</span>}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-3">
        <p className="mb-1.5 text-[11px] font-medium text-slate-500">{t('Recommended courses')}</p>
        <div className="flex flex-wrap gap-1.5">
          {p.courses.map((c) => {
            const done = !p.missingCourses.some((m) => m.id === c.id);
            return (
              <Link key={c.id} to={`/courses/${c.code}`} className={clsx('inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] transition hover:text-white', done ? 'bg-emerald-400/10 text-emerald-200' : 'bg-white/[0.05] text-slate-300')}>
                {done && <CircleCheck className="size-3" />} {c.title}
              </Link>
            );
          })}
        </div>
      </div>

      <details className="group mt-4 border-t border-white/[0.05] pt-3 text-sm" open={featured}>
        <summary className="cursor-pointer list-none text-xs font-medium text-slate-400 hover:text-slate-200">
          <span className="group-open:hidden">{t('Show learning outcomes')}</span>
          <span className="hidden group-open:inline">{t('Expected learning outcomes')}</span>
        </summary>
        <ul className="mt-2 space-y-1.5">
          {p.outcomes.map((o) => (
            <li key={o} className="flex items-start gap-2 text-xs text-slate-300"><Target className="mt-0.5 size-3 shrink-0 text-cyan-300" />{o}</li>
          ))}
        </ul>
      </details>
    </Card>
  );
}

export default function Projects() {
  const { t } = useI18n();
  useDocumentTitle(t('Projects'));
  const { data, error, loading, reload } = useApi<{ stage: ProjectLevel; recommendedId: number | null; projects: ProjectFit[] }>('/insights/projects');
  const [level, setLevel] = useState<LevelFilter>('all');
  const [relevantOnly, setRelevantOnly] = useState(true);

  if (loading && !data) return <PageLoader />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!data) return null;

  const featured = data.projects.find((p) => p.id === data.recommendedId);
  const list = data.projects.filter((p) => p.id !== featured?.id && (level === 'all' || p.level === level) && (!relevantOnly || p.relevance > 0));

  return (
    <div>
      <PageHeader
        eyebrow={t('Project recommendations')}
        title={t('Prove your skills with the right project')}
        description={t('Projects are matched to your current skill levels and your goals. Readiness shows how much of the required skill you already have.')}
      />

      <div className="mb-6 grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        <Card className="flex flex-col justify-center p-6">
          <p className="eyebrow">{t('Your learning stage')}</p>
          <p className="mt-2 text-3xl font-semibold text-white">{t(data.stage)}</p>
          <p className="mt-2 text-sm text-slate-400">{t(STAGE_TEXT[data.stage])}</p>
          <div className="mt-4 flex gap-1.5">
            {LEVELS.map((l, i) => (
              <span key={l} className={clsx('h-1.5 flex-1 rounded-full', i <= LEVELS.indexOf(data.stage) ? 'bg-linear-to-r from-cyan-400 to-violet-500' : 'bg-white/[0.07]')} title={t(l)} />
            ))}
          </div>
        </Card>
        {featured && (
          <div className="relative">
            <span className="absolute -top-2.5 left-4 z-10 inline-flex items-center gap-1 rounded-full border border-violet-400/40 bg-navy-850 px-2 py-0.5 text-[11px] font-medium text-violet-200"><Sparkles className="size-3" /> {t('Recommended next')}</span>
            <ProjectCard p={featured} featured />
          </div>
        )}
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Segmented<LevelFilter>
          value={level}
          onChange={setLevel}
          size="sm"
          options={[{ value: 'all', label: t('All') }, ...LEVELS.map((l) => ({ value: l, label: t(l) }))]}
        />
        <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-slate-400">
          <input type="checkbox" className="accent-cyan-400" checked={relevantOnly} onChange={(e) => setRelevantOnly(e.target.checked)} />
          {t('Only projects for my goals')}
        </label>
      </div>

      {list.length === 0 ? (
        <EmptyState icon={<FolderKanban className="size-8" />} title={t('No projects match')} description={t('Try another level or include projects outside your goals.')} />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {list.map((p) => <ProjectCard key={p.id} p={p} />)}
        </div>
      )}
    </div>
  );
}
