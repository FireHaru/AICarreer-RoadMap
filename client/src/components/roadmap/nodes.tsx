import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import { clsx } from 'clsx';
import { Clock, GraduationCap, Lock, Trophy } from 'lucide-react';
import { memo } from 'react';
import { useI18n } from '../../i18n';
import { DomainIcon } from '../../lib/icons';
import type { RoadmapItem } from '../../lib/types';
import { DifficultyTag, StatusPill } from '../course/Badges';
import type { Direction } from './layout';
import { NODE_H, NODE_W } from './layout';

export type CourseNodeData = {
  item: RoadmapItem;
  direction: Direction;
  dimmed: boolean;
  highlighted: boolean;
  compact?: boolean;
};
export type GoalNodeData = { name: string; icon: string; pct: number; direction: Direction; pathName: string };

const handleClass = '!size-2 !border-0 !bg-white/30';

export const CourseNode = memo(function CourseNode({ data }: NodeProps<Node<CourseNodeData, 'course'>>) {
  const { t } = useI18n();
  const { item, direction, dimmed, highlighted } = data;
  const { course, status } = item;
  const isProject = course.kind === 'project';
  const prereqs = course.prerequisites.map((p) => p.title);

  return (
    <div
      style={{ width: NODE_W, minHeight: NODE_H - 8 }}
      className={clsx(
        'group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border bg-navy-850/95 p-3.5 text-left backdrop-blur-xl transition duration-200',
        status === 'completed' && 'border-emerald-400/35',
        status === 'current' && 'border-cyan-400/80 shadow-[0_0_0_1px_rgb(34_211_238/0.3),0_10px_40px_-8px_rgb(34_211_238/0.45)]',
        status === 'recommended' && 'border-violet-400/40',
        status === 'locked' && 'border-white/[0.08]',
        status === 'skipped' && 'border-dashed border-amber-400/30',
        dimmed && 'opacity-25',
        highlighted && status !== 'current' && 'border-white/40',
        (status === 'locked' || status === 'skipped') && !highlighted && 'opacity-75',
        'hover:-translate-y-0.5 hover:border-white/30',
      )}
    >
      <Handle type="target" position={direction === 'LR' ? Position.Left : Position.Top} className={handleClass} isConnectable={false} />
      {isProject && <div className="absolute inset-x-0 top-0 h-0.5 bg-linear-to-r from-cyan-400 to-violet-500" />}
      {status === 'completed' && <div className="pointer-events-none absolute inset-0 bg-emerald-400/[0.04]" />}

      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[11px] font-medium text-slate-500">{course.code}</span>
        <StatusPill status={status} />
      </div>
      <h3 className={clsx('mt-1.5 line-clamp-2 text-[14px] font-semibold leading-snug text-white', status === 'skipped' && 'line-through decoration-white/40')}>
        {isProject && <GraduationCap className="mr-1 inline size-3.5 -translate-y-px text-violet-300" />}
        {course.title}
      </h3>
      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-400">{course.summary}</p>

      <div className="mt-auto pt-3">
        <div className="flex items-center gap-3 text-[11px] text-slate-400">
          <DifficultyTag level={course.difficulty} />
          <span className="inline-flex items-center gap-1"><Clock className="size-3" />{course.hours}h</span>
          <span>{t('{n} cr', { n: course.credits })}</span>
        </div>
        <div className="mt-2 flex items-center gap-1.5 truncate text-[11px] text-slate-500">
          {status === 'locked' && <Lock className="size-3 shrink-0 text-slate-500" />}
          {prereqs.length ? <span className="truncate">{t('Requires {list}', { list: prereqs.join(', ') })}</span> : <span>{t('No prerequisites')}</span>}
        </div>
      </div>
      <Handle type="source" position={direction === 'LR' ? Position.Right : Position.Bottom} className={handleClass} isConnectable={false} />
    </div>
  );
});

export const GoalNode = memo(function GoalNode({ data }: NodeProps<Node<GoalNodeData, 'goal'>>) {
  const { t } = useI18n();
  return (
    <div className="relative w-[220px] overflow-hidden rounded-2xl border border-violet-400/40 bg-linear-to-br from-cyan-400/15 via-navy-850 to-violet-500/25 p-4 text-center shadow-[0_10px_50px_-10px_rgb(139_92_246/0.5)]">
      <Handle type="target" position={data.direction === 'LR' ? Position.Left : Position.Top} className={handleClass} isConnectable={false} />
      <div className="mx-auto flex size-11 items-center justify-center rounded-xl bg-white/10 text-violet-200">
        <DomainIcon name={data.icon} className="size-5" />
      </div>
      <p className="mt-2 flex items-center justify-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-violet-200">
        <Trophy className="size-3" /> {t('Goal')}
      </p>
      <p className="mt-0.5 text-base font-semibold text-white">{data.name}</p>
      <p className="mt-1 text-xs text-slate-400">{data.pathName} · {t('{n}% complete', { n: data.pct })}</p>
    </div>
  );
});

export const nodeTypes = { course: CourseNode, goal: GoalNode };
