import { clsx } from 'clsx';
import { useI18n } from '../../i18n';
import { LEVELS, levelLabel } from '../../lib/format';

const LABEL_TONE: Record<string, string> = {
  None: 'text-slate-500',
  Beginner: 'text-sky-300',
  Basic: 'text-cyan-300',
  Intermediate: 'text-violet-300',
  Advanced: 'text-fuchsia-300',
};

/** A 0–100 skill slider with the four named levels as quick-pick stops. */
export function LevelSlider({ name, description, value, onChange, compact }: {
  name: string;
  description?: string;
  value: number;
  onChange: (v: number) => void;
  compact?: boolean;
}) {
  const { t } = useI18n();
  const label = levelLabel(value);
  return (
    <div className={clsx('rounded-xl border border-white/[0.06] bg-white/[0.02] transition hover:border-white/10', compact ? 'p-3' : 'p-4')}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-100">{name}</p>
          {description && !compact && <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">{description}</p>}
        </div>
        <div className="text-right">
          <span className={clsx('text-xs font-semibold', LABEL_TONE[label])}>{t(label)}</span>
          <span className="ml-1.5 font-mono text-xs text-slate-500">{value}%</span>
        </div>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        step={5}
        value={value}
        aria-label={t('{name} level', { name })}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-3 h-1.5 w-full cursor-pointer appearance-none rounded-full accent-cyan-400"
        style={{ background: `linear-gradient(90deg, #22d3ee ${0}%, #8b5cf6 ${value}%, rgb(255 255 255 / 0.08) ${value}%)` }}
      />
      <div className="mt-2 flex justify-between gap-1">
        {LEVELS.map((l) => (
          <button
            key={l.label}
            type="button"
            onClick={() => onChange(l.value)}
            className={clsx(
              'rounded-md px-1.5 py-0.5 text-[10px] font-medium transition sm:px-2 sm:text-[11px]',
              label === l.label ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300',
            )}
          >
            {t(l.label)}
          </button>
        ))}
      </div>
    </div>
  );
}
