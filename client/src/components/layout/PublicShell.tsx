import { clsx } from 'clsx';
import { Menu, X } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { NavLink, Outlet } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { msg, useI18n } from '../../i18n';
import { ButtonLink } from '../ui/Button';
import { LanguageSwitch } from '../ui/LanguageSwitch';
import { Logo } from '../ui/Logo';

const LINKS = [
  { to: '/#how-it-works', label: msg('How it works') },
  { to: '/careers', label: msg('Careers') },
  { to: '/courses', label: msg('Courses') },
];

export function PublicNav() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.05] bg-navy-950/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Logo />
        <nav className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} className={({ isActive }) => clsx('rounded-lg px-3 py-2 text-sm transition', isActive && !l.to.includes('#') ? 'text-white' : 'text-slate-400 hover:text-white')}>
              {t(l.label)}
            </NavLink>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          <LanguageSwitch />
          {user ? (
            <ButtonLink to={user.onboarded ? '/dashboard' : '/onboarding'} size="sm">{t('Open dashboard')}</ButtonLink>
          ) : (
            <>
              <ButtonLink to="/login" variant="ghost" size="sm">{t('Log in')}</ButtonLink>
              <ButtonLink to="/register" size="sm">{t('Get started')}</ButtonLink>
            </>
          )}
        </div>
        <div className="flex items-center gap-1 md:hidden">
          <LanguageSwitch />
          <button className="rounded-lg p-2 text-slate-300" onClick={() => setOpen((o) => !o)} aria-label={t('Toggle menu')}>
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>
      {open && (
        <div className="border-t border-white/[0.05] px-4 pb-4 md:hidden">
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} onClick={() => setOpen(false)} className="block rounded-lg px-2 py-2.5 text-sm text-slate-300">
              {t(l.label)}
            </NavLink>
          ))}
          <div className="mt-2 flex gap-2">
            {user ? (
              <ButtonLink to="/dashboard" size="sm" className="flex-1">{t('Open dashboard')}</ButtonLink>
            ) : (
              <>
                <ButtonLink to="/login" variant="secondary" size="sm" className="flex-1">{t('Log in')}</ButtonLink>
                <ButtonLink to="/register" size="sm" className="flex-1">{t('Get started')}</ButtonLink>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export function Footer() {
  const { t } = useI18n();
  return (
    <footer className="border-t border-white/[0.05]">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-slate-500 sm:flex-row sm:px-6">
        <Logo />
        <p>{t('Personalised, explainable learning roadmaps for university students.')}</p>
      </div>
    </footer>
  );
}

export function PublicShell({ children }: { children?: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicNav />
      <main className="flex-1">{children ?? <Outlet />}</main>
      <Footer />
    </div>
  );
}
