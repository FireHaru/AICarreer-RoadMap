import { clsx } from 'clsx';
import { X } from 'lucide-react';
import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useI18n } from '../../i18n';

function useEscape(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);
}

export function Modal({ open, onClose, title, description, children, footer, className }: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  const { t } = useI18n();
  useEscape(open, onClose);
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-end justify-center p-0 sm:items-center sm:p-6">
      <div className="absolute inset-0 bg-navy-950/70 backdrop-blur-sm" onClick={onClose} />
      <div role="dialog" aria-modal="true" className={clsx('relative flex max-h-[90vh] w-full flex-col overflow-hidden rounded-t-2xl border border-white/10 bg-navy-850 shadow-2xl animate-fade-up sm:max-w-lg sm:rounded-2xl', className)}>
        <div className="flex items-start justify-between gap-4 border-b border-white/[0.06] p-5">
          <div>
            <h2 className="text-base font-semibold text-white">{title}</h2>
            {description && <p className="mt-1 text-sm text-slate-400">{description}</p>}
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white" aria-label={t('Close')}>
            <X className="size-4" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-5">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-white/[0.06] p-4">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

export function Drawer({ open, onClose, children, width = 'sm:max-w-xl' }: { open: boolean; onClose: () => void; children: ReactNode; width?: string }) {
  const { t } = useI18n();
  useEscape(open, onClose);
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[80]">
      <div className="absolute inset-0 bg-navy-950/60 backdrop-blur-[2px]" onClick={onClose} />
      <aside className={clsx('absolute inset-y-0 right-0 flex w-full flex-col border-l border-white/10 bg-navy-900/95 shadow-2xl backdrop-blur-xl', width)} style={{ animation: 'fade-up .3s ease-out both' }}>
        <button onClick={onClose} className="absolute right-4 top-4 z-10 rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white" aria-label={t('Close panel')}>
          <X className="size-5" />
        </button>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </aside>
    </div>,
    document.body,
  );
}
