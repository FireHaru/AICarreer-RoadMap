import { Compass } from 'lucide-react';
import { ButtonLink } from '../components/ui/Button';
import { Logo } from '../components/ui/Logo';
import { useI18n } from '../i18n';
import { useDocumentTitle } from '../lib/hooks';

export default function NotFound() {
  const { t } = useI18n();
  useDocumentTitle(t('Page not found'));
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
      <Logo />
      <Compass className="size-12 text-slate-600" />
      <div>
        <h1 className="text-2xl font-semibold text-white">{t("This path doesn't exist")}</h1>
        <p className="mt-2 text-sm text-slate-400">{t("The page you're looking for isn't on the map.")}</p>
      </div>
      <ButtonLink to="/">{t('Back to home')}</ButtonLink>
    </div>
  );
}
