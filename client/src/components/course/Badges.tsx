import { clsx } from 'clsx';
import { CircleCheck, CircleDashed, CircleDot, Lock, SkipForward } from 'lucide-react';
import { useI18n } from '../../i18n';
import { DIFFICULTY_META, STATUS_META } from '../../lib/format';
import type { CourseStatus, Difficulty } from '../../lib/types';

const STATUS_ICON = {
  completed: CircleCheck,
  current: CircleDot,
  recommended: CircleDashed,
  locked: Lock,
  skipped: SkipForward,
} as const;

export function StatusPill({ status, className }: { status: CourseStatus; className?: string }) {
  const { t } = useI18n();
  const meta = STATUS_META[status];
  const Icon = STATUS_ICON[status];
  return (
    <span className={clsx('inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-medium', meta.ring, meta.bg, meta.text, className)}>
      <Icon className="size-3" />
      {t(meta.label)}
    </span>
  );
}

export function StatusIcon({ status, className }: { status: CourseStatus; className?: string }) {
  const Icon = STATUS_ICON[status];
  return <Icon className={clsx(STATUS_META[status].text, className)} />;
}

export function DifficultyTag({ level, className }: { level: Difficulty; className?: string }) {
  const { t } = useI18n();
  const meta = DIFFICULTY_META[level];
  return (
    <span className={clsx('inline-flex items-center gap-1.5 text-[11px] font-medium', meta.text, className)}>
      <span className="flex gap-0.5">
        {[1, 2, 3, 4].map((i) => (
          <span key={i} className={clsx('h-2.5 w-1 rounded-full', i <= meta.dots ? 'bg-current' : 'bg-white/10')} />
        ))}
      </span>
      {t(level)}
    </span>
  );
}
