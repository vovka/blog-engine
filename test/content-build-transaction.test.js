import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { ContentBuildTransaction } from '../bin/content/ContentBuildTransaction.js';

const generated = {
  'content/posts.js': 'new posts',
  'content/pages.js': 'new pages',
  'content/metadata.js': 'new metadata',
  'public/robots.txt': 'User-agent: *\nDisallow: /\n',
  'public/sitemap.xml': '<urlset>new</urlset>',
};

const createProject = t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'geek-blog-transaction-'));
  const mermaid = path.join(root, '.geek-blog', 'mermaid');
  fs.mkdirSync(mermaid, { recursive: true });
  fs.mkdirSync(path.join(root, 'content'), { recursive: true });
  fs.writeFileSync(path.join(mermaid, 'old.svg'), 'old asset');
  for (const name of ['posts.js', 'pages.js', 'metadata.js']) {
    fs.writeFileSync(path.join(root, 'content', name), `old ${name}`);
  }
  fs.mkdirSync(path.join(root, 'public'));
  fs.writeFileSync(path.join(root, 'public', 'robots.txt'), 'old robots');
  fs.writeFileSync(path.join(root, 'public', 'sitemap.xml'), 'old sitemap');
  t.after(() => fs.rmSync(root, { force: true, recursive: true }));
  return root;
};

const stageAssets = root => {
  const stage = path.join(root, '.geek-blog', 'mermaid-stage');
  fs.mkdirSync(stage, { recursive: true });
  fs.writeFileSync(path.join(stage, 'new.svg'), 'new asset');
  return stage;
};

test('promotes content, Mermaid assets, robots, and sitemap together', async t => {
  const root = createProject(t);

  await new ContentBuildTransaction(root).commit(stageAssets(root), generated);

  assert.deepEqual(fs.readdirSync(path.join(root, '.geek-blog', 'mermaid')), ['new.svg']);
  for (const [relative, content] of Object.entries(generated)) {
    assert.equal(fs.readFileSync(path.join(root, relative), 'utf8'), content);
  }
});

test('restores content, assets, robots, and sitemap when a later promotion fails', async t => {
  const root = createProject(t);
  fs.writeFileSync(path.join(root, 'blocked'), 'blocked sentinel');

  await assert.rejects(
    new ContentBuildTransaction(root).commit(stageAssets(root), {
      ...generated,
      'blocked/output.txt': 'must fail',
    }),
    /EEXIST|ENOTDIR/,
  );

  assert.equal(fs.readFileSync(path.join(root, '.geek-blog', 'mermaid', 'old.svg'), 'utf8'), 'old asset');
  for (const name of ['posts.js', 'pages.js', 'metadata.js']) {
    assert.equal(fs.readFileSync(path.join(root, 'content', name), 'utf8'), `old ${name}`);
  }
  assert.equal(fs.readFileSync(path.join(root, 'public', 'robots.txt'), 'utf8'), 'old robots');
  assert.equal(fs.readFileSync(path.join(root, 'public', 'sitemap.xml'), 'utf8'), 'old sitemap');
  assert.equal(fs.readFileSync(path.join(root, 'blocked'), 'utf8'), 'blocked sentinel');
});

test('leaves an existing sitemap untouched when no replacement is generated', async t => {
  const root = createProject(t);
  const robotsOnly = { ...generated };
  delete robotsOnly['public/sitemap.xml'];

  await new ContentBuildTransaction(root).commit(stageAssets(root), robotsOnly);

  assert.equal(fs.readFileSync(path.join(root, 'public', 'robots.txt'), 'utf8'), generated['public/robots.txt']);
  assert.equal(fs.readFileSync(path.join(root, 'public', 'sitemap.xml'), 'utf8'), 'old sitemap');
});
