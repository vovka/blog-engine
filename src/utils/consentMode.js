import { canRunAnalytics, hasValidGa4Id } from './analyticsConfig.js';

export const deniedConsent = Object.freeze({
  analytics_storage: 'denied',
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
});

const consentState = accepted => ({
  ...deniedConsent,
  analytics_storage: accepted ? 'granted' : 'denied',
});

export const ensureGoogleQueue = () => {
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag() {
    window.dataLayer.push(arguments);
  };
};

export const setGoogleConsentDefault = config => {
  if (!canRunAnalytics(config) || !hasValidGa4Id(config.ga4MeasurementId)) return;
  if (window.blogGoogleConsentDefaulted) return;
  ensureGoogleQueue();
  window.gtag('consent', 'default', deniedConsent);
  window.blogGoogleConsentDefaulted = true;
};

export const updateGoogleConsent = (config, accepted) => {
  if (!canRunAnalytics(config) || !hasValidGa4Id(config.ga4MeasurementId)) return;
  ensureGoogleQueue();
  window[`ga-disable-${config.ga4MeasurementId}`] = !accepted;
  window.gtag('consent', 'update', consentState(accepted));
};

export const updateClarityConsent = accepted => {
  if (accepted) window.clarity?.('start');
  window.clarity?.('consentv2', {
    ad_Storage: 'denied',
    analytics_Storage: accepted ? 'granted' : 'denied',
  });
  if (!accepted) window.clarity?.('stop');
};
