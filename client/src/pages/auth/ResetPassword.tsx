import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../i18n';
import { api, errorMessage } from '../../lib/api';
import { useDocumentTitle } from '../../lib/hooks';
import type { User } from '../../lib/types';
import { AuthLayout, Field, FormError } from './AuthLayout';

export default function ResetPassword() {
  const { t } = useI18n();
  useDocumentTitle(t('Choose a new password'));
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const { setSession } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (password.length < 8) return setError(t('Use at least 8 characters'));
    if (password !== confirm) return setError(t('The passwords do not match'));
    setError(null);
    setBusy(true);
    try {
      const s = await api.post<{ token: string; user: User }>('/auth/reset-password', { token, password });
      setSession(s.token, s.user);
      navigate(s.user.onboarded ? '/dashboard' : '/onboarding', { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout title={t('Choose a new password')} subtitle={t("You'll be signed in right after.")} footer={<Link to="/login" className="text-cyan-300 hover:underline">{t('Back to log in')}</Link>}>
      {!token ? (
        <FormError message={t('This reset link is missing its token. Request a new one from the forgot-password page.')} />
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <FormError message={error} />
          <Field label={t('New password')}>
            <input className="input" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </Field>
          <Field label={t('Confirm password')}>
            <input className="input" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </Field>
          <Button type="submit" className="w-full" loading={busy}>{t('Update password')}</Button>
        </form>
      )}
    </AuthLayout>
  );
}
