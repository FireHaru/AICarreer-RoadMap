import { useCallback, useEffect, useRef, useState } from 'react';
import { useI18n, type Lang } from '../i18n';
import { api, errorMessage } from './api';
import type { Meta } from './types';

/** Fetches `path` (when not null) and exposes reload/setData. Refetches when the UI language changes. */
export function useApi<T>(path: string | null) {
  const { lang } = useI18n();
  const [data, setData] = useState<T | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(Boolean(path));
  const latest = useRef(0);

  const reload = useCallback(async () => {
    if (!path) return;
    const id = ++latest.current;
    setLoading(true);
    try {
      const result = await api.get<T>(path);
      if (id === latest.current) {
        setData(result);
        setError(null);
      }
    } catch (err) {
      if (id === latest.current) setError(errorMessage(err));
    } finally {
      if (id === latest.current) setLoading(false);
    }
    // `lang` is a dependency so a language switch refetches localized data.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, lang]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, error, loading, reload, setData };
}

const metaPromises: Partial<Record<Lang, Promise<Meta>>> = {};

/** Reference data (skills, careers, research, majors) is static, so it is fetched once per language. */
export function useMeta() {
  const { lang } = useI18n();
  const [meta, setMeta] = useState<Meta | null>(null);
  useEffect(() => {
    const promise = (metaPromises[lang] ??= api.get<Meta>('/catalog/meta').catch((err) => {
      delete metaPromises[lang];
      throw err;
    }));
    let alive = true;
    promise.then((m) => alive && setMeta(m)).catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [lang]);
  return meta;
}

export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches);
  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);
  return matches;
}

export function useDocumentTitle(title: string) {
  const { t } = useI18n();
  useEffect(() => {
    document.title = title ? `${title} · PathForge` : `PathForge – ${t('AI Career & Research Roadmap')}`;
  }, [title, t]);
}
