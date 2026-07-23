import { hasValidClarityId, hasValidGa4Id } from '../utils/analyticsConfig.js';

const PROFILES = new Set(['local', 'development', 'test', 'testing', 'staging', 'production']);
const HOST_PATTERN = /^(localhost|(?:\d{1,3}\.){3}\d{1,3}|(?:[a-z0-9-]+\.)*[a-z0-9-]+)$/i;

const validUrl = value => {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || (url.protocol === 'http:' && url.hostname === 'localhost');
  } catch {
    return false;
  }
};

const validateUrl = (config, diagnostics) => {
  if (config.siteUrl && !validUrl(config.siteUrl)) diagnostics.push('VITE_SITE_URL must be an absolute HTTPS URL.');
  if (config.comments?.canonicalBaseUrl && !validUrl(config.comments.canonicalBaseUrl)) {
    diagnostics.push('comments.canonicalBaseUrl must be an absolute HTTPS URL.');
  }
};

const validateHosts = (analytics, diagnostics) => {
  if (!Array.isArray(analytics.allowedHosts)) {
    diagnostics.push('VITE_ANALYTICS_ALLOWED_HOSTS must be a comma-separated host list.');
    return;
  }
  const invalid = analytics.allowedHosts.filter(host => !HOST_PATTERN.test(host));
  if (invalid.length) diagnostics.push(`Invalid analytics host(s): ${invalid.join(', ')}.`);
};

const validateProviders = (analytics, diagnostics) => {
  if (analytics.ga4MeasurementId && !hasValidGa4Id(analytics.ga4MeasurementId)) {
    diagnostics.push('VITE_ANALYTICS_GA4_MEASUREMENT_ID must use the G-XXXXXXXX format.');
  }
  if (analytics.clarityProjectId && !hasValidClarityId(analytics.clarityProjectId)) {
    diagnostics.push('VITE_ANALYTICS_CLARITY_PROJECT_ID contains invalid characters.');
  }
  if (analytics.enabled && !analytics.ga4MeasurementId && !analytics.clarityProjectId) {
    diagnostics.push('Enabled analytics requires at least one provider ID.');
  }
};

const validateConsent = (analytics, diagnostics) => {
  if (!analytics.enabled) return;
  const consent = analytics.consent || {};
  if (typeof consent.required !== 'boolean') diagnostics.push('Analytics consent.required must be a boolean.');
  if (!String(consent.storageKey || '').trim()) diagnostics.push('Analytics consent.storageKey is required.');
  if (!String(consent.policyVersion || '').trim()) diagnostics.push('Analytics consent.policyVersion is required.');
  if (!String(consent.privacyPagePath || '').startsWith('/')) {
    diagnostics.push('Analytics consent.privacyPagePath must start with "/".');
  }
};

const validateRobots = (config, diagnostics) => {
  const robots = config.robots || {};
  if (!PROFILES.has(String(robots.profile).toLowerCase())) diagnostics.push('VITE_SITE_PROFILE is invalid.');
  if (typeof robots.index !== 'boolean') diagnostics.push('VITE_ROBOTS_INDEX must resolve to a boolean.');
  if (robots.index && !config.siteUrl) diagnostics.push('Indexing requires VITE_SITE_URL.');
};

export const validateBlogConfig = config => {
  const diagnostics = [];
  validateUrl(config, diagnostics);
  validateRobots(config, diagnostics);
  validateHosts(config.analytics, diagnostics);
  validateProviders(config.analytics, diagnostics);
  validateConsent(config.analytics, diagnostics);
  return diagnostics;
};
