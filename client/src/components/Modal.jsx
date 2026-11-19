import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { IconX } from './Icons';

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

/** Accessible dialog: Esc to close, focus trapped + restored, background scroll locked. variant="drawer" slides in from the right. */
export default function Modal({ open, onClose, title, children, variant = 'center', size = 'lg', labelledBy = 'modal-title' }) {
  const panel = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const first = panel.current?.querySelector('[data-autofocus]') || panel.current?.querySelector(FOCUSABLE);
    (first || panel.current)?.focus();

    const onKey = (e) => {
      if (e.key === 'Escape') return onCloseRef.current();
      if (e.key !== 'Tab' || !panel.current) return;
      const nodes = [...panel.current.querySelectorAll(FOCUSABLE)];
      if (!nodes.length) return;
      const [a, z] = [nodes[0], nodes[nodes.length - 1]];
      if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
      else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
  }, [open]);

  if (!open) return null;
  const widths = { md: 'max-w-xl', lg: 'max-w-3xl', xl: 'max-w-5xl' };
  const isDrawer = variant === 'drawer';
  return createPortal(
    <div className={`fixed inset-0 z-50 flex ${isDrawer ? 'justify-end' : 'items-end justify-center sm:items-center sm:p-6'}`}>
      <div className="absolute inset-0 animate-fade bg-forest-900/70 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        className={`relative flex max-h-full w-full flex-col overflow-hidden bg-ivory shadow-2xl outline-none ${
          isDrawer ? 'animate-slideIn max-w-xl' : `animate-rise rounded-t-3xl sm:rounded-3xl ${widths[size]}`
        }`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-forest/10 bg-white px-5 py-4 sm:px-7">
          <h2 id={labelledBy} className="font-display text-2xl font-bold">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="-mr-2 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-forest hover:bg-forest/10">
            <IconX />
          </button>
        </div>
        <div className="overflow-y-auto">{children}</div>
      </div>
    </div>,
    document.body
  );
}
