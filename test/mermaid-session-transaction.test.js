import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { MermaidBuildSession } from '../bin/mermaid/MermaidBuildSession.js';

const diagram = '```mermaid\nflowchart LR\nA --> B\n```';
const safeSvg = value => Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 50"><text>${value}</text></svg>`,
);
const temporaryRoot = t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'geek-blog-mermaid-'));
  t.after(() => fs.rmSync(root, { force: true, recursive: true }));
  return root;
};

const createSession = (projectRoot, overrides = {}) => new MermaidBuildSession({
  projectRoot,
  basePath: '/',
  launchBrowser: () => ({ close: async () => {} }),
  renderer: async (_browser, _definition, _format, options) => ({
    data: safeSvg(options.svgId),
    title: null,
    desc: null,
  }),
  ...overrides,
});

test('uses the article fallback and produces deterministic names and bytes', async t => {
  const root = temporaryRoot(t);
  const first = createSession(root);
  const firstOutput = await first.transform({
    markdown: diagram,
    sourcePath: 'content/posts/article.md',
    title: 'Article',
  });
  const firstStage = await first.prepareForCommit();
  const [firstName] = fs.readdirSync(firstStage);
  const firstBytes = fs.readFileSync(path.join(firstStage, firstName));
  await first.abort();

  const second = createSession(root);
  t.after(() => second.abort());
  const secondOutput = await second.transform({
    markdown: diagram,
    sourcePath: 'content/posts/article.md',
    title: 'Article',
  });
  const secondStage = await second.prepareForCommit();
  const [secondName] = fs.readdirSync(secondStage);

  assert.match(firstOutput, /^!\[Article — diagram 1\]\(\/mermaid\/[a-f0-9]{64}\.svg\)$/);
  assert.equal(secondOutput, firstOutput);
  assert.equal(secondName, firstName);
  assert.deepEqual(fs.readFileSync(path.join(secondStage, secondName)), firstBytes);
});

test('abort removes staging, closes the browser, and preserves live assets', async t => {
  const root = temporaryRoot(t);
  const live = path.join(root, '.geek-blog', 'mermaid');
  fs.mkdirSync(live, { recursive: true });
  fs.writeFileSync(path.join(live, 'old.svg'), 'known good');
  let closes = 0;
  const session = createSession(root, {
    launchBrowser: () => ({ close: async () => { closes += 1; } }),
  });

  await session.transform({ markdown: diagram, sourcePath: 'content/posts/article.md', title: 'Article' });
  const staging = await session.prepareForCommit();
  assert.equal(fs.existsSync(staging), true);
  await session.abort();

  assert.equal(fs.existsSync(staging), false);
  assert.equal(fs.readFileSync(path.join(live, 'old.svg'), 'utf8'), 'known good');
  assert.equal(closes, 1);
});

test('reports relative source, ordinal, line, and renderer detail', async t => {
  const session = createSession(temporaryRoot(t), {
    renderer: async () => { throw new Error('Parse error near BAD'); },
  });
  t.after(() => session.abort());

  await assert.rejects(
    session.transform({
      markdown: `Introduction\n\n${diagram}`,
      sourcePath: 'content/pages/about.md',
      title: 'About',
    }),
    /content\/pages\/about\.md, diagram 1, line 3: Parse error near BAD/,
  );
});
