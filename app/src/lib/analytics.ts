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
  if (typeof window === 'undefined') {
    console.warn('Analytics: Window is undefined (SSR?)');
    return;
  }
  
  if (scriptElementExists() && typeof window.gtag === 'function') {
    console.log('Analytics: Already initialized');
    return;
  }

  console.log('Analytics: Initializing Google Analytics');
  createGtagStub();

  return new Promise((resolve, reject) => {
    if (!scriptElementExists()) {
      const s = document.createElement('script');
      s.async = true;
      s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
      s.onload = () => {
        try {
          console.log('Analytics: Script loaded, configuring gtag');
          window.gtag?.('js', new Date());
          
          // Set default consent
          window.gtag?.('consent', 'default', {
            analytics_storage: 'granted',
            ad_storage: 'denied',
            functionality_storage: 'granted',
            personalization_storage: 'denied',
            security_storage: 'granted'
          });
          
          window.gtag?.('config', GA_ID, { 
            anonymize_ip: true,
            send_page_view: false // We'll handle page views manually
          });
          console.log('Analytics: Configuration complete');
          resolve();
        } catch (err) {
          console.warn('Analytics: gtag init error', err);
          reject(err);
        }
      };
      s.onerror = () => {
        console.error('Analytics: Failed to load gtag script');
        reject(new Error('Failed to load gtag script'));
      };
      document.head.appendChild(s);
    } else {
      try {
        console.log('Analytics: Script exists, configuring gtag');
        window.gtag?.('js', new Date());
        
        // Set default consent
        window.gtag?.('consent', 'default', {
          analytics_storage: 'granted',
          ad_storage: 'denied',
          functionality_storage: 'granted',
          personalization_storage: 'denied',
          security_storage: 'granted'
        });
        
        window.gtag?.('config', GA_ID, { 
          anonymize_ip: true,
          send_page_view: false
        });
        console.log('Analytics: Configuration complete');
        resolve();
      } catch (err) {
        console.warn('Analytics: gtag config error', err);
        reject(err);
      }
    }
  });
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
    if (!window.gtag) {
      console.warn('Analytics: gtag not available for event:', action);
      return;
    }
    console.log('Analytics: Tracking event:', action, params);
    window.gtag('event', action, params || {});
  } catch (err) {
    console.warn('Analytics: trackEvent error', err);
  }
}

export function trackSearchEvent(term: string, resultsCount: number) {
  trackEvent('search', { search_term: term, results_count: resultsCount });
}

export function trackPageView(path?: string) {
  try {
    if (!window.gtag) {
      console.warn('Analytics: gtag not available for page view');
      return;
    }
    const pagePath = path ?? location.pathname;
    console.log('Analytics: Tracking page view for:', pagePath);
    
    // Send page view event
    window.gtag('event', 'page_view', {
      page_path: pagePath,
      page_location: window.location.href,
      page_title: document.title
    });
  } catch (err) {
    console.warn('Analytics: trackPageView error', err);
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

// Send initial page view - call this after analytics is initialized
export function sendInitialPageView(): void {
  if (isAnalyticsEnabled()) {
    console.log('Analytics: Sending initial page view');
    trackPageView(window.location.pathname + window.location.search);
  }
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
