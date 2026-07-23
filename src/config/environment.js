const BOOLEAN_VALUES = new Map([['true', true], ['false', false]]);

const firstValue = (env, ...names) => names.map(name => env[name]).find(value => value !== undefined);

const parseBoolean = (value, name, diagnostics) => {
  if (value === undefined || value === '') return undefined;
  const parsed = BOOLEAN_VALUES.get(String(value).toLowerCase());
  if (parsed === undefined) diagnostics.push(`${name} must be "true" or "false".`);
  return parsed;
};

const parseHosts = value => {
  if (value === undefined || value === '') return undefined;
  return String(value).split(',').map(host => host.trim()).filter(Boolean);
};

const assign = (target, key, value) => {
  if (value !== undefined) target[key] = value;
};

const readSiteOverrides = (env, diagnostics) => {
  const site = {};
  assign(site, 'siteUrl', env.VITE_SITE_URL);
  site.robots = {};
  assign(site.robots, 'profile', firstValue(env, 'VITE_SITE_PROFILE', 'VITE_ANALYTICS_ENVIRONMENT'));
  assign(site.robots, 'index', parseBoolean(env.VITE_ROBOTS_INDEX, 'VITE_ROBOTS_INDEX', diagnostics));
  return site;
};

const readConsentOverrides = (env, diagnostics) => {
  const consent = {};
  assign(consent, 'required', parseBoolean(
    env.VITE_ANALYTICS_CONSENT_REQUIRED,
    'VITE_ANALYTICS_CONSENT_REQUIRED',
    diagnostics,
  ));
  assign(consent, 'storageKey', env.VITE_ANALYTICS_STORAGE_KEY);
  assign(consent, 'policyVersion', env.VITE_ANALYTICS_CONSENT_POLICY_VERSION);
  assign(consent, 'privacyPagePath', env.VITE_ANALYTICS_PRIVACY_PAGE_PATH);
  return consent;
};

const readAnalyticsOverrides = (env, diagnostics) => {
  const analytics = { consent: readConsentOverrides(env, diagnostics) };
  assign(analytics, 'enabled', parseBoolean(
    env.VITE_ANALYTICS_ENABLED,
    'VITE_ANALYTICS_ENABLED',
    diagnostics,
  ));
  assign(analytics, 'environment', env.VITE_ANALYTICS_ENVIRONMENT);
  assign(analytics, 'allowedHosts', parseHosts(env.VITE_ANALYTICS_ALLOWED_HOSTS));
  assign(analytics, 'ga4MeasurementId', firstValue(
    env,
    'VITE_ANALYTICS_GA4_MEASUREMENT_ID',
    'VITE_GA4_MEASUREMENT_ID',
  ));
  assign(analytics, 'clarityProjectId', firstValue(
    env,
    'VITE_ANALYTICS_CLARITY_PROJECT_ID',
    'VITE_CLARITY_PROJECT_ID',
  ));
  return analytics;
};

export const readEnvironmentOverrides = (env = {}) => {
  const diagnostics = [];
  const overrides = readSiteOverrides(env, diagnostics);
  overrides.analytics = readAnalyticsOverrides(env, diagnostics);
  return { diagnostics, overrides };
};
