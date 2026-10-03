import { MailCheck } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { Button, ButtonLink } from '../../components/ui/Button';
import { useI18n } from '../../i18n';
import { api, errorMessage } from '../../lib/api';
import { useDocumentTitle } from '../../lib/hooks';
import { AuthLayout, Field, FormError } from './AuthLayout';

export default function ForgotPassword() {
  const { t } = useI18n();
  useDocumentTitle(t('Reset password'));
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<{ message: string; devResetToken?: string } | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      setSent(await api.post('/auth/forgot-password', { email }));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout
      title={t('Forgot your password?')}
      subtitle={t("Enter your account email and we'll send you a reset link.")}
      footer={<Link to="/login" className="text-cyan-300 hover:underline">{t('Back to log in')}</Link>}
    >
      {sent ? (
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-sm text-emerald-100">
            <MailCheck className="mt-0.5 size-5 shrink-0" />
            {sent.message}
          </div>
          {sent.devResetToken && (
            <div className="rounded-xl border border-amber-400/30 bg-amber-400/[0.07] p-4 text-sm text-amber-100">
              <p className="font-medium">{t('Development mode')}</p>
              <p className="mt-1 text-amber-100/80">{t('No email service is configured, so here is the reset link directly:')}</p>
              <ButtonLink to={`/reset-password?token=${sent.devResetToken}`} variant="secondary" size="sm" className="mt-3">
                {t('Open reset link')}
              </ButtonLink>
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <FormError message={error} />
          <Field label={t('Email')}>
            <input className="input" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@university.edu" />
          </Field>
          <Button type="submit" className="w-full" loading={busy}>{t('Send reset link')}</Button>
        </form>
      )}
    </AuthLayout>
  );
}
