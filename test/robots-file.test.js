import assert from 'node:assert/strict';
import test from 'node:test';
import { buildRobots } from '../bin/generate-robots.js';

test('denies crawling without deployment configuration', () => {
  assert.equal(buildRobots(), 'User-agent: *\nDisallow: /\n');
});

test('publishes an absolute sitemap only when indexing is enabled', () => {
  assert.equal(
    buildRobots({ index: true, siteUrl: 'https://blog.example/base' }),
    'User-agent: *\nAllow: /\nSitemap: https://blog.example/sitemap.xml\n',
  );
});
