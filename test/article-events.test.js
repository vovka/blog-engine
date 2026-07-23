import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getOutboundUrl,
  getReachedMilestones,
  sanitizeOutboundUrl,
} from '../src/utils/articleEvents.js';

test('returns each newly reached article scroll milestone', () => {
  const tracked = new Set([25]);
  assert.deepEqual(getReachedMilestones(76, tracked), [50, 75]);
});

test('recognizes external HTTP links only', () => {
  const external = { closest: () => ({ href: 'https://example.com/reference' }) };
  const internal = { closest: () => ({ href: 'https://blog.example/post' }) };
  assert.equal(getOutboundUrl(external, 'https://blog.example').hostname, 'example.com');
  assert.equal(getOutboundUrl(internal, 'https://blog.example'), null);
});

test('strips query parameters and fragments from outbound analytics URLs', () => {
  const url = new URL('https://example.com/reference?token=secret#section');
  assert.equal(sanitizeOutboundUrl(url), 'https://example.com/reference');
});
