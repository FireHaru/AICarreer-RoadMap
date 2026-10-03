import { useState } from 'react';
import { useToast } from '../../context/ToastContext';
import { useI18n } from '../../i18n';
import { api, errorMessage } from '../../lib/api';
import type { RoadmapMutation } from '../../lib/types';

type Action = 'complete' | 'uncomplete' | 'skip' | 'unskip' | 'add' | 'remove';

/** Roadmap mutations with toasts; the caller receives the updated roadmap. */
export function useCourseActions(onChanged?: (m: RoadmapMutation) => void) {
  const toast = useToast();
  const { t } = useI18n();
  const [busy, setBusy] = useState<Action | null>(null);
  const titles = (list: { title: string }[]) => list.map((u) => u.title).join(', ');

  async function run(action: Action, code: string, title: string) {
    setBusy(action);
    try {
      let m: RoadmapMutation;
      switch (action) {
        case 'complete':
        case 'uncomplete':
          m = await api.post<RoadmapMutation>(`/roadmap/courses/${code}/complete`, { completed: action === 'complete' });
          if (action === 'complete') {
            toast({ tone: 'success', title: t('{title} completed', { title }), description: m.roadmap.progress.pct ? t('Roadmap progress: {n}%', { n: m.roadmap.progress.pct }) : undefined });
            if (m.unlocked.length) toast({ tone: 'unlock', title: t('Unlocked {list}', { list: titles(m.unlocked) }), description: t('Their prerequisites are now satisfied.') });
          } else {
            toast({ title: t('{title} marked as not completed', { title }) });
          }
          break;
        case 'skip':
        case 'unskip':
          m = await api.post<RoadmapMutation>(`/roadmap/courses/${code}/skip`, { skipped: action === 'skip' });
          toast({
            title: action === 'skip' ? t('Skipped {title}', { title }) : t('{title} is back in your plan', { title }),
            description: action === 'skip' && m.unlocked.length ? t('Unlocked {list}', { list: titles(m.unlocked) }) : undefined,
          });
          break;
        case 'add':
          m = await api.post<RoadmapMutation>('/roadmap/courses', { courseId: code });
          toast({
            tone: 'success',
            title: t('Added {title}', { title }),
            description: m.added && m.added.length > 1 ? t('Also added prerequisites: {list}', { list: titles(m.added.filter((a) => a.code !== code)) }) : undefined,
          });
          break;
        case 'remove':
          m = await api.del<RoadmapMutation>(`/roadmap/courses/${code}`);
          toast({ title: t('Removed {title}', { title }), description: m.affected?.length ? t('{list} relied on it — make sure you know that material.', { list: titles(m.affected) }) : undefined });
          break;
      }
      onChanged?.(m);
      return m;
    } catch (err) {
      toast({ tone: 'error', title: errorMessage(err) });
      return null;
    } finally {
      setBusy(null);
    }
  }

  return { run, busy };
}
