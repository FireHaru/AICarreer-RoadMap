import { clsx } from 'clsx';
import { ArrowRight, CircleCheck, Route, TrendingUp, TriangleAlert } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { CHART, Legend, SkillGapChart } from '../components/charts';
import { CourseDrawer } from '../components/course/CourseDrawer';
import { Button } from '../components/ui/Button';
import { Card, ErrorState, PageHeader, PageLoader, ProgressRing, Segmented } from '../components/ui/primitives';
import { useToast } from '../context/ToastContext';
import { msg, useI18n } from '../i18n';
import { api, errorMessage } from '../lib/api';
import { PRIORITY_META } from '../lib/format';
import { useApi, useDocumentTitle } from '../lib/hooks';
import type { GapItem, GapResponse } from '../lib/types';

type Scope = 'path' | 'career' | 'research';

const GROUPS = [
  { key: 'critical', title: msg('Critical gaps'), short: msg('Critical'), description: msg('Less than half of the required level — these drive your roadmap.'), icon: TriangleAlert, tone: 'text-rose-300', bar: 'bg-rose-400' },
  { key: 'improve', title: msg('Skills to improve'), short: msg('Improve'), description: msg('You have a base, but not yet the required level.'), icon: TrendingUp, tone: 'text-amber-300', bar: 'bg-amber-400' },
  { key: 'ready', title: msg('Skills already ready'), short: msg('Ready'), description: msg('You meet the requirement — no extra courses needed.'), icon: CircleCheck, tone: 'text-emerald-300', bar: 'bg-emerald-400' },
] as const;

function GapCard({ item, onOpen }: { item: GapItem; onOpen: (code: string) => void }) {
  const { t } = useI18n();
  const group = GROUPS.find((g) => g.key === item.group)!;
  return (
    <Card className="flex flex-col p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium text-white">{item.skill.name}</p>
          <p className="text-xs text-slate-500">{t('{category} · for {target}', { category: t(item.skill.category), target: item.sources[0]?.name ?? '' })}</p>
        </div>
        {item.group !== 'ready' && <span className={clsx('shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium', PRIORITY_META[item.priority])}>{t(item.priority)}</span>}
      </div>
      <div className="mt-4 flex items-baseline justify-between text-sm">
        <span className="text-slate-300"><span className="font-semibold text-white">{item.current}%</span> <span className="text-slate-500">{t('now')}</span></span>
        <ArrowRight className="size-3.5 text-slate-600" />
        <span className="text-slate-300"><span className="font-semibold text-white">{item.required}%</span> <span className="text-slate-500">{t('required')}</span></span>
      </div>
      <div className="relative mt-2 h-2 rounded-full bg-white/[0.07]">
        <div className={clsx('h-full rounded-full', group.bar)} style={{ width: `${Math.min(100, item.current)}%` }} />
        <div className="absolute -top-1 -bottom-1 w-0.5 rounded-full bg-white/80" style={{ left: `calc(${item.required}% - 1px)` }} />
      </div>
      <div className="mt-3 flex items-center justify-between text-xs">
        <span className={group.tone}>
          {item.gap > 0 ? t('{n}% gap', { n: item.gapPct }) : item.current > item.required ? t('+{n}% above target', { n: item.current - item.required }) : t('Target met')}
        </span>
        {item.viaCourse && item.group === 'ready' && <span className="truncate text-slate-500">{t('via {course}', { course: item.viaCourse.title })}</span>}
      </div>
      {item.closingCourse && item.gap > 0 && (
        <button onClick={() => onOpen(item.closingCourse!.code)} className="mt-3 flex items-center justify-between gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-1.5 text-left text-xs text-slate-400 transition hover:border-white/15 hover:text-slate-200">
          <span className="truncate">{t('Closed by')} <span className="text-slate-200">{item.closingCourse.title}</span></span>
          <ArrowRight className="size-3 shrink-0" />
        </button>
      )}
    </Card>
  );
}

export default function SkillGap() {
  const { t } = useI18n();
  useDocumentTitle(t('Skill Gap'));
  const [scope, setScope] = useState<Scope>('path');
  const { data, error, loading, reload } = useApi<GapResponse>(`/insights/gap?scope=${scope}`);
  const [open, setOpen] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  async function generate() {
    setGenerating(true);
    try {
      await api.post('/roadmap/generate', { pathSlug: data?.path.slug });
      toast({ tone: 'success', title: t('Roadmap generated'), description: t('Built from your current skill gaps.') });
      navigate('/roadmap');
    } catch (err) {
      toast({ tone: 'error', title: errorMessage(err) });
    } finally {
      setGenerating(false);
    }
  }

  const chartData = data?.items
    .filter((i) => i.weight >= 0.5)
    .sort((a, b) => b.score - a.score || b.required - a.required)
    .slice(0, 10)
    .map((i) => ({ name: i.skill.name, current: i.current, required: i.required }));

  return (
    <div>
      <PageHeader
        eyebrow={t('Skill gap analysis')}
        title={data?.career ? <>{t('Where you stand for')} <span className="text-gradient">{scope === 'research' ? data.research?.name : data.career.name}</span></> : t('Skill Gap')}
        description={t('Your current level for every required skill, compared with the level the goal requires. Completed courses count as evidence of their skills.')}
        actions={<Button onClick={generate} loading={generating} icon={<Route className="size-4" />} size="lg">{t('Generate My Roadmap')}</Button>}
      />

      <Segmented<Scope>
        value={scope}
        onChange={setScope}
        className="mb-6"
        options={[
          { value: 'path', label: data ? data.path.name : t('Current path') },
          { value: 'career', label: t('Career only') },
          ...(data && !data.research ? [] : [{ value: 'research' as const, label: t('Research direction') }]),
        ]}
      />

      {loading && !data ? (
        <PageLoader />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : data ? (
        <div className="space-y-8">
          <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
            <Card className="flex flex-col items-center justify-center gap-4 p-6 text-center">
              <ProgressRing value={data.readiness} size={140} stroke={12}>
                <span className="text-3xl font-semibold text-white">{data.readiness}%</span>
                <span className="text-[11px] text-slate-500">{t('ready')}</span>
              </ProgressRing>
              <p className="text-sm text-slate-400">{t('Weighted readiness — core skills count more than supporting ones.')}</p>
              <div className="grid w-full grid-cols-3 gap-2 text-center">
                {GROUPS.map((g) => (
                  <div key={g.key} className="rounded-xl border border-white/[0.06] bg-white/[0.02] py-2">
                    <p className={clsx('text-lg font-semibold', g.tone)}>{data.counts[g.key]}</p>
                    <p className="text-[10px] text-slate-500">{t(g.short)}</p>
                  </div>
                ))}
              </div>
            </Card>
            <Card className="p-5">
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-semibold text-white">{t('Current vs required')}</h2>
                  <p className="text-xs text-slate-500">{t('Largest weighted gaps first · bar length = required level')}</p>
                </div>
                <Legend items={[{ label: t('You have'), color: CHART.have }, { label: t('Still missing'), color: CHART.missing }]} />
              </div>
              {chartData && chartData.length > 0 ? <SkillGapChart data={chartData} /> : <p className="text-sm text-slate-500">{t('No requirements for this scope.')}</p>}
            </Card>
          </div>

          {GROUPS.map((g) => {
            const items = data.items.filter((i) => i.group === g.key);
            if (!items.length) return null;
            return (
              <section key={g.key}>
                <div className="mb-3 flex items-center gap-2">
                  <g.icon className={clsx('size-4', g.tone)} />
                  <h2 className="font-semibold text-white">{t(g.title)}</h2>
                  <span className="rounded-md bg-white/[0.06] px-1.5 text-xs text-slate-400">{items.length}</span>
                  <span className="hidden text-sm text-slate-500 sm:inline">— {t(g.description)}</span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {items.map((i) => <GapCard key={i.skill.id} item={i} onOpen={setOpen} />)}
                </div>
              </section>
            );
          })}

          <Card className="flex flex-col items-center gap-4 p-6 text-center sm:flex-row sm:text-left">
            <div className="flex-1">
              <p className="font-semibold text-white">{t('Turn these gaps into a plan')}</p>
              <p className="mt-1 text-sm text-slate-400">{t('PathForge picks the course that closes each gap, adds missing prerequisites and orders everything by dependency and gap size.')}</p>
            </div>
            <Button onClick={generate} loading={generating} icon={<Route className="size-4" />}>{t('Generate My Roadmap')}</Button>
          </Card>
        </div>
      ) : null}

      <CourseDrawer code={open} onClose={() => setOpen(null)} onChanged={() => void reload()} />
    </div>
  );
}
