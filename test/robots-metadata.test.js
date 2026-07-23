import assert from 'node:assert/strict';
import test from 'node:test';
import { getRobotsConfig, resolveRobotsDirective } from '../src/utils/robotsMetadata.js';

test('keeps production profiles indexable by default', () => {
  assert.equal(resolveRobotsDirective({ profile: 'production' }), 'index,follow');
});

test('prevents indexing test profiles without affecting production defaults', () => {
  const config = { analytics: { environment: 'test' } };
  assert.deepEqual(getRobotsConfig(config), { profile: 'test', index: undefined });
  assert.equal(resolveRobotsDirective(getRobotsConfig(config)), 'noindex,nofollow');
});

test('honors explicit policy and route-level noindex', () => {
  assert.equal(resolveRobotsDirective({ profile: 'test', index: true }), 'index,follow');
  assert.equal(resolveRobotsDirective({ profile: 'production', index: false }), 'noindex,nofollow');
  assert.equal(resolveRobotsDirective({ routeNoindex: true, index: true }), 'noindex,nofollow');
});
