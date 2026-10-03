import { clsx } from 'clsx';
import { Clock, Funnel, Search, X } from 'lucide-react';
import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router';
import { DifficultyTag, StatusPill } from '../components/course/Badges';
import { EmptyState, ErrorState, PageHeader, PageLoader } from '../components/ui/primitives';
import { useAuth } from '../context/AuthContext';
import { msg, useI18n } from '../i18n';
import { useApi, useDocumentTitle, useMeta } from '../lib/hooks';
import type { LibraryCourse } from '../lib/types';

const HOURS = [
  { value: '', label: msg('Any length') },
  { value: 'short', label: msg('≤ 40 h') },
  { value: 'medium', label: msg('41 – 50 h') },
  { value: 'long', label: msg('51 h +') },
];
const CREDITS = [
  { value: '', label: msg('Any credits') },
  { value: '2', label: msg('2 credits') },
  { value: '3', label: msg('3 credits') },
  { value: '4', label: msg('4 credits') },
];

function matchesHours(h: number, f: string) {
  if (f === 'short') return h <= 40;
  if (f === 'medium') return h > 40 && h <= 50;
  if (f === 'long') return h > 50;
  return true;
}

function CourseCard({ course }: { course: LibraryCourse }) {
  const { t } = useI18n();
  const p = course.personal;
  return (
    <Link to={`/courses/${course.code}`} className="card-interactive flex flex-col p-5">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="flex items-center gap-2 text-slate-500">
          <span className="font-mono font-medium">{course.code}</span>·<span>{t(course.category)}</span>
        </span>
        {p?.completed ? <StatusPill status="completed" /> : p?.status ? <StatusPill status={p.status} /> : null}
      </div>
      <h3 className="mt-2 font-semibold text-white">{course.title}</h3>
      <p className="mt-1 line-clamp-2 text-sm text-slate-400">{course.summary}</p>
      <div className="mt-3 flex items-center gap-3 text-xs text-slate-400">
        <DifficultyTag level={course.difficulty} />
        <span className="inline-flex items-center gap-1"><Clock className="size-3" />{t('{n} h', { n: course.hours })}</span>
        <span>{t('{n} cr', { n: course.credits })}</span>
        {course.kind === 'project' && <span className="rounded-md bg-violet-400/15 px-1.5 text-[10px] text-violet-200">{t('Project')}</span>}
      </div>
      <div className="mt-4 space-y-2 border-t border-white/[0.05] pt-3 text-xs">
        <p className="truncate text-slate-500">
          <span className="text-slate-600">{t('Prerequisites:')} </span>
          {course.prerequisites.length ? course.prerequisites.map((x) => x.title).join(', ') : t('none')}
        </p>
        <div className="flex flex-wrap gap-1">
          {course.skills.map((s) => (
            <span key={s.id} className="rounded-md bg-cyan-400/[0.08] px-1.5 py-0.5 text-[11px] text-cyan-200">{s.name} {s.gain}%</span>
          ))}
        </div>
        {(course.careers.length > 0 || course.research.length > 0) && (
          <p className="truncate text-slate-500">
            {[...course.careers.map((c) => c.name), ...course.research.map((r) => t('{name} research', { name: r.name }))].join(' · ')}
          </p>
        )}
      </div>
    </Link>
  );
}

export default function CourseLibrary() {
  const { t } = useI18n();
  useDocumentTitle(t('Course Library'));
  const { user } = useAuth();
  const meta = useMeta();
  const { data, error, loading, reload } = useApi<{ courses: LibraryCourse[] }>('/catalog/courses');
  const [params, setParams] = useSearchParams();
  const f = {
    q: params.get('q') ?? '',
    category: params.get('category') ?? '',
    difficulty: params.get('difficulty') ?? '',
    career: params.get('career') ?? '',
    research: params.get('research') ?? '',
    credits: params.get('credits') ?? '',
    hours: params.get('hours') ?? '',
    mine: params.get('mine') ?? '',
  };
  const set = (k: keyof typeof f, v: string) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v);
    else next.delete(k);
    setParams(next, { replace: true });
  };
  const active = Object.entries(f).filter(([k, v]) => v && k !== 'q').length;

  const filtered = useMemo(() => {
    const q = f.q.trim().toLowerCase();
    return (data?.courses ?? []).filter((c) =>
      (!q || `${c.title} ${c.code} ${c.summary} ${c.skills.map((s) => s.name).join(' ')}`.toLowerCase().includes(q))
      && (!f.category || c.category === f.category)
      && (!f.difficulty || c.difficulty === f.difficulty)
      && (!f.career || c.careers.some((x) => x.slug === f.career))
      && (!f.research || c.research.some((x) => x.slug === f.research))
      && (!f.credits || c.credits === Number(f.credits))
      && matchesHours(c.hours, f.hours)
      && (!f.mine || (f.mine === 'roadmap' ? c.personal?.inRoadmap : f.mine === 'completed' ? c.personal?.completed : !c.personal?.completed)),
    );
  }, [data, f.q, f.category, f.difficulty, f.career, f.research, f.credits, f.hours, f.mine]);

  return (
    <div>
      <PageHeader
        eyebrow={t('Course library')}
        title={t('Every course, with its place in the map')}
        description={t('Each course lists its prerequisites, the skills it builds and the careers and research directions it serves.')}
      />

      <div className="card mb-6 space-y-3 p-3 sm:p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
          <input className="input pl-9" placeholder={t('Search courses, codes or skills…')} value={f.q} onChange={(e) => set('q', e.target.value)} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Funnel className="size-4 text-slate-500" />
          <select className="input h-9 w-auto min-w-[150px] text-xs" value={f.category} onChange={(e) => set('category', e.target.value)} aria-label={t('Category')}>
            <option value="">{t('All categories')}</option>
            {meta?.categories.map((c) => <option key={c} value={c}>{t(c)}</option>)}
          </select>
          <select className="input h-9 w-auto min-w-[140px] text-xs" value={f.career} onChange={(e) => set('career', e.target.value)} aria-label={t('Career')}>
            <option value="">{t('Any career')}</option>
            {meta?.careers.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
          </select>
          <select className="input h-9 w-auto min-w-[150px] text-xs" value={f.research} onChange={(e) => set('research', e.target.value)} aria-label={t('Research direction')}>
            <option value="">{t('Any research direction')}</option>
            {meta?.research.map((r) => <option key={r.id} value={r.slug}>{r.name}</option>)}
          </select>
          <select className="input h-9 w-auto text-xs" value={f.credits} onChange={(e) => set('credits', e.target.value)} aria-label={t('Credits')}>
            {CREDITS.map((c) => <option key={c.value} value={c.value}>{t(c.label)}</option>)}
          </select>
          <select className="input h-9 w-auto text-xs" value={f.hours} onChange={(e) => set('hours', e.target.value)} aria-label={t('Estimated learning time')}>
            {HOURS.map((c) => <option key={c.value} value={c.value}>{t(c.label)}</option>)}
          </select>
          {user && (
            <select className="input h-9 w-auto text-xs" value={f.mine} onChange={(e) => set('mine', e.target.value)} aria-label={t('My courses')}>
              <option value="">{t('All courses')}</option>
              <option value="roadmap">{t('In my roadmap')}</option>
              <option value="todo">{t('Not completed')}</option>
              <option value="completed">{t('Completed')}</option>
            </select>
          )}
          {active > 0 && (
            <button onClick={() => setParams(f.q ? { q: f.q } : {}, { replace: true })} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-slate-400 hover:bg-white/5 hover:text-white">
              <X className="size-3" /> {t('Clear {n}', { n: active })}
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(meta?.difficulties ?? []).map((d) => (
            <button key={d} onClick={() => set('difficulty', f.difficulty === d ? '' : d)} className={clsx('rounded-full border px-3 py-1 text-xs transition', f.difficulty === d ? 'border-cyan-400/50 bg-cyan-400/10 text-white' : 'border-white/10 text-slate-400 hover:text-slate-200')}>
              {t(d)}
            </button>
          ))}
        </div>
      </div>

      {loading && !data ? (
        <PageLoader />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : filtered.length === 0 ? (
        <EmptyState icon={<Search className="size-8" />} title={t('No courses match these filters')} description={t('Try removing a filter or searching for a skill instead.')} />
      ) : (
        <>
          <p className="mb-3 text-xs text-slate-500">{t('{n} of {total} courses', { n: filtered.length, total: data?.courses.length ?? 0 })}</p>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((c) => <CourseCard key={c.id} course={c} />)}
          </div>
        </>
      )}
    </div>
  );
}
