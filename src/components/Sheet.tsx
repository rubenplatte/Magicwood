import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
}

// A mobile bottom-sheet modal.
export function Sheet({ open, onClose, title, children, footer }: SheetProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div
        className="absolute inset-0 bg-black/60 animate-[fadeIn_0.15s_ease]"
        onClick={onClose}
      />
      <div className="relative w-full max-h-[88vh] flex flex-col rounded-t-2xl bg-slate-900 border-t border-slate-700 shadow-2xl animate-[slideUp_0.2s_ease]">
        <div className="flex items-center justify-between px-4 pt-3 pb-2 shrink-0">
          <div className="absolute left-1/2 top-1.5 -translate-x-1/2 h-1 w-10 rounded-full bg-slate-600" />
          <h2 className="text-base font-semibold mt-1">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 -mr-2 rounded-full text-slate-400 hover:text-white"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto px-4 py-2 flex-1">{children}</div>
        {footer && (
          <div className="shrink-0 border-t border-slate-700 p-3 safe-bottom">{footer}</div>
        )}
      </div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { transform: translateY(100%) } to { transform: translateY(0) } }
      `}</style>
    </div>
  );
}
