import { clsx } from 'clsx';
import {
  ArrowDown, ArrowRight, ArrowUp, Check, Clock, Columns3, FlaskConical, GitBranch, List, Minus, Plus, RefreshCw, Route, Rows3, Search, SkipForward, Sparkles, Trash, Workflow,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { StatusIcon, StatusPill } from '../components/course/Badges';
import { CourseDrawer } from '../components/course/CourseDrawer';
import { useCourseActions } from '../components/course/useCourseActions';
import { RoadmapGraph } from '../components/roadmap/RoadmapGraph';
import { StatusLegend } from '../components/roadmap/StatusLegend';
import { Button, ButtonLink } from '../components/ui/Button';
import { Modal } from '../components/ui/Overlay';
import { Card, EmptyState, ErrorState, PageLoader, ProgressBar, Segmented } from '../components/ui/primitives';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useI18n } from '../i18n';
import { api, errorMessage } from '../lib/api';
import { formatMonth, STATUS_META } from '../lib/format';
import { useApi, useDocumentTitle, useMediaQuery } from '../lib/hooks';
import type { CourseStatus, LibraryCourse, PathPreview, Roadmap, RoadmapItem, RoadmapMutation } from '../lib/types';

type View = 'graph' | 'list';
type Dir = 'LR' | 'TB';

const PATH_ICON = { standard: Route, research: FlaskConical, specialization: GitBranch } as const;

function readPref<T extends string>(key: string, fallback: T): T {
  try {
    return (localStorage.getItem(key) as T) || fallback;
  } catch {
    return fallback;
  }
}
function writePref(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

function PathModes({ paths, activeId, onSelect, busySlug }: { paths: PathPreview[]; activeId: number | null; onSelect: (p: PathPreview) => void; busySlug: string | null }) {
  const { t } = useI18n();
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {paths.map((p) => {
        const Icon = PATH_ICON[p.kind];
        const active = p.id === activeId;
        return (
          <button
            key={p.id}
            onClick={() => !active && onSelect(p)}
            className={clsx(
              'group relative flex flex-col rounded-2xl border p-4 text-left transition',
              active ? 'border-cyan-400/50 bg-linear-to-br from-cyan-400/[0.08] to-violet-500/[0.08]' : 'border-white/[0.07] bg-white/[0.02] hover:border-white/15',
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2 text-sm font-semibold text-white">
                <Icon className={clsx('size-4 shrink-0', active ? 'text-cyan-300' : 'text-slate-400')} /> {p.name}
              </span>
              {active ? (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-cyan-400/15 px-2 py-0.5 text-[11px] font-medium text-cyan-200"><Check className="size-3" />{t('Active')}</span>
              ) : (
                <span className="shrink-0 text-[11px] text-slate-500 group-hover:text-slate-300">{busySlug === p.slug ? t('Switching…') : t('Switch')}</span>
              )}
            </div>
            <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-slate-400">{p.description}</p>
            <div className="mt-3 flex flex-wrap items-center gap-1 text-[11px] text-slate-400">
              {p.sequence.slice(0, 5).map((c, i) => (
                <span key={c.id} className="inline-flex items-center gap-1">
                  <span className="max-w-[110px] truncate rounded-md bg-white/[0.05] px-1.5 py-0.5">{c.title}</span>
                  {i < Math.min(4, p.sequence.length - 1) && <ArrowRight className="size-2.5 text-slate-600" />}
                </span>
              ))}
              {p.sequence.length > 5 && <span className="text-slate-500">+{p.sequence.length - 5}</span>}
            </div>
            <div className="mt-3 flex gap-4 border-t border-white/[0.06] pt-3 text-xs text-slate-400">
              <span>{t('{n} courses', { n: p.courseCount })}</span>
              <span>{t('{n} h', { n: p.hours })}</span>
              <span>{t('~{n} weeks', { n: p.weeks })}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function WeeklyHours({ value, onSave }: { value: number; onSave: (v: number) => Promise<void> }) {
  const { t } = useI18n();
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  useEffect(() => setDraft(value), [value]);
  const commit = async (v: number) => {
    const clamped = Math.max(1, Math.min(80, v));
    setDraft(clamped);
    if (clamped === value) return;
    setSaving(true);
    await onSave(clamped);
    setSaving(false);
  };
  return (
    <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-navy-900/60 p-1" title={t('Weekly learning time')}>
      <Clock className={clsx('ml-1.5 size-4', saving ? 'animate-pulse text-cyan-300' : 'text-slate-500')} />
      <button className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white" onClick={() => commit(draft - 2)} aria-label={t('Fewer hours')}><Minus className="size-3.5" /></button>
      <input
        className="w-10 bg-transparent text-center font-mono text-sm text-white outline-none"
        value={draft}
        inputMode="numeric"
        onChange={(e) => setDraft(Number(e.target.value.replace(/\D/g, '')) || 0)}
        onBlur={() => commit(draft)}
        onKeyDown={(e) => e.key === 'Enter' && commit(draft)}
        aria-label={t('Hours per week')}
      />
      <button className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white" onClick={() => commit(draft + 2)} aria-label={t('More hours')}><Plus className="size-3.5" /></button>
      <span className="pr-2 text-xs text-slate-500">{t('h/week')}</span>
    </div>
  );
}

function ListView({ roadmap, onOpen, onMutate }: { roadmap: Roadmap; onOpen: (code: string) => void; onMutate: (m: RoadmapMutation) => void }) {
  const { t } = useI18n();
  const { run, busy } = useCourseActions(onMutate);
  const toast = useToast();
  const [moving, setMoving] = useState<number | null>(null);

  async function move(item: RoadmapItem, direction: 'up' | 'down') {
    setMoving(item.course.id);
    try {
      onMutate(await api.post<RoadmapMutation>(`/roadmap/courses/${item.course.code}/move`, { direction }));
    } catch (err) {
      toast({ tone: 'error', title: t('Can’t move there'), description: errorMessage(err) });
    } finally {
      setMoving(null);
    }
  }

  return (
    <Card className="divide-y divide-white/[0.05] overflow-hidden">
      {roadmap.items.map((item, idx) => {
        const { course, status } = item;
        const done = status === 'completed';
        const startWeek = item.schedule ? Math.floor(item.schedule.startWeek) + 1 : 0;
        const endWeek = item.schedule ? Math.max(Math.ceil(item.schedule.endWeek), startWeek) : 0;
        return (
          <div key={course.id} className={clsx('flex items-start gap-3 p-4 transition sm:items-center', status === 'current' && 'bg-cyan-400/[0.04]', (status === 'skipped' || status === 'locked') && 'opacity-70')}>
            <span className="mt-0.5 w-6 shrink-0 text-center font-mono text-xs text-slate-600 sm:mt-0">{idx + 1}</span>
            <input
              type="checkbox"
              className="mt-1 size-4 shrink-0 cursor-pointer accent-emerald-400 sm:mt-0"
              checked={done}
              disabled={busy !== null}
              aria-label={done ? t('Mark {title} as not completed', { title: course.title }) : t('Mark {title} as completed', { title: course.title })}
              onChange={() => run(done ? 'uncomplete' : 'complete', course.code, course.title)}
            />
            <button onClick={() => onOpen(course.code)} className="min-w-0 flex-1 text-left">
              <div className="flex flex-wrap items-center gap-2">
                <span className={clsx('font-medium text-white', status === 'skipped' && 'line-through decoration-white/40')}>{course.title}</span>
                <span className="font-mono text-[11px] text-slate-500">{course.code}</span>
                <StatusPill status={status} className="sm:hidden" />
              </div>
              <p className="mt-0.5 truncate text-xs text-slate-400">{item.reason}</p>
              {status === 'locked' && item.unmet.length > 0 && (
                <p className="mt-0.5 truncate text-xs text-slate-500">{t('Waiting for {list}', { list: item.unmet.map((id) => roadmap.items.find((i) => i.course.id === id)?.course.title).filter(Boolean).join(', ') })}</p>
              )}
            </button>
            <div className="hidden w-28 shrink-0 text-right text-xs text-slate-500 md:block">
              {item.schedule ? t('Week {from}–{to}', { from: startWeek, to: endWeek }) : done ? t('Done') : '—'}
              <div className="font-mono">{t('{h} h · {c} cr', { h: course.hours, c: course.credits })}</div>
            </div>
            <StatusPill status={status} className="hidden w-28 justify-center sm:inline-flex" />
            <div className="flex shrink-0 items-center gap-0.5">
              <button disabled={idx === 0 || moving !== null} onClick={() => move(item, 'up')} className="rounded-lg p-1.5 text-slate-500 transition hover:bg-white/5 hover:text-white disabled:opacity-30" aria-label={t('Move earlier')}><ArrowUp className="size-3.5" /></button>
              <button disabled={idx === roadmap.items.length - 1 || moving !== null} onClick={() => move(item, 'down')} className="rounded-lg p-1.5 text-slate-500 transition hover:bg-white/5 hover:text-white disabled:opacity-30" aria-label={t('Move later')}><ArrowDown className="size-3.5" /></button>
              {!done && (
                <button onClick={() => run(item.skipped ? 'unskip' : 'skip', course.code, course.title)} className={clsx('rounded-lg p-1.5 transition hover:bg-white/5', item.skipped ? 'text-amber-300' : 'text-slate-500 hover:text-amber-200')} title={item.skipped ? t('Un-skip') : t('Skip')} aria-label={item.skipped ? t('Un-skip course') : t('Skip course')}>
                  <SkipForward className="size-3.5" />
                </button>
              )}
              <button onClick={() => run('remove', course.code, course.title)} className="rounded-lg p-1.5 text-slate-500 transition hover:bg-white/5 hover:text-rose-300" title={t('Remove')} aria-label={t('Remove course')}><Trash className="size-3.5" /></button>
            </div>
          </div>
        );
      })}
    </Card>
  );
}

function AddCourseModal({ open, onClose, roadmap, onAdded }: { open: boolean; onClose: () => void; roadmap: Roadmap; onAdded: (m: RoadmapMutation) => void }) {
  const { t } = useI18n();
  const { data } = useApi<{ courses: LibraryCourse[] }>(open ? '/catalog/courses' : null);
  const [q, setQ] = useState('');
  const { run, busy } = useCourseActions((m) => {
    onAdded(m);
    onClose();
  });
  const inRoadmap = new Set(roadmap.items.map((i) => i.course.id));
  const list = (data?.courses ?? [])
    .filter((c) => !inRoadmap.has(c.id) && !c.personal?.completed)
    .filter((c) => !q || `${c.title} ${c.code} ${t(c.category)} ${c.skills.map((s) => s.name).join(' ')}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <Modal open={open} onClose={onClose} title={t('Add a course')} description={t('Missing prerequisites are added automatically, in the right order.')} className="sm:max-w-xl">
      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
        <input autoFocus className="input pl-9" placeholder={t('Search by title, code, category or skill')} value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <ul className="space-y-1.5">
        {list.map((c) => (
          <li key={c.id} className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{c.title} <span className="font-mono text-[11px] text-slate-500">{c.code}</span></p>
              <p className="truncate text-xs text-slate-500">{t(c.category)} · {t('{n} h', { n: c.hours })} · {c.skills.map((s) => s.name).join(', ')}</p>
            </div>
            <Button size="sm" variant="secondary" loading={busy === 'add'} onClick={() => run('add', c.code, c.title)} icon={<Plus className="size-3.5" />}>{t('Add')}</Button>
          </li>
        ))}
        {data && list.length === 0 && <p className="py-6 text-center text-sm text-slate-500">{t('No matching courses.')}</p>}
      </ul>
    </Modal>
  );
}

export default function RoadmapPage() {
  const { t, locale } = useI18n();
  useDocumentTitle(t('Roadmap'));
  const { user, setUser } = useAuth();
  const toast = useToast();
  const wide = useMediaQuery('(min-width: 1024px)');
  const { data, error, loading, reload, setData } = useApi<{ roadmap: Roadmap | null }>('/roadmap');
  const { data: pathData, reload: reloadPaths } = useApi<{ activePathId: number | null; paths: PathPreview[] }>(user?.careerId ? '/roadmap/paths' : null);
  const [view, setView] = useState<View>(() => readPref('pf.roadmap.view', 'graph'));
  const [dir, setDir] = useState<Dir>(() => readPref('pf.roadmap.dir', 'LR'));
  const [open, setOpen] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [confirmPath, setConfirmPath] = useState<PathPreview | null>(null);
  const [confirmRegen, setConfirmRegen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const roadmap = data?.roadmap ?? null;
  const direction: Dir = wide ? dir : 'TB';
  const counts = useMemo(() => {
    const c: Partial<Record<CourseStatus, number>> = {};
    for (const i of roadmap?.items ?? []) c[i.status] = (c[i.status] ?? 0) + 1;
    return c;
  }, [roadmap]);

  const apply = (m: RoadmapMutation) => setData({ roadmap: m.roadmap });

  async function regenerate(pathSlug: string) {
    setBusy(pathSlug);
    try {
      const m = await api.post<RoadmapMutation>('/roadmap/generate', { pathSlug });
      apply(m);
      void reloadPaths();
      toast({ tone: 'success', title: t('{path} generated', { path: m.roadmap.path.name }), description: t('{n} steps · completed courses kept.', { n: m.roadmap.items.length }) });
    } catch (err) {
      toast({ tone: 'error', title: errorMessage(err) });
    } finally {
      setBusy(null);
      setConfirmPath(null);
      setConfirmRegen(false);
    }
  }

  async function saveHours(weeklyHours: number) {
    try {
      const m = await api.put<RoadmapMutation>('/roadmap/weekly-hours', { weeklyHours });
      apply(m);
      if (user) setUser({ ...user, weeklyHours });
      void reloadPaths();
      toast({ title: t('Pace set to {n} h/week', { n: weeklyHours }), description: t('Estimated finish: {date}', { date: formatMonth(m.roadmap.progress.etaDate, locale) }) });
    } catch (err) {
      toast({ tone: 'error', title: errorMessage(err) });
    }
  }

  if (loading && !data) return <PageLoader label={t('Building your roadmap…')} />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!roadmap) {
    return <EmptyState icon={<Route className="size-8" />} title={t('No roadmap yet')} description={t("Choose a career goal and we'll generate a personalised roadmap.")} action={<ButtonLink to="/settings">{t('Choose a goal')}</ButtonLink>} />;
  }

  const p = roadmap.progress;
  const current = roadmap.items.find((i) => i.course.id === roadmap.currentCourseId);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="eyebrow mb-2">{t('Personalised roadmap')}</p>
          <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-[28px]">
            {t('Your path to')} <span className="text-gradient">{roadmap.career.name}</span>
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm text-slate-400">
            {t("Every node is a course chosen to close a skill gap or unlock one. Hover a course to trace its prerequisites; click it to see why it's here.")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" icon={<Plus className="size-4" />} onClick={() => setAdding(true)}>{t('Add course')}</Button>
          <Button variant="secondary" icon={<RefreshCw className="size-4" />} onClick={() => setConfirmRegen(true)}>{t('Regenerate')}</Button>
          <ButtonLink to="/assistant" variant="outline" icon={<Sparkles className="size-4" />}>{t('Ask PathGPT')}</ButtonLink>
        </div>
      </div>

      {pathData && <PathModes paths={pathData.paths} activeId={roadmap.path.id} onSelect={setConfirmPath} busySlug={busy} />}

      <Card className="flex flex-col gap-4 p-4 xl:flex-row xl:items-center">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-center justify-between gap-4 text-sm">
            <span className="text-slate-300">{t('{pct}% complete · {done}/{total} courses', { pct: p.pct, done: p.completed, total: p.total })}</span>
            <span className="truncate text-xs text-slate-500">{p.remainingHours ? t('~{weeks} weeks left · finish {date}', { weeks: p.etaWeeks, date: formatMonth(p.etaDate, locale) }) : t('All done')}</span>
          </div>
          <ProgressBar value={p.pct} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <WeeklyHours value={roadmap.weeklyHours} onSave={saveHours} />
          <Segmented<View>
            value={view}
            onChange={(v) => { setView(v); writePref('pf.roadmap.view', v); }}
            size="sm"
            options={[{ value: 'graph', label: t('Graph'), icon: <Workflow className="size-3.5" /> }, { value: 'list', label: t('List'), icon: <List className="size-3.5" /> }]}
          />
          {view === 'graph' && wide && (
            <Segmented<Dir>
              value={dir}
              onChange={(v) => { setDir(v); writePref('pf.roadmap.dir', v); }}
              size="sm"
              options={[{ value: 'LR', label: t('Horizontal'), icon: <Columns3 className="size-3.5" /> }, { value: 'TB', label: t('Vertical'), icon: <Rows3 className="size-3.5" /> }]}
            />
          )}
        </div>
      </Card>

      {roadmap.autoSkipped.length > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-400/25 bg-amber-400/[0.06] p-3.5 text-sm text-amber-100">
          <SkipForward className="mt-0.5 size-4 shrink-0 text-amber-300" />
          <div className="space-y-1">
            {roadmap.autoSkipped.map((s) => <p key={s.course.id}>{s.reason}</p>)}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <StatusLegend counts={counts} />
        {current && (
          <button onClick={() => setOpen(current.course.code)} className="inline-flex items-center gap-2 text-sm text-cyan-300 hover:underline">
            <StatusIcon status="current" className="size-4" /> {t('Current: {title}', { title: current.course.title })}
          </button>
        )}
      </div>

      {view === 'graph' ? (
        <Card className="overflow-hidden p-0">
          <RoadmapGraph roadmap={roadmap} direction={direction} onOpen={(id) => setOpen(roadmap.items.find((i) => i.course.id === id)!.course.code)} className="h-[68vh] min-h-[520px]" fitKey={`${roadmap.path.id}-${roadmap.items.length}`} />
        </Card>
      ) : (
        <ListView roadmap={roadmap} onOpen={setOpen} onMutate={apply} />
      )}

      <p className="text-center text-xs text-slate-500">
        <span className={STATUS_META.completed.text}>{t('Completed')}</span> {t('courses count toward your skills')} ·{' '}
        <span className={STATUS_META.current.text}>{t('Current')}</span> {t('is your next step')} ·{' '}
        <span className={STATUS_META.recommended.text}>{t('Recommended')}</span> {t('courses are unlocked')} ·{' '}
        <span className={STATUS_META.locked.text}>{t('Locked')}</span> {t('courses wait for prerequisites.')} <Link to="/courses" className="text-cyan-300 hover:underline">{t('Browse all courses')}</Link>
      </p>

      <CourseDrawer code={open} onClose={() => setOpen(null)} onChanged={apply} />
      <AddCourseModal open={adding} onClose={() => setAdding(false)} roadmap={roadmap} onAdded={apply} />

      <Modal
        open={Boolean(confirmPath)}
        onClose={() => setConfirmPath(null)}
        title={t('Switch to the {path}?', { path: confirmPath?.name ?? '' })}
        description={confirmPath?.description}
        footer={<><Button variant="ghost" onClick={() => setConfirmPath(null)}>{t('Cancel')}</Button><Button loading={busy === confirmPath?.slug} onClick={() => confirmPath && regenerate(confirmPath.slug)}>{t('Switch path')}</Button></>}
      >
        <p className="text-sm text-slate-300">{t('Your roadmap will be regenerated for this path: {courses} courses, about {hours} hours (~{weeks} weeks at your pace). Completed courses are always kept; custom additions and skips are reset.', { courses: confirmPath?.courseCount ?? 0, hours: confirmPath?.hours ?? 0, weeks: confirmPath?.weeks ?? 0 })}</p>
      </Modal>
      <Modal
        open={confirmRegen}
        onClose={() => setConfirmRegen(false)}
        title={t('Regenerate your roadmap?')}
        description={t('Re-runs the engine with your latest skills, completed courses and goal.')}
        footer={<><Button variant="ghost" onClick={() => setConfirmRegen(false)}>{t('Cancel')}</Button><Button loading={busy === roadmap.path.slug} onClick={() => regenerate(roadmap.path.slug)}>{t('Regenerate')}</Button></>}
      >
        <p className="text-sm text-slate-300">{t("Completed courses are kept. Courses you added, skipped, removed or reordered by hand will be reset to the engine's recommendation.")}</p>
      </Modal>
    </div>
  );
}
