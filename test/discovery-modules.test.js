import assert from 'node:assert/strict';
import test from 'node:test';
import { createDiscoveryModules } from '../bin/content/discovery.js';

const posts = [{ slug: 'post', date: '2026-07-24' }];
const pages = [{ slug: 'about' }];

test('creates transactional robots and sitemap modules for configured sites', () => {
  const modules = createDiscoveryModules(posts, pages, {
    basePath: '/blog',
    siteUrl: 'https://blog.example',
    robots: { index: true },
  });

  assert.deepEqual(Object.keys(modules).sort(), [
    'public/robots.txt',
    'public/sitemap.xml',
  ]);
  assert.equal(
    modules['public/robots.txt'],
    'User-agent: *\nAllow: /\nSitemap: https://blog.example/sitemap.xml\n',
  );
  assert.match(modules['public/sitemap.xml'], /https:\/\/blog\.example\/blog\/about/);
  assert.match(modules['public/sitemap.xml'], /https:\/\/blog\.example\/blog\/post/);
});

test('keeps no-siteUrl behavior to robots-only and noindex by default', () => {
  const modules = createDiscoveryModules(posts, pages, {
    basePath: '/',
    robots: { index: false },
  });

  assert.deepEqual(modules, {
    'public/robots.txt': 'User-agent: *\nDisallow: /\n',
  });
});
