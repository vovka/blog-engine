import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import readingTime from 'reading-time';
import { processContent } from '../bin/process-content.js';

const postMarkdown = `---
title: Dialogue post
date: 2026-07-24
layout: dialogue
---

Introduction before the diagram.

:::dialogue
:::primary
\`\`\`mermaid
flowchart LR
A --> B
\`\`\`
:::
:::opponent
Ordinary **opponent** text.
:::
:::

Conclusion after the diagram.
`;

const pageMarkdown = `# Architecture

Before.

\`\`\`mermaid
flowchart TD
UI --> API
\`\`\`

After.
`;

const createProject = t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'geek-blog-content-'));
  fs.mkdirSync(path.join(root, 'content', 'posts'), { recursive: true });
  fs.mkdirSync(path.join(root, 'content', 'pages'), { recursive: true });
  fs.writeFileSync(path.join(root, 'content', 'posts', 'dialogue.md'), postMarkdown);
  fs.writeFileSync(path.join(root, 'content', 'pages', 'architecture.md'), pageMarkdown);
  t.after(() => fs.rmSync(root, { force: true, recursive: true }));
  return root;
};

const transformMermaid = markdown => markdown.replace(
  /```mermaid[\s\S]*?```/,
  '![Rendered diagram](/notes/mermaid/hash.svg)',
);

test('processes posts, pages, and dialogue Markdown entirely in memory', async t => {
  const root = createProject(t);
  const calls = [];
  let committed;
  const session = {
    transform: async input => {
      calls.push(input);
      return transformMermaid(input.markdown);
    },
    close: async () => {},
    abort: async () => {},
    prepareForCommit: async () => '/staged/mermaid',
  };
  const result = await processContent(root, {
    loadConfig: async () => ({ basePath: '/notes' }),
    sessionFactory: options => {
      assert.deepEqual(options, { projectRoot: root, basePath: '/notes' });
      return session;
    },
    generateDiscovery: async () => ({
      'public/robots.txt': 'generated robots',
      'public/sitemap.xml': 'generated sitemap',
    }),
    transactionFactory: () => ({
      commit: async (mermaidStage, modules) => { committed = { mermaidStage, modules }; },
    }),
  });

  assert.equal(calls.length, 2);
  assert.match(result.posts[0].content, /:::dialogue[\s\S]*!\[Rendered diagram]/);
  assert.match(result.posts[0].content, /Ordinary \*\*opponent\*\* text/);
  assert.match(result.posts[0].content, /Conclusion after the diagram/);
  assert.match(result.pages[0].content, /Before\.[\s\S]*!\[Rendered diagram][\s\S]*After\./);
  const originalBody = postMarkdown.slice(postMarkdown.indexOf('\n\n') + 2);
  assert.equal(result.posts[0].readingTime, readingTime(originalBody).text);
  assert.equal(committed.mermaidStage, '/staged/mermaid');
  assert.match(committed.modules['content/posts.js'], /Rendered diagram/);
  assert.match(committed.modules['content/pages.js'], /Rendered diagram/);
  assert.match(committed.modules['content/metadata.js'], /Architecture/);
  assert.equal(committed.modules['public/robots.txt'], 'generated robots');
  assert.equal(committed.modules['public/sitemap.xml'], 'generated sitemap');
});
