import { Lightbulb, Trophy } from 'lucide-react';
import { msg, useI18n } from '../../i18n';

type S = 'done' | 'current' | 'next' | 'locked';
const NODES: { id: string; label: string; x: number; y: number; s: S }[] = [
  { id: 'py', label: msg('Python Fundamentals'), x: 120, y: 46, s: 'done' },
  { id: 'calc', label: msg('Calculus'), x: 360, y: 46, s: 'done' },
  { id: 'dsa', label: msg('Data Structures'), x: 90, y: 146, s: 'done' },
  { id: 'la', label: msg('Linear Algebra'), x: 270, y: 146, s: 'done' },
  { id: 'prob', label: msg('Probability & Stats'), x: 450, y: 146, s: 'current' },
  { id: 'ml', label: msg('Machine Learning'), x: 270, y: 250, s: 'next' },
  { id: 'dl', label: msg('Deep Learning'), x: 160, y: 350, s: 'locked' },
  { id: 'ops', label: msg('MLOps'), x: 400, y: 350, s: 'locked' },
  { id: 'cv', label: msg('Computer Vision'), x: 160, y: 448, s: 'locked' },
];
const EDGES: [string, string][] = [
  ['py', 'dsa'], ['calc', 'la'], ['calc', 'prob'], ['dsa', 'ml'], ['la', 'ml'], ['prob', 'ml'],
  ['ml', 'dl'], ['ml', 'ops'], ['dl', 'cv'],
];
const GOAL = { x: 330, y: 540 };
const W = 172;
const H = 42;

const FILL: Record<S, { stroke: string; fill: string; text: string }> = {
  done: { stroke: 'rgb(52 211 153 / 0.55)', fill: 'rgb(52 211 153 / 0.08)', text: '#a7f3d0' },
  current: { stroke: '#22d3ee', fill: 'rgb(34 211 238 / 0.14)', text: '#ecfeff' },
  next: { stroke: 'rgb(167 139 250 / 0.6)', fill: 'rgb(167 139 250 / 0.08)', text: '#ddd6fe' },
  locked: { stroke: 'rgb(255 255 255 / 0.12)', fill: 'rgb(255 255 255 / 0.03)', text: '#94a3b8' },
};

const byId = Object.fromEntries(NODES.map((n) => [n.id, n]));

function curve(x1: number, y1: number, x2: number, y2: number) {
  const my = (y1 + y2) / 2;
  return `M ${x1} ${y1} C ${x1} ${my}, ${x2} ${my}, ${x2} ${y2}`;
}

/** Decorative, self-animating roadmap for the landing hero. */
export function HeroRoadmap() {
  const { t } = useI18n();
  return (
    <div className="relative mx-auto w-full max-w-[560px]">
      <div className="absolute -inset-6 rounded-[2rem] bg-linear-to-br from-cyan-400/10 via-transparent to-violet-500/15 blur-2xl" />
      <div className="relative rounded-[1.75rem] border border-white/[0.08] bg-navy-900/60 p-3 backdrop-blur-xl sm:p-5">
        <div className="mb-2 flex items-center justify-between px-1">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="size-2 rounded-full bg-cyan-400 animate-pulse-ring" />
            {t('Physics student → AI Engineer')}
          </div>
          <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-slate-300">{t('{n}% complete', { n: 42 })}</span>
        </div>
        <svg viewBox="0 0 560 590" className="w-full" role="img" aria-label={t('Example roadmap from Python fundamentals to AI Engineer')}>
          <defs>
            <linearGradient id="hero-goal" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#22d3ee" stopOpacity="0.35" />
              <stop offset="1" stopColor="#8b5cf6" stopOpacity="0.45" />
            </linearGradient>
            <marker id="hero-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="rgb(148 163 184 / 0.6)" />
            </marker>
          </defs>

          {EDGES.map(([a, b]) => {
            const s = byId[a];
            const t = byId[b];
            const active = s.s === 'done' && (t.s === 'current' || t.s === 'next');
            const done = s.s === 'done' && t.s === 'done';
            return (
              <path
                key={`${a}-${b}`}
                d={curve(s.x, s.y + H / 2, t.x, t.y - H / 2 - 4)}
                fill="none"
                stroke={done ? 'rgb(52 211 153 / 0.6)' : active ? '#22d3ee' : s.s === 'current' ? '#a78bfa' : 'rgb(148 163 184 / 0.25)'}
                strokeWidth={active ? 2 : 1.5}
                className={active || s.s === 'current' ? 'flow-line' : undefined}
                strokeDasharray={!done && !active && s.s !== 'current' ? '4 5' : undefined}
                markerEnd="url(#hero-arrow)"
              />
            );
          })}
          {['cv', 'ops'].map((id) => {
            const s = byId[id];
            return <path key={id} d={curve(s.x, s.y + H / 2, GOAL.x, GOAL.y - 26)} fill="none" stroke="rgb(148 163 184 / 0.25)" strokeWidth={1.5} strokeDasharray="4 5" markerEnd="url(#hero-arrow)" />;
          })}

          {NODES.map((n) => {
            const f = FILL[n.s];
            return (
              <g key={n.id}>
                {n.s === 'current' && (
                  <rect x={n.x - W / 2 - 5} y={n.y - H / 2 - 5} width={W + 10} height={H + 10} rx={16} fill="none" stroke="#22d3ee" strokeOpacity="0.35">
                    <animate attributeName="stroke-opacity" values="0.5;0.05;0.5" dur="2.4s" repeatCount="indefinite" />
                  </rect>
                )}
                <rect x={n.x - W / 2} y={n.y - H / 2} width={W} height={H} rx={12} fill={f.fill} stroke={f.stroke} strokeWidth={n.s === 'current' ? 1.6 : 1} />
                <circle cx={n.x - W / 2 + 16} cy={n.y} r={4} fill={n.s === 'done' ? '#34d399' : n.s === 'current' ? '#22d3ee' : n.s === 'next' ? '#a78bfa' : '#475569'} />
                <text x={n.x - W / 2 + 28} y={n.y + 4.5} fill={f.text} fontSize="12.5" fontWeight={500} fontFamily="Inter, sans-serif">
                  {t(n.label)}
                </text>
              </g>
            );
          })}

          <g>
            <rect x={GOAL.x - 100} y={GOAL.y - 26} width={200} height={50} rx={16} fill="url(#hero-goal)" stroke="rgb(167 139 250 / 0.6)" />
            <text x={GOAL.x} y={GOAL.y + 5} textAnchor="middle" fill="#fff" fontSize="14" fontWeight={600} fontFamily="Inter, sans-serif">
              {t('AI Engineer')}
            </text>
          </g>
        </svg>
      </div>

      <div className="absolute -right-2 top-[36%] hidden w-60 animate-float rounded-2xl border border-cyan-400/25 bg-navy-850/95 p-3.5 shadow-2xl shadow-black/40 backdrop-blur-xl sm:block lg:-right-10">
        <p className="flex items-center gap-1.5 text-[11px] font-semibold text-cyan-300">
          <Lightbulb className="size-3.5" /> {t('Why Machine Learning?')}
        </p>
        <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
          {t('Core skill for AI Engineer — you are at 10%, the target is 75%. Your maths is ready, so it is your next big step.')}
        </p>
      </div>
      <div className="absolute -left-2 bottom-24 hidden items-center gap-2 rounded-xl border border-violet-400/25 bg-navy-850/95 px-3 py-2 text-xs text-slate-300 shadow-xl backdrop-blur-xl sm:flex lg:-left-8" style={{ animation: 'float 7s ease-in-out infinite 1s' }}>
        <Trophy className="size-4 text-violet-300" /> {t('3 critical gaps left')}
      </div>
    </div>
  );
}
