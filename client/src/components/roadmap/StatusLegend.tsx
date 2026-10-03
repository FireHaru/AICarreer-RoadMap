import { clsx } from 'clsx';
import { useI18n } from '../../i18n';
import { STATUS_META } from '../../lib/format';
import type { CourseStatus } from '../../lib/types';

const ORDER: CourseStatus[] = ['completed', 'current', 'recommended', 'locked', 'skipped'];

export function StatusLegend({ counts, className }: { counts?: Partial<Record<CourseStatus, number>>; className?: string }) {
  const { t } = useI18n();
  return (
    <div className={clsx('flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-400', className)}>
      {ORDER.map((s) => (
        <span key={s} className="inline-flex items-center gap-1.5">
          <span className={clsx('size-2 rounded-full', STATUS_META[s].dot)} />
          {t(STATUS_META[s].label)}
          {counts && <span className="text-slate-600">{counts[s] ?? 0}</span>}
        </span>
      ))}
    </div>
  );
}
