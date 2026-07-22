const COOKIE_NAMES = [/^_ga/, /^_gid$/, /^_gat/];

export const normalizeAnalyticsConfig = (config = {}) => ({
  enabled: config.enabled === true,
  environment: config.environment || 'unknown',
  allowedHosts: Array.isArray(config.allowedHosts) ? config.allowedHosts : [],
  ga4MeasurementId: config.ga4MeasurementId || '',
  clarityProjectId: config.clarityProjectId || '',
  consent: {
    required: config.consent?.required !== false,
    storageKey: config.consent?.storageKey || 'blog.analyticsConsent',
    policyVersion: config.consent?.policyVersion || '1',
    privacyPagePath: config.consent?.privacyPagePath || '/privacy',
  },
});

export const isAllowedHost = config =>
  typeof window !== 'undefined' && config.allowedHosts.includes(window.location.hostname);

export const hasValidGa4Id = id => /^G-[A-Z0-9]+$/i.test(id);
export const hasValidClarityId = id => /^[a-z0-9]+$/i.test(id);

export const readConsent = config => {
  if (typeof window === 'undefined') return 'unknown';
  if (navigator.globalPrivacyControl === true) return 'rejected';
  try {
    const stored = JSON.parse(localStorage.getItem(config.consent.storageKey));
    if (stored?.policyVersion !== config.consent.policyVersion) return 'unknown';
    return stored?.analytics === 'accepted' ? 'accepted' : stored?.analytics === 'rejected' ? 'rejected' : 'unknown';
  } catch {
    return 'unknown';
  }
};

export const saveConsent = (config, analytics) => {
  localStorage.setItem(config.consent.storageKey, JSON.stringify({
    analytics,
    policyVersion: config.consent.policyVersion,
    updatedAt: new Date().toISOString(),
  }));
};

export const clearAnalyticsCookies = () => {
  document.cookie.split(';').forEach(cookie => {
    const name = cookie.split('=')[0].trim();
    if (COOKIE_NAMES.some(pattern => pattern.test(name))) {
      document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax`;
      document.cookie = `${name}=; Max-Age=0; path=/; domain=.${location.hostname}; SameSite=Lax`;
    }
  });
};

const loadScript = (id, src) => new Promise((resolve, reject) => {
  if (document.getElementById(id)) return resolve();
  const script = document.createElement('script');
  script.id = id;
  script.async = true;
  script.src = src;
  script.onload = resolve;
  script.onerror = reject;
  document.head.appendChild(script);
});

export const initializeAnalytics = async config => {
  if (!config.enabled || !isAllowedHost(config)) return;
  if (hasValidGa4Id(config.ga4MeasurementId)) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function gtag(){ window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', config.ga4MeasurementId, {
      send_page_view: false,
      debug_mode: config.environment === 'test',
      anonymize_ip: true,
    });
    await loadScript('blog-ga4', `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(config.ga4MeasurementId)}`);
  }
  if (hasValidClarityId(config.clarityProjectId)) {
    window.clarity = window.clarity || function clarity(){ (window.clarity.q = window.clarity.q || []).push(arguments); };
    window.clarity('consentv2', { ad_Storage: 'denied', analytics_Storage: 'granted' });
    await loadScript('blog-clarity', `https://www.clarity.ms/tag/${encodeURIComponent(config.clarityProjectId)}`);
    window.clarity('set', 'environment', config.environment);
  }
};

export const trackEvent = (name, parameters = {}) => {
  window.gtag?.('event', name, parameters);
};

export const trackPageView = ({ title, path, location }) => {
  trackEvent('page_view', { page_title: title, page_path: path, page_location: location });
};

export const setClarityTags = tags => {
  Object.entries(tags).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') window.clarity?.('set', key, String(value));
  });
};
