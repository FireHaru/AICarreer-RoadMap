import { Eye, EyeOff, Sparkles } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../i18n';
import { errorMessage } from '../../lib/api';
import { useDocumentTitle } from '../../lib/hooks';
import type { User } from '../../lib/types';
import { AuthLayout, Field, FormError } from './AuthLayout';

/** Seeded local demo account (see server/src/db/seed.ts). */
const DEMO = { email: 'demo@pathforge.dev', password: 'pathforge123' };

export default function Login() {
  const { t } = useI18n();
  useDocumentTitle(t('Log in'));
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<'form' | 'demo' | null>(null);

  const go = (u: User) => {
    const from = (location.state as { from?: string } | null)?.from;
    navigate(u.onboarded ? from ?? '/dashboard' : '/onboarding', { replace: true });
  };

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy('form');
    try {
      go(await login(email, password));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  async function demo() {
    setError(null);
    setBusy('demo');
    try {
      go(await login(DEMO.email, DEMO.password));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  return (
    <AuthLayout
      title={t('Welcome back')}
      subtitle={t('Log in to continue your roadmap.')}
      footer={<>{t('New to PathForge?')} <Link to="/register" className="font-medium text-cyan-300 hover:underline">{t('Create an account')}</Link></>}
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <FormError message={error} />
        <Field label={t('Email')}>
          <input className="input" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@university.edu" required />
        </Field>
        <Field label={t('Password')} hint={<Link to="/forgot-password" className="text-xs font-normal text-cyan-300 hover:underline">{t('Forgot password?')}</Link>}>
          <div className="relative">
            <input className="input pr-10" type={show ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <button type="button" onClick={() => setShow((s) => !s)} className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-slate-500 hover:text-slate-300" aria-label={show ? t('Hide password') : t('Show password')}>
              {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </Field>
        <Button type="submit" className="w-full" loading={busy === 'form'}>{t('Log in')}</Button>
      </form>
      <div className="my-6 flex items-center gap-3 text-xs text-slate-600">
        <span className="h-px flex-1 bg-white/[0.07]" /> {t('or')} <span className="h-px flex-1 bg-white/[0.07]" />
      </div>
      <Button variant="secondary" className="w-full" icon={<Sparkles className="size-4 text-violet-300" />} loading={busy === 'demo'} onClick={demo}>
        {t('Explore with the demo account')}
      </Button>
      <p className="mt-2 text-center text-xs text-slate-500">{t('A Physics student working towards AI Engineer.')}</p>
    </AuthLayout>
  );
}
