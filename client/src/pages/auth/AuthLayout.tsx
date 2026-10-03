import { CircleCheck } from 'lucide-react';
import type { ReactNode } from 'react';
import { LanguageSwitch } from '../../components/ui/LanguageSwitch';
import { Logo } from '../../components/ui/Logo';
import { msg, useI18n } from '../../i18n';

const POINTS = [
  msg('Skill gap analysis against real career requirements'),
  msg('A prerequisite-aware roadmap with a reason for every course'),
  msg('PathGPT to explain, prioritise and adjust your plan'),
];
const CHAIN = [msg('Python'), msg('Linear Algebra'), msg('ML'), msg('Deep Learning'), msg('AI Engineer')];

export function AuthLayout({ title, subtitle, children, footer }: { title: string; subtitle?: ReactNode; children: ReactNode; footer?: ReactNode }) {
  const { t } = useI18n();
  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1.1fr]">
      <aside className="relative hidden overflow-hidden border-r border-white/[0.06] bg-navy-900/50 p-10 lg:flex lg:flex-col">
        <div className="absolute -left-32 top-1/3 size-96 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute -right-24 bottom-10 size-80 rounded-full bg-violet-500/15 blur-3xl" />
        <Logo />
        <div className="relative mt-auto max-w-md">
          <h2 className="text-3xl font-semibold leading-tight tracking-tight text-white">
            {t('Know what to learn next —')} <span className="text-gradient">{t('and why.')}</span>
          </h2>
          <ul className="mt-8 space-y-4">
            {POINTS.map((p) => (
              <li key={p} className="flex items-start gap-3 text-sm text-slate-300">
                <CircleCheck className="mt-0.5 size-4 shrink-0 text-cyan-300" />
                {t(p)}
              </li>
            ))}
          </ul>
          <div className="mt-10 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            {CHAIN.map((s, i, a) => (
              <span key={s} className="flex items-center gap-2">
                <span className={i < 2 ? 'rounded-md border border-emerald-400/30 bg-emerald-400/10 px-2 py-1 text-emerald-200' : i === 2 ? 'rounded-md border border-cyan-400/50 bg-cyan-400/10 px-2 py-1 text-cyan-100' : 'rounded-md border border-white/10 px-2 py-1'}>{t(s)}</span>
                {i < a.length - 1 && <span className="text-slate-600">→</span>}
              </span>
            ))}
          </div>
        </div>
      </aside>
      <main className="flex flex-col px-4 py-8 sm:px-8">
        <div className="flex items-center justify-between lg:justify-end">
          <Logo className="lg:hidden" />
          <LanguageSwitch />
        </div>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
          <h1 className="text-2xl font-semibold tracking-tight text-white">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-slate-400">{subtitle}</p>}
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-8 text-center text-sm text-slate-400">{footer}</div>}
        </div>
      </main>
    </div>
  );
}

export function Field({ label, error, children, hint }: { label: string; error?: string | null; children: ReactNode; hint?: ReactNode }) {
  return (
    <label className="block">
      <span className="label flex items-center justify-between">
        {label}
        {hint}
      </span>
      {children}
      {error && <span className="mt-1.5 block text-xs text-rose-300">{error}</span>}
    </label>
  );
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return <div className="rounded-xl border border-rose-400/30 bg-rose-400/10 px-3 py-2.5 text-sm text-rose-200" role="alert">{message}</div>;
}
