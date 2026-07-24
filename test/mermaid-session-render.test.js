import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { MermaidBuildSession } from '../bin/mermaid/MermaidBuildSession.js';

const safeSvg = id => Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 50"><g id="${id}"/></svg>`,
);
const fence = definition => `\`\`\`mermaid\n${definition}\n\`\`\``;
const temporaryRoot = t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'geek-blog-mermaid-'));
  t.after(() => fs.rmSync(root, { force: true, recursive: true }));
  return root;
};

test('keeps the no-Mermaid path browser-free', async t => {
  let launches = 0;
  const session = new MermaidBuildSession({
    projectRoot: temporaryRoot(t),
    basePath: '/',
    launchBrowser: () => { launches += 1; },
  });
  t.after(() => session.abort());

  assert.equal(await session.transform({
    markdown: 'Ordinary **Markdown**.',
    sourcePath: 'content/posts/plain.md',
    title: 'Plain',
  }), 'Ordinary **Markdown**.');
  assert.equal(launches, 0);
});

test('shares one browser, deduplicates definitions, and builds base-path URLs', async t => {
  const browser = { close: async () => {} };
  const calls = [];
  let launches = 0;
  const session = new MermaidBuildSession({
    projectRoot: temporaryRoot(t),
    basePath: '/blog/',
    launchBrowser: () => {
      launches += 1;
      return browser;
    },
    renderer: async (...args) => {
      calls.push(args);
      return { data: safeSvg(args[3].svgId), title: 'Title', desc: 'Description' };
    },
  });
  t.after(() => session.abort());

  const output = await session.transform({
    markdown: `${fence('flowchart LR\nA --> B')}\n${fence('flowchart LR\nA --> B')}`,
    sourcePath: 'content/posts/two.md',
    title: 'Two',
  });
  const staging = await session.prepareForCommit();

  assert.equal(launches, 1);
  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], browser);
  assert.equal(calls[0][2], 'svg');
  assert.equal(calls[0][3].mermaidConfig.securityLevel, 'strict');
  assert.equal(calls[0][3].mermaidConfig.htmlLabels, false);
  assert.equal(fs.readdirSync(staging).length, 1);
  assert.equal(output.match(/!\[Description\]\(\/blog\/mermaid\/[a-f0-9]{64}\.svg\)/g)?.length, 2);
});

test('limits concurrent renderer pages to two', async t => {
  let active = 0;
  let maximum = 0;
  const session = new MermaidBuildSession({
    projectRoot: temporaryRoot(t),
    basePath: '/',
    launchBrowser: () => ({ close: async () => {} }),
    renderer: async (_browser, definition) => {
      active += 1;
      maximum = Math.max(maximum, active);
      await new Promise(resolve => setTimeout(resolve, 5));
      active -= 1;
      return { data: safeSvg(definition), title: null, desc: null };
    },
  });
  t.after(() => session.abort());
  const markdown = Array.from({ length: 6 }, (_, index) => fence(`flowchart LR\nA${index} --> B`)).join('\n');

  await session.transform({ markdown, sourcePath: 'content/posts/six.md', title: 'Six' });

  assert.equal(maximum, 2);
});
