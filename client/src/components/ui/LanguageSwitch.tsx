import { clsx } from 'clsx';
import { Languages } from 'lucide-react';
import { useI18n, type Lang } from '../../i18n';

const OPTIONS: { value: Lang; short: string; long: string }[] = [
  { value: 'en', short: 'EN', long: 'English' },
  { value: 'vi', short: 'VI', long: 'Tiếng Việt' },
];

/** EN | VI toggle. `full` shows the language names (used in Settings). */
export function LanguageSwitch({ className, full }: { className?: string; full?: boolean }) {
  const { lang, setLang, t } = useI18n();
  return (
    <div role="radiogroup" aria-label={t('Language')} className={clsx('inline-flex items-center gap-0.5 rounded-xl border border-white/10 bg-navy-900/60 p-0.5', className)}>
      {!full && <Languages className="ml-1.5 mr-0.5 size-3.5 text-slate-500" aria-hidden />}
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={lang === o.value}
          title={o.long}
          onClick={() => setLang(o.value)}
          className={clsx(
            'rounded-lg font-semibold transition',
            full ? 'px-3 py-1.5 text-sm' : 'px-2 py-1 text-[11px]',
            lang === o.value ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-200',
          )}
        >
          {full ? o.long : o.short}
        </button>
      ))}
    </div>
  );
}
