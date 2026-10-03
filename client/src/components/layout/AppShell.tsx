import { clsx } from 'clsx';
import {
  Compass, FolderKanban, Gauge, LayoutDashboard, Library, LogOut, Menu, Route, Settings, Sparkles, X,
} from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { msg, useI18n } from '../../i18n';
import { initials } from '../../lib/format';
import { useMeta } from '../../lib/hooks';
import { DomainIcon } from '../../lib/icons';
import { LanguageSwitch } from '../ui/LanguageSwitch';
import { Logo } from '../ui/Logo';

export const NAV = [
  { to: '/dashboard', label: msg('Dashboard'), short: msg('Home'), icon: LayoutDashboard },
  { to: '/skill-gap', label: msg('Skill Gap'), short: msg('Skill Gap'), icon: Gauge },
  { to: '/roadmap', label: msg('Roadmap'), short: msg('Roadmap'), icon: Route },
  { to: '/courses', label: msg('Course Library'), short: msg('Courses'), icon: Library },
  { to: '/careers', label: msg('Career Explorer'), short: msg('Careers'), icon: Compass },
  { to: '/projects', label: msg('Projects'), short: msg('Projects'), icon: FolderKanban },
  { to: '/assistant', label: msg('PathGPT'), short: msg('PathGPT'), icon: Sparkles },
  { to: '/settings', label: msg('Settings'), short: msg('Settings'), icon: Settings },
];

const MOBILE_TABS = ['/dashboard', '/skill-gap', '/roadmap', '/assistant'];

function NavItems({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useI18n();
  return (
    <nav className="flex flex-col gap-0.5">
      {NAV.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          onClick={onNavigate}
          className={({ isActive }) =>
            clsx(
              'group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition',
              isActive ? 'bg-white/[0.07] text-white' : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200',
            )
          }
        >
          {({ isActive }) => (
            <>
              <Icon className={clsx('size-[18px]', isActive ? 'text-cyan-300' : 'text-slate-500 group-hover:text-slate-300')} />
              {t(label)}
              {to === '/assistant' && <span className="ml-auto rounded-md bg-violet-400/15 px-1.5 py-0.5 text-[10px] font-semibold text-violet-200">AI</span>}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

function GoalCard() {
  const { user } = useAuth();
  const { t } = useI18n();
  const meta = useMeta();
  const career = meta?.careers.find((c) => c.id === user?.careerId);
  const research = meta?.research.find((r) => r.id === user?.researchId);
  if (!career) return null;
  return (
    <NavLink to="/roadmap" className="block rounded-xl border border-white/[0.07] bg-linear-to-br from-cyan-400/[0.07] to-violet-500/[0.07] p-3 transition hover:border-white/15">
      <p className="eyebrow mb-2">{t('Current goal')}</p>
      <div className="flex items-center gap-2.5">
        <span className="flex size-8 items-center justify-center rounded-lg bg-white/[0.06] text-cyan-300">
          <DomainIcon name={career.icon} className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-white">{career.name}</p>
          {research && <p className="truncate text-xs text-slate-400">{t('Research · {name}', { name: research.name })}</p>}
        </div>
      </div>
    </NavLink>
  );
}

function UserBlock() {
  const { user, logout } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  if (!user) return null;
  return (
    <div className="flex items-center gap-3 rounded-xl p-2">
      <span className="flex size-9 items-center justify-center rounded-full bg-linear-to-br from-cyan-400/30 to-violet-500/30 text-xs font-semibold text-white">
        {initials(user.fullName)}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-100">{user.fullName}</p>
        <p className="truncate text-xs text-slate-500">{user.email}</p>
      </div>
      <button
        onClick={() => {
          logout();
          navigate('/');
        }}
        className="rounded-lg p-2 text-slate-500 transition hover:bg-white/5 hover:text-rose-300"
        title={t('Log out')}
        aria-label={t('Log out')}
      >
        <LogOut className="size-4" />
      </button>
    </div>
  );
}

export function AppShell({ children }: { children?: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const { t } = useI18n();
  useEffect(() => setMenuOpen(false), [location.pathname]);

  return (
    <div className="min-h-screen lg:pl-64">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col gap-6 border-r border-white/[0.06] bg-navy-900/60 px-4 py-5 backdrop-blur-xl lg:flex">
        <div className="flex items-center justify-between gap-2 px-2">
          <Logo to="/dashboard" />
          <LanguageSwitch />
        </div>
        <NavItems />
        <div className="mt-auto flex flex-col gap-3">
          <GoalCard />
          <UserBlock />
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-2 border-b border-white/[0.06] bg-navy-950/80 px-4 backdrop-blur-xl lg:hidden">
        <Logo to="/dashboard" />
        <div className="flex items-center gap-1">
          <LanguageSwitch />
          <button onClick={() => setMenuOpen(true)} className="rounded-lg p-2 text-slate-300 hover:bg-white/5" aria-label={t('Open menu')}>
            <Menu className="size-5" />
          </button>
        </div>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-navy-950/70 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />
          <div className="absolute inset-y-0 right-0 flex w-72 max-w-[85vw] flex-col gap-6 border-l border-white/10 bg-navy-900 px-4 py-5 animate-fade-up">
            <div className="flex items-center justify-between">
              <Logo to="/dashboard" />
              <button onClick={() => setMenuOpen(false)} className="rounded-lg p-2 text-slate-400 hover:bg-white/5" aria-label={t('Close menu')}>
                <X className="size-5" />
              </button>
            </div>
            <NavItems onNavigate={() => setMenuOpen(false)} />
            <div className="mt-auto flex flex-col gap-3">
              <LanguageSwitch full className="self-start" />
              <GoalCard />
              <UserBlock />
            </div>
          </div>
        </div>
      )}

      <main className="mx-auto w-full max-w-[1400px] px-4 pb-28 pt-6 sm:px-6 lg:px-10 lg:pb-12 lg:pt-8">{children ?? <Outlet />}</main>

      {/* Mobile bottom tabs */}
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-white/[0.06] bg-navy-950/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
        {NAV.filter((n) => MOBILE_TABS.includes(n.to)).map(({ to, short, icon: Icon }) => (
          <NavLink key={to} to={to} className={({ isActive }) => clsx('flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium', isActive ? 'text-cyan-300' : 'text-slate-500')}>
            <Icon className="size-5" />
            {t(short)}
          </NavLink>
        ))}
        <button onClick={() => setMenuOpen(true)} className="flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium text-slate-500">
          <Menu className="size-5" />
          {t('More')}
        </button>
      </nav>
    </div>
  );
}
