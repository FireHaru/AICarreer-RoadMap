import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../i18n';
import { ApiError, errorMessage } from '../../lib/api';
import { useDocumentTitle } from '../../lib/hooks';
import { AuthLayout, Field, FormError } from './AuthLayout';

export default function Register() {
  const { t } = useI18n();
  useDocumentTitle(t('Create account'));
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: '', email: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (form.fullName.trim().length < 2) errs.fullName = t('Enter your name');
    if (!/^\S+@\S+\.\S+$/.test(form.email)) errs.email = t('Enter a valid email address');
    if (form.password.length < 8) errs.password = t('Use at least 8 characters');
    setFieldErrors(errs);
    if (Object.keys(errs).length) return;
    setError(null);
    setBusy(true);
    try {
      await register(form.fullName.trim(), form.email.trim(), form.password);
      navigate('/onboarding', { replace: true });
    } catch (err) {
      if (err instanceof ApiError && Array.isArray(err.details)) {
        setFieldErrors(Object.fromEntries((err.details as { path: string; message: string }[]).map((d) => [d.path, d.message])));
      }
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout
      title={t('Create your account')}
      subtitle={t('Free for students. Your roadmap is ready in about three minutes.')}
      footer={<>{t('Already have an account?')} <Link to="/login" className="font-medium text-cyan-300 hover:underline">{t('Log in')}</Link></>}
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <FormError message={error} />
        <Field label={t('Full name')} error={fieldErrors.fullName}>
          <input className="input" autoComplete="name" value={form.fullName} onChange={set('fullName')} placeholder="Nguyễn Văn An" />
        </Field>
        <Field label={t('Email')} error={fieldErrors.email}>
          <input className="input" type="email" autoComplete="email" value={form.email} onChange={set('email')} placeholder="you@university.edu" />
        </Field>
        <Field label={t('Password')} error={fieldErrors.password}>
          <input className="input" type="password" autoComplete="new-password" value={form.password} onChange={set('password')} placeholder={t('At least 8 characters')} />
        </Field>
        <Button type="submit" className="w-full" loading={busy}>{t('Create account')}</Button>
      </form>
    </AuthLayout>
  );
}
