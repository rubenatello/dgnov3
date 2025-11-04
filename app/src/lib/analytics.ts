const GA_ID = 'G-E5YW8K19NQ'; // project Google Measurement ID

declare global {
  interface Window {
    dataLayer: Array<unknown> | undefined;
    gtag?: (...args: unknown[]) => void;
  }
}

// Initialize dataLayer and gtag function immediately
function initializeGtag() {
  window.dataLayer = window.dataLayer || [];
  window.gtag = function(...args: unknown[]) {
    window.dataLayer!.push(args);
  };
}

function scriptElementExists() {
  return !!document.querySelector(`script[src*="googletagmanager.com/gtag/js"]`);
}

export async function enableAnalytics(): Promise<void> {
  if (typeof window === 'undefined') {
    console.warn('Analytics: Window is undefined (SSR?)');
    return;
  }
  
  if (scriptElementExists()) {
    console.log('Analytics: Already initialized');
    return;
  }

  console.log('Analytics: Initializing Google Analytics with ID:', GA_ID);
  
  // Initialize gtag function immediately
  initializeGtag();

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    
    script.onload = () => {
      try {
        console.log('Analytics: Script loaded, configuring gtag');
        
        // Initialize gtag with current timestamp
        window.gtag!('js', new Date());
        
        // Configure GA with your measurement ID
        window.gtag!('config', GA_ID, {
          send_page_view: false // We'll send page views manually
        });
        
        console.log('Analytics: Configuration complete');
        resolve();
      } catch (err) {
        console.error('Analytics: Configuration failed', err);
        reject(err);
      }
    };
    
    script.onerror = (err) => {
      console.error('Analytics: Failed to load gtag script', err);
      reject(new Error('Failed to load gtag script'));
    };
    
    document.head.appendChild(script);
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
    
    const pagePath = path ?? window.location.pathname;
    console.log('Analytics: Tracking page view for:', pagePath);
    
    // Send page view event using the standard method
    window.gtag('event', 'page_view', {
      page_path: pagePath,
      page_location: window.location.href,
      page_title: document.title
    });
  } catch (err) {
    console.error('Analytics: trackPageView error', err);
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
  return typeof window !== 'undefined' && typeof window.gtag === 'function';
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
