import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { createContentAliases } from '../src/content/createContentAliases.js';

test('uses empty content until generated modules exist', t => {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'geek-blog-content-'));
  t.after(() => fs.rmSync(projectRoot, { recursive: true }));
  const engineRoot = path.resolve('.');
  const fallback = path.join(engineRoot, 'src', 'content', 'empty.js');
  assert.equal(createContentAliases(projectRoot, engineRoot)['@content/posts'], fallback);

  fs.mkdirSync(path.join(projectRoot, 'content'));
  fs.writeFileSync(path.join(projectRoot, 'content', 'posts.js'), 'export const posts = [];');
  assert.equal(
    createContentAliases(projectRoot, engineRoot)['@content/posts'],
    path.join(projectRoot, 'content', 'posts.js'),
  );
});
