import { clsx } from 'clsx';
import { ArrowRight, BookOpen, Briefcase, ChevronRight, CircleCheck, FolderKanban, Gauge, Route, Target } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { RoadmapGraph } from '../components/roadmap/RoadmapGraph';
import { StatusLegend } from '../components/roadmap/StatusLegend';
import { Button, ButtonLink } from '../components/ui/Button';
import { Card, ErrorState, PageHeader, PageLoader, ProgressRing, Segmented } from '../components/ui/primitives';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useI18n } from '../i18n';
import { api, errorMessage } from '../lib/api';
import { PROJECT_LEVEL_META } from '../lib/format';
import { useApi, useDocumentTitle, useMediaQuery, useMeta } from '../lib/hooks';
import { DomainIcon } from '../lib/icons';
import type { CareerDetail, CareerListItem, User } from '../lib/types';

function FlowColumn({ step, title, icon, children, last }: { step: number; title: string; icon: ReactNode; children: ReactNode; last?: boolean }) {
  return (
    <div className="relative flex min-w-0 flex-col">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex size-7 items-center justify-center rounded-lg bg-white/[0.06] text-cyan-300">{icon}</span>
        <span className="font-mono text-[11px] text-slate-600">0{step}</span>
        <h3 className="text-sm font-semibold text-white">{title}</h3>
      </div>
      <div className="flex-1 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-3">{children}</div>
      {!last && <ChevronRight className="absolute -right-4 top-1.5 hidden size-5 text-slate-600 xl:block" />}
    </div>
  );
}

function CareerList() {
  const { t } = useI18n();
  useDocumentTitle(t('Career Explorer'));
  const { data, error, loading, reload } = useApi<{ careers: CareerListItem[] }>('/catalog/careers');
  const meta = useMeta();
  if (loading && !data) return <PageLoader />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  return (
    <div>
      <PageHeader eyebrow={t('Career explorer')} title={t('Start from the job you want')} description={t('Pick a career to see the skills it requires, the courses that build them, the projects that prove them — and the roadmap you would follow.')} />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {data?.careers.map((c) => (
          <Link key={c.id} to={`/careers/${c.slug}`} className="card-interactive group flex flex-col p-5">
            <div className="flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-xl bg-linear-to-br from-cyan-400/15 to-violet-500/15 text-cyan-200">
                <DomainIcon name={c.icon} className="size-5" />
              </span>
              <div>
                <p className="font-semibold text-white">{c.name}</p>
                <p className="text-sm text-slate-400">{c.tagline}</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {c.skills.slice(0, 5).map((s) => <span key={s.id} className="chip">{s.name} <span className="text-slate-500">{s.required}%</span></span>)}
            </div>
            <span className="mt-4 inline-flex items-center gap-1 text-sm text-cyan-300 opacity-80 group-hover:opacity-100">{t('Explore path')} <ArrowRight className="size-4" /></span>
          </Link>
        ))}
      </div>
      {meta && (
        <section className="mt-12">
          <h2 className="mb-4 text-lg font-semibold text-white">{t('Research directions')}</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {meta.research.map((r) => (
              <Card key={r.id} className="p-4">
                <DomainIcon name={r.icon} className="size-5 text-fuchsia-300" />
                <p className="mt-2 text-sm font-medium text-white">{r.name}</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-400">{r.description}</p>
              </Card>
            ))}
          </div>
          <p className="mt-3 text-xs text-slate-500">{t('Pick a research direction in your profile; the Research Path of any career folds its requirements into your roadmap.')}</p>
        </section>
      )}
    </div>
  );
}

function CareerView({ slug }: { slug: string }) {
  const { t } = useI18n();
  const [path, setPath] = useState<string>('standard');
  const { data, error, loading, reload } = useApi<CareerDetail>(`/catalog/careers/${slug}?path=${path}`);
  const meta = useMeta();
  const { user, setUser } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const wide = useMediaQuery('(min-width: 1024px)');
  const [saving, setSaving] = useState(false);
  useDocumentTitle(data?.career.name ?? t('Career Explorer'));

  async function setGoal() {
    if (!data || !user) return;
    setSaving(true);
    try {
      const profile = await api.get<{ secondaryCareerIds: number[]; secondaryResearchIds: number[] }>('/me/profile');
      const { user: updated } = await api.put<{ user: User }>('/me/goals', {
        careerId: data.career.id,
        researchId: user.researchId,
        secondaryCareerIds: profile.secondaryCareerIds.filter((id) => id !== data.career.id),
        secondaryResearchIds: profile.secondaryResearchIds,
        pathSlug: path,
      });
      setUser(updated);
      toast({ tone: 'success', title: t('Your goal is now {career}', { career: data.career.name }), description: t('Roadmap regenerated — completed courses were kept.') });
      navigate('/roadmap');
    } catch (err) {
      toast({ tone: 'error', title: errorMessage(err) });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
        {meta?.careers.map((c) => (
          <Link key={c.id} to={`/careers/${c.slug}`} className={clsx('inline-flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs transition', c.slug === slug ? 'border-cyan-400/50 bg-cyan-400/10 text-white' : 'border-white/10 text-slate-400 hover:text-slate-200')}>
            <DomainIcon name={c.icon} className="size-3.5" /> {c.name}
          </Link>
        ))}
      </div>

      {loading && !data ? (
        <PageLoader />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : data ? (
        <>
          <Card className="relative overflow-hidden p-6 sm:p-8">
            <div className="pointer-events-none absolute -right-16 -top-24 size-72 rounded-full bg-violet-500/10 blur-3xl" />
            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3">
                  <span className="flex size-12 items-center justify-center rounded-2xl bg-linear-to-br from-cyan-400/20 to-violet-500/20 text-cyan-100">
                    <DomainIcon name={data.career.icon} className="size-6" />
                  </span>
                  <div>
                    <p className="eyebrow">{t('Career explorer')}</p>
                    <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">{data.career.name}</h1>
                  </div>
                </div>
                <p className="mt-4 text-lg text-slate-200">{data.career.tagline}</p>
                <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-400">{data.career.description}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {user?.onboarded ? (
                    data.isCurrentGoal ? (
                      <span className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-100"><CircleCheck className="size-4" /> {t('This is your current goal')}</span>
                    ) : (
                      <Button onClick={setGoal} loading={saving} icon={<Target className="size-4" />}>{t('Set as my goal')}</Button>
                    )
                  ) : (
                    <ButtonLink to="/register" icon={<Route className="size-4" />}>{t('Build this roadmap for me')}</ButtonLink>
                  )}
                  {data.isCurrentGoal && <ButtonLink to="/roadmap" variant="secondary">{t('Open my roadmap')}</ButtonLink>}
                </div>
              </div>
              {data.readiness !== null && (
                <div className="flex items-center gap-4 rounded-2xl border border-white/[0.07] bg-navy-900/50 p-4">
                  <ProgressRing value={data.readiness} size={96} stroke={9}>
                    <span className="text-xl font-semibold text-white">{data.readiness}%</span>
                  </ProgressRing>
                  <div className="text-sm">
                    <p className="font-medium text-white">{t('Your readiness')}</p>
                    <p className="mt-1 max-w-[180px] text-xs text-slate-400">{t('Weighted share of the required skill you already have.')}</p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Reverse flow */}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 xl:gap-8">
            <FlowColumn step={1} title={t('Required skills')} icon={<Gauge className="size-4" />}>
              <ul className="space-y-3">
                {data.skills.map((s) => (
                  <li key={s.id}>
                    <div className="mb-1 flex justify-between gap-2 text-xs">
                      <span className="text-slate-200">{s.name}{s.weight >= 0.9 && <span className="ml-1.5 text-[10px] text-cyan-300">{t('core')}</span>}</span>
                      <span className="shrink-0 text-slate-500">{s.current !== null && <>{s.current}% / </>}{s.required}%</span>
                    </div>
                    <div className="relative h-1.5 rounded-full bg-white/[0.07]">
                      {s.current !== null && <div className="absolute inset-y-0 left-0 rounded-full bg-cyan-500" style={{ width: `${Math.min(100, s.current)}%` }} />}
                      <div className="absolute -top-0.5 -bottom-0.5 w-0.5 rounded-full bg-violet-300" style={{ left: `calc(${s.required}% - 1px)` }} />
                    </div>
                  </li>
                ))}
              </ul>
            </FlowColumn>
            <FlowColumn step={2} title={t('Recommended courses')} icon={<BookOpen className="size-4" />}>
              <ul className="space-y-1">
                {data.courses.core.map((c) => (
                  <li key={c.id}>
                    <Link to={`/courses/${c.code}`} className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-sm text-slate-200 transition hover:bg-white/[0.05]">
                      <span className="truncate">{c.title}</span>
                      <span className="shrink-0 font-mono text-[10px] text-slate-500">{c.code}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              {data.courses.elective.length > 0 && (
                <div className="mt-3 border-t border-white/[0.05] pt-3">
                  <p className="mb-1.5 px-2 text-[11px] text-slate-500">{t('Electives')}</p>
                  <div className="flex flex-wrap gap-1.5 px-1">
                    {data.courses.elective.map((c) => <Link key={c.id} to={`/courses/${c.code}`} className="chip hover:border-white/20">{c.title}</Link>)}
                  </div>
                </div>
              )}
            </FlowColumn>
            <FlowColumn step={3} title={t('Projects')} icon={<FolderKanban className="size-4" />}>
              <ul className="space-y-2">
                {data.projects.map((p) => (
                  <li key={p.id} className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className={clsx('rounded-full border px-1.5 py-0.5 text-[10px] font-medium', PROJECT_LEVEL_META[p.level])}>{t(p.level)}</span>
                      {p.readiness !== null && <span className="text-[11px] text-slate-500">{t('{n}% ready', { n: p.readiness })}</span>}
                    </div>
                    <p className="mt-1.5 text-sm font-medium text-white">{p.title}</p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-slate-400">{p.summary}</p>
                  </li>
                ))}
              </ul>
            </FlowColumn>
            <FlowColumn step={4} title={t('Portfolio suggestions')} icon={<Briefcase className="size-4" />} last>
              <ul className="space-y-2.5">
                {data.career.portfolio.map((p) => (
                  <li key={p} className="flex items-start gap-2 text-sm text-slate-300">
                    <CircleCheck className="mt-0.5 size-4 shrink-0 text-emerald-400/80" /> {p}
                  </li>
                ))}
              </ul>
            </FlowColumn>
          </div>

          {/* Roadmap */}
          <Card className="overflow-hidden p-0">
            <div className="flex flex-col gap-3 border-b border-white/[0.06] p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-semibold text-white">{t('The learning roadmap')}</h2>
                <p className="text-xs text-slate-500">
                  {data.personalized ? t('Personalised from your current skills and completed courses') : t('For a student starting from scratch — sign up to personalise it')}
                  {' · '}
                  {t('{n} steps · {h} h to go', { n: data.preview.items.length, h: data.preview.progress.totalHours - data.preview.progress.completedHours })}
                </p>
              </div>
              <Segmented value={path} onChange={setPath} size="sm" options={data.paths.map((p) => ({ value: p.slug, label: p.name }))} />
            </div>
            <RoadmapGraph roadmap={data.preview} direction={wide ? 'LR' : 'TB'} onOpen={(id) => navigate(`/courses/${data.preview.items.find((i) => i.course.id === id)!.course.code}`)} className="h-[560px]" minimap={false} fitKey={`${slug}-${path}`} />
            <div className="border-t border-white/[0.06] p-3">
              <StatusLegend />
            </div>
          </Card>
        </>
      ) : null}
    </div>
  );
}

export default function CareerExplorer() {
  const { slug } = useParams();
  return slug ? <CareerView key={slug} slug={slug} /> : <CareerList />;
}
