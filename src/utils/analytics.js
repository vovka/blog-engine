export {
  canRunAnalytics,
  hasValidClarityId,
  hasValidGa4Id,
  isAllowedHost,
  normalizeAnalyticsConfig,
} from './analyticsConfig.js';
export {
  clearAnalyticsCookies,
  getCookieDomains,
  getInitialConsent,
  hasGlobalPrivacyControl,
  readConsent,
  resolveConsentUpdate,
  saveConsent,
} from './analyticsConsent.js';
export {
  deniedConsent,
  setGoogleConsentDefault,
  updateClarityConsent,
  updateGoogleConsent,
} from './consentMode.js';
export { initializeProviders as initializeAnalytics } from './analyticsProviders.js';

export const trackEvent = (name, parameters = {}) => {
  if (typeof window === 'undefined') return;
  window.gtag?.('event', name, parameters);
  window.clarity?.('event', name);
};

export const trackPageView = ({ title, path, location }) => {
  trackEvent('page_view', {
    page_title: title,
    page_path: path,
    page_location: location,
  });
};

export const setClarityTags = tags => {
  Object.entries(tags).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    window.clarity?.('set', key, String(value));
  });
};
