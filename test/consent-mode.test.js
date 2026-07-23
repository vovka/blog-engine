import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import {
  deniedConsent,
  setGoogleConsentDefault,
  updateClarityConsent,
  updateGoogleConsent,
} from '../src/utils/consentMode.js';

const config = {
  enabled: true,
  allowedHosts: ['localhost'],
  ga4MeasurementId: 'G-TEST123',
};

afterEach(() => {
  delete global.window;
});

test('sets Consent Mode v2 defaults before provider initialization', () => {
  global.window = { location: { hostname: 'localhost' } };
  setGoogleConsentDefault(config);
  const command = Array.from(window.dataLayer[0]);
  assert.deepEqual(command, ['consent', 'default', deniedConsent]);
});

test('updates all Consent Mode fields and GA disable state', () => {
  global.window = { location: { hostname: 'localhost' } };
  updateGoogleConsent(config, true);
  assert.equal(window['ga-disable-G-TEST123'], false);
  assert.equal(Array.from(window.dataLayer[0])[2].analytics_storage, 'granted');
  assert.equal(Array.from(window.dataLayer[0])[2].ad_user_data, 'denied');
  updateGoogleConsent(config, false);
  assert.equal(window['ga-disable-G-TEST123'], true);
  assert.equal(Array.from(window.dataLayer[1])[2].analytics_storage, 'denied');
});

test('updates Clarity consent with the documented field casing', () => {
  const calls = [];
  global.window = { clarity: (...args) => calls.push(args) };
  updateClarityConsent(true);
  updateClarityConsent(false);
  assert.deepEqual(calls[0], ['start']);
  assert.deepEqual(calls[1], ['consentv2', {
    ad_Storage: 'denied',
    analytics_Storage: 'granted',
  }]);
  assert.equal(calls[2][1].analytics_Storage, 'denied');
  assert.deepEqual(calls[3], ['stop']);
});
