import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { MermaidBuildSession } from '../bin/mermaid/MermaidBuildSession.js';

const enabled = process.env.GEEK_BLOG_REAL_MERMAID_TESTS === '1';
const fixture = new URL('./fixtures/six-diagrams.md', import.meta.url);
const imagePattern = /!\[[^\]]+\]\(\/mermaid\/([a-f0-9]{64})\.svg\)/g;
const readAssets = directory => new Map(
  fs.readdirSync(directory)
    .filter(name => /^[a-f0-9]{64}\.svg$/.test(name))
    .map(name => [name, fs.readFileSync(path.join(directory, name), 'utf8')]),
);

const assertPassiveSvg = svg => {
  assert.match(svg, /^<svg\b[^>]*\bviewBox="[^"]+"/);
  assert.match(svg, /^<svg\b[^>]*\bwidth="(?:\d+(?:\.\d*)?|\.\d+)"/);
  assert.match(svg, /^<svg\b[^>]*\bheight="(?:\d+(?:\.\d*)?|\.\d+)"/);
  assert.doesNotMatch(svg, /<(?:script|foreignObject|iframe|object|embed|a)\b/i);
  assert.doesNotMatch(svg, /\son[a-z]+\s*=/i);
  assert.doesNotMatch(svg, /\s(?:href|xlink:href|src)=["'](?:javascript:|file:|https?:|\/\/)/i);
  assert.doesNotMatch(svg, /@import\b/i);
};

const unsafeInit = {
  securityLevel: 'loose',
  themeCSS: '@import url(https://evil.example/x.css)',
  flowchart: { htmlLabels: true },
};
const unsafeDefinition = [
  '```mermaid',
  `%%{init: ${JSON.stringify(unsafeInit)}}%%`,
  'flowchart LR',
  '    A["<img src=x onerror=alert(1)>"] --> B["<script>alert(1)</script>"]',
  '    click A "javascript:alert(1)"',
  '    click B "file:///etc/passwd"',
  '```',
].join('\n');

test('real Mermaid CLI renders the six-flowchart fixture deterministically and safely', {
  skip: !enabled && 'set GEEK_BLOG_REAL_MERMAID_TESTS=1 to launch Chromium',
  timeout: 120_000,
}, async t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'geek-blog-real-mermaid-'));
  const source = fs.readFileSync(fixture, 'utf8');
  t.after(() => fs.rmSync(root, { force: true, recursive: true }));

  const first = new MermaidBuildSession({ projectRoot: root, basePath: '/' });
  t.after(() => first.abort());
  const transformed = await first.transform({
    markdown: source,
    sourcePath: 'content/posts/human-governed-ai-sdlc.md',
    title: 'The Human-Governed AI Software Development Lifecycle',
  });
  const firstStage = await first.prepareForCommit();
  const firstAssets = readAssets(firstStage);

  assert.equal([...transformed.matchAll(imagePattern)].length, 6);
  assert.doesNotMatch(transformed, /```mermaid/);
  assert.match(transformed, /!\[Twelve stages move from customer conversation/);
  assert.equal(firstAssets.size, 6);
  for (const svg of firstAssets.values()) assertPassiveSvg(svg);
  assert.equal(fs.readFileSync(fixture, 'utf8'), source);

  const unsafeOutput = await first.transform({
    markdown: unsafeDefinition,
    sourcePath: 'content/posts/security.md',
    title: 'Security',
  });
  assert.match(unsafeOutput, imagePattern);
  for (const svg of readAssets(firstStage).values()) assertPassiveSvg(svg);
  const assetCount = readAssets(firstStage).size;
  await assert.rejects(first.transform({
    markdown: '```mermaid\nflowchart LR\nA[unterminated\n```',
    sourcePath: 'content/pages/broken.md',
    title: 'Broken',
  }), /content\/pages\/broken\.md, diagram 1, line 1:/);
  assert.equal(readAssets(firstStage).size, assetCount);
  await first.abort();

  const second = new MermaidBuildSession({ projectRoot: root, basePath: '/' });
  t.after(() => second.abort());
  const repeated = await second.transform({
    markdown: source,
    sourcePath: 'content/posts/human-governed-ai-sdlc.md',
    title: 'The Human-Governed AI Software Development Lifecycle',
  });
  const secondAssets = readAssets(await second.prepareForCommit());

  assert.equal(repeated, transformed);
  assert.deepEqual(secondAssets, firstAssets);
});
