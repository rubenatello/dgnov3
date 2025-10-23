const GA_ID = 'G-E5YW8K19NQ'; // project Google Measurement ID

declare global {
  interface Window {
    dataLayer: Array<unknown> | undefined;
    gtag?: (...args: unknown[]) => void;
  }
}

function ensureDataLayer() {
  if (!window.dataLayer) window.dataLayer = [];
}

function createGtagStub() {
  ensureDataLayer();
  window.gtag = function (...rest: unknown[]) {
    if (!window.dataLayer) window.dataLayer = [];
    window.dataLayer.push(rest);
  };
}

function scriptElementExists() {
  return !!document.querySelector(`script[src*="${GA_ID}"]`);
}

export async function enableAnalytics(): Promise<void> {
  if (typeof window === 'undefined') return;
  if (scriptElementExists() && typeof window.gtag === 'function') {
    return;
  }

  createGtagStub();

  if (!scriptElementExists()) {
    const s = document.createElement('script');
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    s.onload = () => {
      try {
        window.gtag?.('js', new Date());
        window.gtag?.('config', GA_ID, { anonymize_ip: true });
      } catch (_err) {
        // best-effort; don't throw
        console.warn('gtag init error', _err);
      }
    };
    document.head.appendChild(s);
  } else {
    try {
      window.gtag?.('js', new Date());
      window.gtag?.('config', GA_ID, { anonymize_ip: true });
    } catch {
      console.warn('gtag config error');
    }
  }
}

export function updateConsent({ analyticsGranted, adGranted }: { analyticsGranted: boolean; adGranted: boolean; }) {
  if (typeof window === 'undefined' || !window.gtag) return;
  try {
    window.gtag('consent', 'update', {
      analytics_storage: analyticsGranted ? 'granted' : 'denied',
      ad_storage: adGranted ? 'granted' : 'denied',
    });
  } catch (e) {
    console.warn('updateConsent error', e);
  }
}

export function trackEvent(action: string, params?: Record<string, unknown>) {
  try {
    if (!window.gtag) return;
    window.gtag('event', action, params || {});
  } catch (err) {
    console.warn('trackEvent error', err);
  }
}

export function trackSearchEvent(term: string, resultsCount: number) {
  trackEvent('search', { search_term: term, results_count: resultsCount });
}

export function trackPageView(path?: string) {
  try {
    if (!window.gtag) return;
    window.gtag('config', GA_ID, { page_path: path ?? location.pathname });
  } catch (err) {
    console.warn('trackPageView error', err);
  }
}

function deleteCookie(name: string) {
  try {
    document.cookie = `${name}=; Max-Age=0; path=/; domain=${location.hostname}`;
  } catch (err) {
    console.warn('deleteCookie error', err);
  }
}

export function disableAnalytics(): void {
  try {
    ['_ga', '_gid', '_gat'].forEach(deleteCookie);
    const script = document.querySelector(`script[src*="${GA_ID}"]`);
    if (script && script.parentNode) script.parentNode.removeChild(script);
    window.gtag = function () {};
    window.dataLayer = [];
  } catch (e) {
    console.warn('disableAnalytics cleanup error', e);
  }
}

export function isAnalyticsEnabled(): boolean {
  return typeof window !== 'undefined' && typeof window.gtag === 'function' && scriptElementExists();
}

export default {
  enableAnalytics,
  disableAnalytics,
  updateConsent,
  trackEvent,
  trackSearchEvent,
  trackPageView,
  isAnalyticsEnabled,
};
