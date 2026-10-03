import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { setApiLang } from '../lib/api';
import VI from './vi.json';

export type Lang = 'en' | 'vi';
export type Vars = Record<string, string | number>;
export type TFunction = (text: string, vars?: Vars) => string;

const STORAGE_KEY = 'pathforge.lang';
const DICTIONARIES: Record<Lang, Record<string, string>> = { en: {}, vi: VI as Record<string, string> };

function initialLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'en' || saved === 'vi') return saved;
  } catch {
    /* storage unavailable */
  }
  return typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('vi') ? 'vi' : 'en';
}

const startLang = initialLang();
setApiLang(startLang);

function interpolate(text: string, vars?: Vars) {
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined ? String(vars[k]) : m));
}

/** Marks a string for translation without translating it yet (for constants outside components). */
export const msg = (text: string) => text;

interface I18nState {
  lang: Lang;
  setLang(lang: Lang): void;
  /** English text is the key; Vietnamese comes from vi.json. Supports {placeholders}. */
  t: TFunction;
  /** Plural helper: English picks `one` or `other`; Vietnamese has a single form (the translation of `other`). */
  tn(one: string, other: string, n: number, vars?: Vars): string;
  locale: string;
}

const I18nContext = createContext<I18nState | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(startLang);

  const setLang = useCallback((l: Lang) => {
    setApiLang(l);
    setLangState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const value = useMemo<I18nState>(() => {
    const dict = DICTIONARIES[lang];
    const t: TFunction = (text, vars) => interpolate(dict[text] ?? text, vars);
    return {
      lang,
      setLang,
      t,
      tn: (one, other, n, vars) => t(lang === 'en' && n === 1 ? one : other, { n, ...vars }),
      locale: lang === 'vi' ? 'vi-VN' : 'en-GB',
    };
  }, [lang, setLang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside <I18nProvider>');
  return ctx;
}
