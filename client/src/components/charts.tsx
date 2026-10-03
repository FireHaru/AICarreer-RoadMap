import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useI18n } from '../i18n';

/** Validated against the navy surface (dataviz validator: all checks pass in dark mode). */
export const CHART = {
  have: '#0891b2',
  missing: '#8b5cf6',
  remaining: '#334155',
  surface: '#0b1226',
  grid: 'rgb(255 255 255 / 0.06)',
  axis: '#64748b',
  text: '#cbd5e1',
};

function TooltipBox({ title, rows }: { title: string; rows: { label: string; value: string; color?: string }[] }) {
  return (
    <div className="rounded-xl border border-white/10 bg-navy-850/95 px-3 py-2.5 text-xs shadow-xl backdrop-blur-xl">
      <p className="mb-1.5 font-medium text-white">{title}</p>
      {rows.map((r) => (
        <p key={r.label} className="flex items-center gap-2 text-slate-300">
          {r.color && <span className="size-2 rounded-sm" style={{ background: r.color }} />}
          <span className="text-slate-400">{r.label}</span>
          <span className="ml-auto pl-3 font-medium text-slate-100">{r.value}</span>
        </p>
      ))}
    </div>
  );
}

export function Legend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
      {items.map((i) => (
        <span key={i.label} className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm" style={{ background: i.color }} />
          {i.label}
        </span>
      ))}
    </div>
  );
}

/** Part-to-whole per skill: bar length = required level, filled part = what you have, rest = the gap. */
export function SkillGapChart({ data }: { data: { name: string; current: number; required: number }[] }) {
  const { t } = useI18n();
  const rows = data.map((d) => ({ ...d, have: Math.min(d.current, d.required), missing: Math.max(0, d.required - d.current) }));
  return (
    <div style={{ height: Math.max(180, rows.length * 34 + 30) }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 36, bottom: 0, left: 4 }} barCategoryGap={8}>
          <CartesianGrid horizontal={false} stroke={CHART.grid} />
          <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fill: CHART.axis, fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="name" width={150} tick={{ fill: CHART.text, fontSize: 12 }} axisLine={false} tickLine={false} />
          <Tooltip
            cursor={{ fill: 'rgb(255 255 255 / 0.04)' }}
            content={({ active, payload }) => {
              const p = payload?.[0]?.payload as (typeof rows)[number] | undefined;
              if (!active || !p) return null;
              return <TooltipBox title={p.name} rows={[{ label: t('You have'), value: `${p.current}%`, color: CHART.have }, { label: t('Required'), value: `${p.required}%` }, { label: t('Gap'), value: `${p.missing}%`, color: CHART.missing }]} />;
            }}
          />
          <Bar dataKey="have" stackId="s" fill={CHART.have} stroke={CHART.surface} strokeWidth={2} isAnimationActive={false} />
          <Bar dataKey="missing" stackId="s" fill={CHART.missing} fillOpacity={0.75} stroke={CHART.surface} strokeWidth={2} radius={[0, 4, 4, 0]} isAnimationActive={false}>
            <LabelList dataKey="required" position="right" formatter={(v) => `${v}%`} style={{ fill: CHART.axis, fontSize: 11 }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Hours per category, completed (accent) vs remaining (neutral). */
export function CategoryHoursChart({ data }: { data: { category: string; completedHours: number; hours: number; pct: number }[] }) {
  const { t } = useI18n();
  const rows = data.map((d) => ({ ...d, label: t(d.category), remaining: d.hours - d.completedHours })).sort((a, b) => b.hours - a.hours);
  return (
    <div style={{ height: Math.max(160, rows.length * 34 + 30) }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 40, bottom: 0, left: 4 }} barCategoryGap={8}>
          <CartesianGrid horizontal={false} stroke={CHART.grid} />
          <XAxis type="number" tickFormatter={(v) => t('{n} h', { n: v })} tick={{ fill: CHART.axis, fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="label" width={128} tick={{ fill: CHART.text, fontSize: 12 }} axisLine={false} tickLine={false} />
          <Tooltip
            cursor={{ fill: 'rgb(255 255 255 / 0.04)' }}
            content={({ active, payload }) => {
              const p = payload?.[0]?.payload as (typeof rows)[number] | undefined;
              if (!active || !p) return null;
              return <TooltipBox title={p.label} rows={[{ label: t('Completed'), value: t('{n} h', { n: p.completedHours }), color: CHART.have }, { label: t('Remaining'), value: t('{n} h', { n: p.remaining }), color: CHART.remaining }, { label: t('Progress'), value: `${p.pct}%` }]} />;
            }}
          />
          <Bar dataKey="completedHours" stackId="h" fill={CHART.have} stroke={CHART.surface} strokeWidth={2} isAnimationActive={false} />
          <Bar dataKey="remaining" stackId="h" fill={CHART.remaining} stroke={CHART.surface} strokeWidth={2} radius={[0, 4, 4, 0]} isAnimationActive={false}>
            <LabelList dataKey="pct" position="right" formatter={(v) => `${v}%`} style={{ fill: CHART.axis, fontSize: 11 }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
