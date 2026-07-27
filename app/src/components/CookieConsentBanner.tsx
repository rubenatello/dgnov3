import { useEffect, useRef, useState } from 'react';
import { disableAnalytics, enableAnalytics, updateConsent } from '../lib/analytics';
import Dialog from './ui/Dialog';

const COOKIE_NAME = 'dgnov3CookieConsent';
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

function readDecision(): boolean | null {
  const cookie = document.cookie
    .split(';')
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(`${COOKIE_NAME}=`));

  if (!cookie) return null;
  const value = decodeURIComponent(cookie.slice(cookie.indexOf('=') + 1)).toLowerCase();
  if (value === 'true') return true;
  if (value === 'false') return false;
  return null;
}

function writeDecision(value: boolean) {
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${COOKIE_NAME}=${value}; Max-Age=${ONE_YEAR_SECONDS}; Path=/; SameSite=Lax${secure}`;
}

export default function CookieConsentBanner() {
  const [open, setOpen] = useState(false);
  const declineButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    try {
      const decision = readDecision();
      if (decision === true) {
        void enableAnalytics()
          .then(() => updateConsent({ analyticsGranted: true, adGranted: false }))
          .catch((error) => console.warn('enableAnalytics failed', error));
      } else if (decision === false) {
        disableAnalytics();
        updateConsent({ analyticsGranted: false, adGranted: false });
      } else {
        setOpen(true);
      }
    } catch (error) {
      console.warn('cookie consent initialization failed', error);
      setOpen(true);
    }
  }, []);

  const accept = () => {
    writeDecision(true);
    setOpen(false);
    void enableAnalytics()
      .then(() => updateConsent({ analyticsGranted: true, adGranted: false }))
      .catch((error) => console.warn('enableAnalytics failed', error));
  };

  const decline = () => {
    writeDecision(false);
    disableAnalytics();
    updateConsent({ analyticsGranted: false, adGranted: false });
    setOpen(false);
  };

  return (
    <Dialog
      open={open}
      onClose={decline}
      title="Cookie choices"
      placement="bottom"
      initialFocusRef={declineButtonRef}
      closeOnBackdrop={false}
      closeOnEscape={false}
      className="safe-bottom w-full max-w-5xl rounded-t-xl border border-stone p-5 sm:rounded-xl sm:p-6"
    >
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="max-w-3xl">
          <h2 className="text-lg font-bold text-ink">Your privacy choices</h2>
          <p className="mt-1 text-sm leading-relaxed text-ink-muted">
            DGNO uses optional analytics to understand which public-interest reporting readers find useful. Declining keeps analytics disabled. Read the{' '}
            <a href="/privacy" className="font-bold text-accent-dark underline underline-offset-2">Privacy Policy</a>.
          </p>
        </div>
        <div className="flex flex-col-reverse gap-3 sm:flex-row md:flex-none">
          <button ref={declineButtonRef} type="button" onClick={decline} className="min-h-11 rounded-md border border-stone px-5 py-2.5 font-bold text-ink hover:bg-stone-light">Decline analytics</button>
          <button type="button" onClick={accept} className="min-h-11 rounded-md bg-accent-strong px-5 py-2.5 font-bold text-white hover:bg-accent-dark">Accept analytics</button>
        </div>
      </div>
    </Dialog>
  );
}
