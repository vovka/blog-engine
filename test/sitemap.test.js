import assert from 'node:assert/strict';
import test from 'node:test';
import { buildSitemap } from '../bin/generate-sitemap.js';

test('generates canonical URLs for root, pages, and posts', () => {
  const sitemap = buildSitemap({
    siteUrl: 'https://blog.example',
    basePath: '/notes',
    pages: [{ slug: 'about' }],
    posts: [{ slug: 'hello-world', date: '2026-07-23' }],
  });
  assert.match(sitemap, /<loc>https:\/\/blog\.example\/notes<\/loc>/);
  assert.match(sitemap, /<loc>https:\/\/blog\.example\/notes\/about<\/loc>/);
  assert.match(sitemap, /<loc>https:\/\/blog\.example\/notes\/hello-world<\/loc>/);
  assert.match(sitemap, /<lastmod>2026-07-23<\/lastmod>/);
});
