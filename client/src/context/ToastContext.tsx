import { CircleCheck, Info, LockOpen, TriangleAlert, X } from 'lucide-react';
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { clsx } from 'clsx';
import { useI18n } from '../i18n';

type Tone = 'success' | 'info' | 'error' | 'unlock';
interface Toast { id: number; title: string; description?: string; tone: Tone }

const ToastContext = createContext<((t: Omit<Toast, 'id' | 'tone'> & { tone?: Tone }) => void) | null>(null);

const TONES: Record<Tone, { icon: typeof Info; className: string }> = {
  success: { icon: CircleCheck, className: 'text-emerald-300' },
  info: { icon: Info, className: 'text-cyan-300' },
  error: { icon: TriangleAlert, className: 'text-rose-300' },
  unlock: { icon: LockOpen, className: 'text-violet-300' },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => setToasts((ts) => ts.filter((t) => t.id !== id)), []);
  const push = useCallback((t: Omit<Toast, 'id' | 'tone'> & { tone?: Tone }) => {
    const id = nextId.current++;
    setToasts((ts) => [...ts.slice(-3), { ...t, id, tone: t.tone ?? 'info' }]);
    window.setTimeout(() => dismiss(id), 4500);
  }, [dismiss]);

  const value = useMemo(() => push, [push]);
  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-4 bottom-20 z-[100] flex flex-col items-end gap-2 sm:bottom-6 sm:left-auto sm:right-6 sm:w-96" aria-live="polite">
        {toasts.map((toast) => {
          const { icon: Icon, className } = TONES[toast.tone];
          return (
            <div key={toast.id} className="pointer-events-auto flex w-full animate-fade-up items-start gap-3 rounded-xl border border-white/10 bg-navy-800/95 p-3.5 shadow-2xl shadow-black/40 backdrop-blur-xl">
              <Icon className={clsx('mt-0.5 size-5 shrink-0', className)} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-100">{toast.title}</p>
                {toast.description && <p className="mt-0.5 text-xs leading-relaxed text-slate-400">{toast.description}</p>}
              </div>
              <button onClick={() => dismiss(toast.id)} className="rounded-md p-1 text-slate-500 hover:bg-white/5 hover:text-slate-300" aria-label={t('Dismiss')}>
                <X className="size-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}
