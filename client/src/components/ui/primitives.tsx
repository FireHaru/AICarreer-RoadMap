import { clsx } from 'clsx';
import { Loader2 } from 'lucide-react';
import type { HTMLAttributes, ReactNode } from 'react';
import { useI18n } from '../../i18n';

export function Card({ className, interactive, ...rest }: HTMLAttributes<HTMLDivElement> & { interactive?: boolean }) {
  return <div className={clsx(interactive ? 'card-interactive' : 'card', className)} {...rest} />;
}

export function Badge({ className, children, tone = 'default' }: { className?: string; children: ReactNode; tone?: 'default' | 'cyan' | 'violet' | 'emerald' | 'amber' | 'rose' }) {
  const tones = {
    default: 'border-white/10 bg-white/[0.05] text-slate-300',
    cyan: 'border-cyan-400/30 bg-cyan-400/10 text-cyan-200',
    violet: 'border-violet-400/30 bg-violet-400/10 text-violet-200',
    emerald: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200',
    amber: 'border-amber-400/30 bg-amber-400/10 text-amber-200',
    rose: 'border-rose-400/30 bg-rose-400/10 text-rose-200',
  };
  return <span className={clsx('inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-medium', tones[tone], className)}>{children}</span>;
}

export function Spinner({ className, label }: { className?: string; label?: string }) {
  return (
    <div className={clsx('flex items-center justify-center gap-2 text-sm text-slate-400', className)} role="status">
      <Loader2 className="size-5 animate-spin text-cyan-400" />
      {label && <span>{label}</span>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx('animate-pulse rounded-xl bg-white/[0.05]', className)} />;
}

export function PageLoader({ label }: { label?: string }) {
  const { t } = useI18n();
  return <Spinner className="py-24" label={label ?? t('Loading…')} />;
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const { t } = useI18n();
  return (
    <Card className="mx-auto my-12 max-w-md p-6 text-center">
      <p className="text-sm font-medium text-rose-200">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="mt-3 text-sm text-cyan-300 hover:underline">
          {t('Try again')}
        </button>
      )}
    </Card>
  );
}

export function EmptyState({ icon, title, description, action }: { icon?: ReactNode; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 px-6 py-12 text-center">
      {icon && <div className="mb-3 text-slate-500">{icon}</div>}
      <p className="font-medium text-slate-200">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-slate-400">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: ReactNode; title: ReactNode; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        {eyebrow && <div className="eyebrow mb-2">{eyebrow}</div>}
        <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-[28px]">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-slate-400">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Segmented<T extends string>({ value, onChange, options, className, size = 'md' }: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: ReactNode; icon?: ReactNode }[];
  className?: string;
  size?: 'sm' | 'md';
}) {
  return (
    <div className={clsx('inline-flex rounded-xl border border-white/10 bg-navy-900/60 p-1', className)} role="tablist">
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={clsx(
            'inline-flex items-center gap-1.5 rounded-lg font-medium transition',
            size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm',
            value === o.value ? 'bg-white/10 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200',
          )}
        >
          {o.icon}
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function ProgressBar({ value, className, tone = 'gradient', marker, size = 'md' }: { value: number; className?: string; tone?: 'gradient' | 'emerald' | 'cyan' | 'violet' | 'rose' | 'amber' | 'slate'; marker?: number; size?: 'sm' | 'md' }) {
  const { t } = useI18n();
  const tones = {
    gradient: 'bg-linear-to-r from-cyan-400 to-violet-500',
    emerald: 'bg-emerald-400',
    cyan: 'bg-cyan-400',
    violet: 'bg-violet-400',
    rose: 'bg-rose-400',
    amber: 'bg-amber-400',
    slate: 'bg-slate-500',
  };
  return (
    <div className={clsx('relative w-full overflow-visible rounded-full bg-white/[0.07]', size === 'sm' ? 'h-1.5' : 'h-2', className)}>
      <div className={clsx('h-full rounded-full transition-[width] duration-700', tones[tone])} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
      {marker !== undefined && (
        <div className="absolute -top-1 -bottom-1 w-0.5 rounded-full bg-white/80" style={{ left: `calc(${Math.min(100, marker)}% - 1px)` }} title={t('Required {n}%', { n: marker })} />
      )}
    </div>
  );
}

export function ProgressRing({ value, size = 120, stroke = 10, children }: { value: number; size?: number; stroke?: number; children?: ReactNode }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const id = `ring-${size}-${stroke}`;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgb(255 255 255 / 0.07)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#${id})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - Math.max(0, Math.min(100, value)) / 100)}
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}

export function StatTile({ icon, label, value, hint, accent = 'cyan', className }: { icon: ReactNode; label: string; value: ReactNode; hint?: ReactNode; accent?: 'cyan' | 'violet' | 'emerald' | 'rose' | 'amber'; className?: string }) {
  const accents = {
    cyan: 'text-cyan-300 bg-cyan-400/10',
    violet: 'text-violet-300 bg-violet-400/10',
    emerald: 'text-emerald-300 bg-emerald-400/10',
    rose: 'text-rose-300 bg-rose-400/10',
    amber: 'text-amber-300 bg-amber-400/10',
  };
  return (
    <Card className={clsx('flex flex-col gap-3 p-4', className)}>
      <div className="flex items-center gap-2.5">
        <span className={clsx('flex size-8 items-center justify-center rounded-lg', accents[accent])}>{icon}</span>
        <span className="text-xs font-medium text-slate-400">{label}</span>
      </div>
      <div className="min-w-0">
        <div className="truncate text-lg font-semibold text-white">{value}</div>
        {hint && <div className="mt-0.5 truncate text-xs text-slate-500">{hint}</div>}
      </div>
    </Card>
  );
}
