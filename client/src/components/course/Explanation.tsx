import { clsx } from 'clsx';
import { CircleCheck, Clock, FlaskConical, GraduationCap, Lightbulb, LockOpen, SkipForward, Sparkles, Target, TriangleAlert } from 'lucide-react';
import { useI18n } from '../../i18n';
import type { Explanation } from '../../lib/types';

const BULLET_ICON: Record<string, { icon: typeof Target; className: string }> = {
  gap: { icon: Target, className: 'text-cyan-300' },
  met: { icon: CircleCheck, className: 'text-emerald-300' },
  unlocks: { icon: LockOpen, className: 'text-violet-300' },
  locked: { icon: TriangleAlert, className: 'text-amber-300' },
  skipped: { icon: SkipForward, className: 'text-amber-300' },
  background: { icon: GraduationCap, className: 'text-sky-300' },
  research: { icon: FlaskConical, className: 'text-fuchsia-300' },
  time: { icon: Clock, className: 'text-slate-400' },
  path: { icon: Sparkles, className: 'text-violet-300' },
  info: { icon: Lightbulb, className: 'text-slate-300' },
  ready: { icon: CircleCheck, className: 'text-emerald-300' },
};

export function WhyRecommended({ explanation, title, className }: { explanation: Explanation; title?: string; className?: string }) {
  const { t } = useI18n();
  return (
    <section className={clsx('relative overflow-hidden rounded-2xl border border-cyan-400/20 bg-linear-to-br from-cyan-400/[0.07] via-transparent to-violet-500/[0.08] p-5', className)}>
      <div className="mb-3 flex items-center gap-2">
        <span className="flex size-7 items-center justify-center rounded-lg bg-cyan-400/15 text-cyan-300">
          <Lightbulb className="size-4" />
        </span>
        <h2 className="text-sm font-semibold text-white">{title ?? t('Why is this course recommended?')}</h2>
      </div>
      <p className="text-[15px] leading-relaxed text-slate-200">{explanation.headline}</p>
      {explanation.bullets.length > 0 && (
        <ul className="mt-4 space-y-2">
          {explanation.bullets.map((b, i) => {
            const meta = BULLET_ICON[b.kind] ?? BULLET_ICON.info;
            const Icon = meta.icon;
            return (
              <li key={i} className="flex items-start gap-2.5 text-sm text-slate-300">
                <Icon className={clsx('mt-0.5 size-4 shrink-0', meta.className)} />
                <span>{b.text}</span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
