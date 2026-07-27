const GA_ID = 'G-E5YW8K19NQ'; // project Google Measurement ID

declare global {
  interface Window {
    dataLayer: Array<unknown> | undefined;
    gtag?: (...args: unknown[]) => void;
  }
}

// Initialize consent mode and gtag BEFORE any script loads
// This must be called immediately on page load
export function initializeConsentMode() {
  if (typeof window === 'undefined') return;
  
  // Initialize dataLayer if not already present
  window.dataLayer = window.dataLayer || [];
  
  // Create gtag function if not already present
  if (!window.gtag) {
    window.gtag = function(...args: unknown[]) {
      window.dataLayer!.push(args);
    };
  }
  
  // Set default consent to denied (GDPR compliant)
  window.gtag('consent', 'default', {
    'analytics_storage': 'denied',
    'ad_storage': 'denied',
    'ad_user_data': 'denied',
    'ad_personalization': 'denied',
    'wait_for_update': 500
  });
  
  console.log('Analytics: Consent mode initialized with default denied');
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

  console.log('Analytics: Loading Google Analytics script');

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
          send_page_view: true, // Enable automatic page views
          cookie_flags: 'SameSite=None;Secure',
          anonymize_ip: true // Privacy friendly
        });
        
        console.log('Analytics: Configuration complete, ready to track');
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
  if (typeof window === 'undefined' || !window.gtag) {
    console.warn('Analytics: gtag not available for consent update');
    return;
  }
  try {
    console.log('Analytics: Updating consent -', { analyticsGranted, adGranted });
    window.gtag('consent', 'update', {
      'analytics_storage': analyticsGranted ? 'granted' : 'denied',
      'ad_storage': adGranted ? 'granted' : 'denied',
      'ad_user_data': adGranted ? 'granted' : 'denied',
      'ad_personalization': adGranted ? 'granted' : 'denied'
    });
    
    // Send a page view after consent is granted to start tracking
    if (analyticsGranted) {
      console.log('Analytics: Consent granted, sending initial page view');
      trackPageView();
    }
  } catch (e) {
    console.warn('Analytics: updateConsent error', e);
  }
}

export function trackEvent(action: string, params?: Record<string, unknown>) {
  try {
    if (!isAnalyticsEnabled()) return;
    if (!window.gtag) {
      console.warn('Analytics: gtag not available for event:', action);
      return;
    }
    
    const enhancedParams = {
      ...params,
      send_to: GA_ID,
      timestamp_micros: Date.now() * 1000
    };
    
    console.log('Analytics: Tracking event:', action, enhancedParams);
    window.gtag('event', action, enhancedParams);
  } catch (err) {
    console.warn('Analytics: trackEvent error', err);
  }
}

// Add specific tracking functions for better analytics
export function trackArticleView(articleId: string, articleTitle: string) {
  trackEvent('article_view', {
    article_id: articleId,
    article_title: articleTitle,
    content_type: 'article'
  });
}

export function trackArticleLike(articleId: string, articleTitle: string) {
  trackEvent('article_like', {
    article_id: articleId,
    article_title: articleTitle,
    engagement_type: 'like'
  });
}

export function trackTrackerView(trackerId: string, trackerName: string) {
  trackEvent('tracker_view', {
    tracker_id: trackerId,
    tracker_name: trackerName,
    content_type: 'tracker'
  });
}

export function trackSearchEvent(term: string, resultsCount: number) {
  trackEvent('search', { search_term: term, results_count: resultsCount });
}

export function trackPageView(path?: string) {
  try {
    if (!isAnalyticsEnabled()) return;
    if (!window.gtag) {
      console.warn('Analytics: gtag not available for page view');
      return;
    }
    
    const pagePath = path ?? window.location.pathname + window.location.search;
    console.log('Analytics: Tracking page view for:', pagePath);
    
    // Send as config update for proper page view tracking
    window.gtag('config', GA_ID, {
      page_path: pagePath,
      page_title: document.title,
      page_location: window.location.href
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
  if (typeof window === 'undefined') return false;
  try {
    const consent = document.cookie
      .split(';')
      .map((cookie) => cookie.trim())
      .find((cookie) => cookie.startsWith('dgnov3CookieConsent='))
      ?.slice('dgnov3CookieConsent='.length);
    return consent === 'true';
  } catch {
    return false;
  }
}

export default {
  initializeConsentMode,
  enableAnalytics,
  disableAnalytics,
  updateConsent,
  trackEvent,
  trackSearchEvent,
  trackPageView,
  isAnalyticsEnabled,
};
