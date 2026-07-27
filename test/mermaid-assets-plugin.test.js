import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  isMermaidAssetName,
  mermaidAssetsPlugin,
} from '../src/vite/mermaidAssetsPlugin.js';

const hashName = `${'a'.repeat(64)}.svg`;
const createProject = t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'geek-blog-assets-'));
  const assets = path.join(root, '.geek-blog', 'mermaid');
  fs.mkdirSync(assets, { recursive: true });
  fs.writeFileSync(path.join(assets, hashName), '<svg/>');
  fs.writeFileSync(path.join(assets, 'secret.svg'), 'secret');
  fs.writeFileSync(path.join(root, '.geek-blog', 'private.json'), '{"token":"no"}');
  t.after(() => fs.rmSync(root, { force: true, recursive: true }));
  return root;
};

const response = () => ({
  headers: {},
  setHeader(name, value) { this.headers[name] = value; },
  end() { this.ended = true; },
});

const middlewareFor = (root, basePath = '/') => {
  let middleware;
  mermaidAssetsPlugin(root, basePath).configureServer({
    middlewares: { use: value => { middleware = value; } },
  });
  return middleware;
};

test('accepts only lowercase SHA-256 SVG names', () => {
  assert.equal(isMermaidAssetName(hashName), true);
  for (const name of [
    `${'A'.repeat(64)}.svg`,
    `${'a'.repeat(63)}.svg`,
    `${'a'.repeat(64)}.png`,
    `../${hashName}`,
    `nested/${hashName}`,
    'secret.svg',
  ]) {
    assert.equal(isMermaidAssetName(name), false, name);
  }
});

test('serves valid base-path assets with safe headers', t => {
  const nextCalls = [];
  const reply = response();
  middlewareFor(createProject(t), '/blog')(
    { method: 'HEAD', url: `/blog/mermaid/${hashName}?cache=1` },
    reply,
    () => nextCalls.push(true),
  );

  assert.equal(reply.statusCode, 200);
  assert.equal(reply.headers['Content-Type'], 'image/svg+xml');
  assert.equal(reply.headers['X-Content-Type-Options'], 'nosniff');
  assert.equal(reply.ended, true);
  assert.deepEqual(nextCalls, []);
});

test('rejects traversal, malformed names, and unsupported methods', t => {
  const middleware = middlewareFor(createProject(t), '/blog');
  for (const request of [
    { method: 'GET', url: '/blog/mermaid/../private.json' },
    { method: 'GET', url: '/blog/mermaid/%2e%2e/private.json' },
    { method: 'GET', url: '/blog/mermaid/secret.svg' },
    { method: 'POST', url: `/blog/mermaid/${hashName}` },
  ]) {
    const reply = response();
    middleware(request, reply, () => assert.fail(`unexpected next() for ${request.url}`));
    assert.equal(reply.statusCode, 404);
    assert.equal(reply.ended, true);
  }
});

test('passes unrelated requests through and copies only hash-named assets', t => {
  const root = createProject(t);
  let passed = 0;
  middlewareFor(root, '/blog')(
    { method: 'GET', url: '/blog/about' },
    response(),
    () => { passed += 1; },
  );
  mermaidAssetsPlugin(root, '/blog').closeBundle();

  assert.equal(passed, 1);
  assert.deepEqual(fs.readdirSync(path.join(root, 'dist', 'mermaid')), [hashName]);
  assert.equal(fs.readFileSync(path.join(root, 'dist', 'mermaid', hashName), 'utf8'), '<svg/>');
});
