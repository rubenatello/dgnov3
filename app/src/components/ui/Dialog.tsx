import {
  useEffect,
  useId,
  useRef,
  type MouseEvent,
  type ReactNode,
  type RefObject,
} from 'react';
import { createPortal } from 'react-dom';

type DialogPlacement = 'center' | 'bottom' | 'right';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
  id?: string;
  initialFocusRef?: RefObject<HTMLElement | null>;
  placement?: DialogPlacement;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
}

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export default function Dialog({
  open,
  onClose,
  title,
  children,
  className = '',
  id,
  initialFocusRef,
  placement = 'center',
  closeOnBackdrop = true,
  closeOnEscape = true,
}: DialogProps) {
  const generatedId = useId();
  const dialogId = id || `dialog-${generatedId.replace(/:/g, '')}`;
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;

    const previousFocus = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    const appRoot = document.getElementById('root');
    const priorOverflow = document.body.style.overflow;
    const priorAriaHidden = appRoot?.getAttribute('aria-hidden');
    const priorInert = appRoot?.inert ?? false;

    document.body.style.overflow = 'hidden';
    if (appRoot) {
      appRoot.inert = true;
      appRoot.setAttribute('aria-hidden', 'true');
    }

    const focusDialog = window.requestAnimationFrame(() => {
      const requestedTarget = initialFocusRef?.current;
      const fallbackTarget = panelRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
      (requestedTarget || fallbackTarget || panelRef.current)?.focus();
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && closeOnEscape) {
        event.preventDefault();
        onCloseRef.current();
        return;
      }

      if (event.key !== 'Tab' || !panelRef.current) return;

      const focusable = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter((element) => !element.hidden && element.getAttribute('aria-hidden') !== 'true');

      if (focusable.length === 0) {
        event.preventDefault();
        panelRef.current.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      window.cancelAnimationFrame(focusDialog);
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = priorOverflow;
      if (appRoot) {
        appRoot.inert = priorInert;
        if (priorAriaHidden === null || priorAriaHidden === undefined) {
          appRoot.removeAttribute('aria-hidden');
        } else {
          appRoot.setAttribute('aria-hidden', priorAriaHidden);
        }
      }
      window.requestAnimationFrame(() => previousFocus?.focus());
    };
  }, [closeOnEscape, initialFocusRef, open]);

  if (!open || typeof document === 'undefined') return null;

  const placementClasses: Record<DialogPlacement, string> = {
    center: 'items-center justify-center p-4',
    bottom: 'items-end justify-center p-0 sm:p-4',
    right: 'items-stretch justify-end p-0',
  };

  const handleBackdrop = (event: MouseEvent<HTMLDivElement>) => {
    if (closeOnBackdrop && event.currentTarget === event.target) onClose();
  };

  return createPortal(
    <div
      className={`fixed inset-0 z-[10000] flex bg-black/70 backdrop-blur-sm ${placementClasses[placement]}`}
      onMouseDown={handleBackdrop}
    >
      <div
        ref={panelRef}
        id={dialogId}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={`public-dialog-surface max-h-[calc(100dvh-env(safe-area-inset-top))] overflow-y-auto bg-surface text-ink shadow-raised outline-none ${className}`}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
