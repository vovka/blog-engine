import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { processContent } from '../bin/process-content.js';
import { MermaidBuildSession } from '../bin/mermaid/MermaidBuildSession.js';

const createProject = (t, page = 'A plain page.') => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'geek-blog-atomic-'));
  fs.mkdirSync(path.join(root, 'content', 'posts'), { recursive: true });
  fs.mkdirSync(path.join(root, 'content', 'pages'), { recursive: true });
  fs.mkdirSync(path.join(root, '.geek-blog', 'mermaid'), { recursive: true });
  fs.writeFileSync(path.join(root, 'content', 'posts', 'post.md'), '---\ntitle: Post\n---\n\nPost body.');
  fs.writeFileSync(path.join(root, 'content', 'pages', 'page.md'), page);
  fs.writeFileSync(path.join(root, '.geek-blog', 'mermaid', 'old.svg'), 'known asset');
  for (const name of ['posts.js', 'pages.js', 'metadata.js']) {
    fs.writeFileSync(path.join(root, 'content', name), `known ${name}`);
  }
  t.after(() => fs.rmSync(root, { force: true, recursive: true }));
  return root;
};

const dependencies = {
  loadConfig: async () => ({ basePath: '/' }),
  generateDiscovery: async () => {},
};

test('a render failure preserves the previous generated content and assets', async t => {
  const root = createProject(t, '# Page\n\n```mermaid\nBAD\n```');
  let aborted = 0;
  let committed = 0;
  const session = {
    transform: async ({ sourcePath, markdown }) => {
      if (sourcePath.endsWith('page.md')) throw new Error('invalid Mermaid');
      return markdown;
    },
    close: async () => {},
    prepareForCommit: async () => '/unused',
    abort: async () => { aborted += 1; },
  };

  await assert.rejects(processContent(root, {
    ...dependencies,
    sessionFactory: () => session,
    transactionFactory: () => ({
      commit: async () => { committed += 1; },
    }),
  }), /invalid Mermaid/);

  assert.equal(aborted, 1);
  assert.equal(committed, 0);
  assert.equal(fs.readFileSync(path.join(root, '.geek-blog', 'mermaid', 'old.svg'), 'utf8'), 'known asset');
  for (const name of ['posts.js', 'pages.js', 'metadata.js']) {
    assert.equal(fs.readFileSync(path.join(root, 'content', name), 'utf8'), `known ${name}`);
  }
});

test('a successful no-Mermaid build removes obsolete assets without a browser', async t => {
  const root = createProject(t);
  let launches = 0;
  const sessionFactory = options => new MermaidBuildSession({
    ...options,
    launchBrowser: () => {
      launches += 1;
      return { close: async () => {} };
    },
  });

  await processContent(root, { ...dependencies, sessionFactory });

  assert.equal(launches, 0);
  assert.deepEqual(fs.readdirSync(path.join(root, '.geek-blog', 'mermaid')), []);
  assert.match(fs.readFileSync(path.join(root, 'content', 'posts.js'), 'utf8'), /Post body/);
  assert.match(fs.readFileSync(path.join(root, 'content', 'pages.js'), 'utf8'), /A plain page/);
});
