import assert from 'node:assert/strict';
import test from 'node:test';
import {
  hasValidClarityId,
  hasValidGa4Id,
  normalizeAnalyticsConfig,
} from '../src/utils/analyticsConfig.js';
import {
  getInitialConsent,
  getCookieDomains,
  resolveConsentUpdate,
  saveConsent,
} from '../src/utils/analyticsConsent.js';

test('normalizes analytics config with privacy-safe defaults', () => {
  const config = normalizeAnalyticsConfig();
  assert.equal(config.enabled, false);
  assert.equal(config.consent.required, true);
  assert.equal(config.consent.storageKey, 'blog.analyticsConsent');
  assert.deepEqual(config.allowedHosts, []);
});

test('validates provider identifiers', () => {
  assert.equal(hasValidGa4Id('G-ABC123'), true);
  assert.equal(hasValidGa4Id('G-YOUR-ID'), false);
  assert.equal(hasValidClarityId('abc123xyz'), true);
  assert.equal(hasValidClarityId('project id'), false);
});

test('initializes as accepted when an explicit choice is not required', () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value: { globalPrivacyControl: false },
  });
  assert.equal(getInitialConsent({ consent: { required: false } }), 'accepted');
  if (descriptor) Object.defineProperty(globalThis, 'navigator', descriptor);
  else delete globalThis.navigator;
});

test('saved and interactive acceptance cannot override Global Privacy Control', () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
  const storageDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value: { globalPrivacyControl: true },
  });
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: { getItem: () => JSON.stringify({ analytics: 'accepted', policyVersion: '1' }) },
  });
  globalThis.window = {};
  const config = { consent: { required: true, storageKey: 'consent', policyVersion: '1' } };
  assert.equal(getInitialConsent(config), 'rejected');
  assert.equal(resolveConsentUpdate('accepted'), 'rejected');
  if (descriptor) Object.defineProperty(globalThis, 'navigator', descriptor);
  else delete globalThis.navigator;
  if (storageDescriptor) Object.defineProperty(globalThis, 'localStorage', storageDescriptor);
  else delete globalThis.localStorage;
  delete globalThis.window;
});

test('does not crash when consent storage is unavailable', () => {
  const config = { consent: { storageKey: 'consent', policyVersion: '1' } };
  assert.equal(saveConsent(config, 'accepted'), false);
});

test('finds host and parent cookie domains without using a top-level domain', () => {
  assert.deepEqual(getCookieDomains('test.blog.shcherbyna.me'), [
    '.test.blog.shcherbyna.me',
    '.blog.shcherbyna.me',
    '.shcherbyna.me',
  ]);
  assert.deepEqual(getCookieDomains('localhost'), []);
});
