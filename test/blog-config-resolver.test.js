import assert from 'node:assert/strict';
import test from 'node:test';
import {
  BlogConfigurationError,
  resolveBlogConfig,
  resolveBlogConfigResult,
} from '../src/config/resolveBlogConfig.js';

const validProduction = {
  VITE_SITE_URL: 'https://blog.example',
  VITE_SITE_PROFILE: 'production',
  VITE_ROBOTS_INDEX: 'true',
  VITE_ANALYTICS_ENABLED: 'true',
  VITE_ANALYTICS_ALLOWED_HOSTS: 'blog.example',
  VITE_ANALYTICS_GA4_MEASUREMENT_ID: 'G-ABC123',
};

test('applies defaults, instance config, then environment overrides', () => {
  const config = resolveBlogConfig(
    { title: 'Instance', author: 'Ada', analytics: { consent: { policyVersion: '7' } } },
    { ...validProduction, VITE_ANALYTICS_CONSENT_POLICY_VERSION: '8' },
    { strict: true },
  );
  assert.equal(config.title, 'Instance');
  assert.equal(config.author, 'Ada');
  assert.equal(config.siteUrl, 'https://blog.example');
  assert.equal(config.analytics.consent.policyVersion, '8');
});

test('keeps missing configuration private and analytics-disabled', () => {
  const config = resolveBlogConfig();
  assert.equal(config.analytics.enabled, false);
  assert.equal(config.robots.index, false);
  assert.equal(config.robots.profile, 'local');
});

test('supports legacy provider aliases', () => {
  const result = resolveBlogConfigResult({}, {
    ...validProduction,
    VITE_ANALYTICS_GA4_MEASUREMENT_ID: undefined,
    VITE_GA4_MEASUREMENT_ID: 'G-LEGACY123',
    VITE_CLARITY_PROJECT_ID: 'clarity123',
  });
  assert.equal(result.config.analytics.ga4MeasurementId, 'G-LEGACY123');
  assert.equal(result.config.analytics.clarityProjectId, 'clarity123');
});

test('ignores environment variables outside the whitelist', () => {
  const config = resolveBlogConfig({}, { BLOG_TITLE: 'Injected', VITE_UNKNOWN: 'ignored' });
  assert.equal(config.title, 'My Blog');
  assert.equal(config.VITE_UNKNOWN, undefined);
});

test('fails closed outside production with actionable diagnostics', () => {
  const warnings = [];
  const config = resolveBlogConfig({}, {
    VITE_ANALYTICS_ENABLED: 'true',
    VITE_ANALYTICS_ALLOWED_HOSTS: 'https://bad.example/path',
    VITE_ANALYTICS_GA4_MEASUREMENT_ID: 'bad',
  }, { warn: warning => warnings.push(warning) });
  assert.equal(config.analytics.enabled, false);
  assert.equal(config.robots.index, false);
  assert.match(warnings[0], /Invalid analytics host/);
});

test('production rejects malformed deployment configuration', () => {
  assert.throws(
    () => resolveBlogConfig({}, { ...validProduction, VITE_SITE_URL: 'not-a-url' }, { strict: true }),
    BlogConfigurationError,
  );
  assert.throws(
    () => resolveBlogConfig({}, { ...validProduction, VITE_ROBOTS_INDEX: 'maybe' }, { strict: true }),
    /VITE_ROBOTS_INDEX/,
  );
  assert.throws(
    () => resolveBlogConfig({}, { ...validProduction, VITE_ANALYTICS_GA4_MEASUREMENT_ID: '' }, { strict: true }),
    /provider ID/,
  );
});
