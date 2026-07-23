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

export const hasValidGa4Id = id => /^G-[A-Z0-9]+$/i.test(id);

export const hasValidClarityId = id => /^[a-z0-9]+$/i.test(id);

export const isAllowedHost = config => (
  typeof window !== 'undefined' && config.allowedHosts.includes(window.location.hostname)
);

export const canRunAnalytics = config => config.enabled && isAllowedHost(config);
