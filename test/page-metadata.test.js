import assert from 'node:assert/strict';
import test from 'node:test';
import { buildCanonicalPath, buildCanonicalUrl } from '../src/utils/pageMetadata.js';

test('joins base paths without duplicate slashes', () => {
  assert.equal(buildCanonicalPath('/post/', '/blog/'), '/blog/post');
});

test('uses configured site URL instead of the current host', () => {
  const url = buildCanonicalUrl('/post', {
    siteUrl: 'https://blog.example',
    basePath: '/',
  }, 'http://localhost:3000');
  assert.equal(url, 'https://blog.example/post');
});
