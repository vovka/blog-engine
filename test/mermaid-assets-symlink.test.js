import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { mermaidAssetsPlugin } from '../src/vite/mermaidAssetsPlugin.js';

test('rejects a hash-named development asset that is a symlink', t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'geek-blog-symlink-'));
  const assetDirectory = path.join(root, '.geek-blog', 'mermaid');
  const name = `${'b'.repeat(64)}.svg`;
  fs.mkdirSync(assetDirectory, { recursive: true });
  fs.writeFileSync(path.join(root, '.geek-blog', 'private.json'), '{"secret":true}');
  fs.symlinkSync('../private.json', path.join(assetDirectory, name));
  t.after(() => fs.rmSync(root, { force: true, recursive: true }));

  let middleware;
  mermaidAssetsPlugin(root).configureServer({
    middlewares: { use: value => { middleware = value; } },
  });
  const response = {
    headers: {},
    setHeader(key, value) { this.headers[key] = value; },
    end() { this.ended = true; },
  };
  middleware(
    { method: 'HEAD', url: `/mermaid/${name}` },
    response,
    () => assert.fail('symlinked asset must not pass through'),
  );

  assert.equal(response.statusCode, 404);
  assert.equal(response.ended, true);
  assert.deepEqual(response.headers, {});
});
