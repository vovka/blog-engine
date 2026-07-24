import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const markdownImage = readFileSync(
  new URL('../src/components/blog/MarkdownImage.jsx', import.meta.url),
  'utf8',
);
const appCss = readFileSync(new URL('../src/App.css', import.meta.url), 'utf8');

test('ordinary Markdown images remain plain and unchanged', () => {
  const ordinaryBranch = markdownImage.slice(
    markdownImage.indexOf('if (!isMermaidAssetUrl(src))'),
    markdownImage.indexOf('const classes'),
  );
  assert.match(ordinaryBranch, /return <img src=\{src\}/);
  assert.match(ordinaryBranch, /className=\{className \|\| undefined\}/);
  assert.match(ordinaryBranch, /\{\.\.\.props\} \/>;/);
});

test('Mermaid assets remain plain images without scrolling semantics', () => {
  assert.match(markdownImage, /const classes = \[className, 'mermaid-diagram'\]/);
  assert.match(markdownImage, /return <img src=\{src\} className=\{classes\} \{\.\.\.props\} \/>;/);
  assert.doesNotMatch(markdownImage, /<(?:div|figure|section)\b/i);
  assert.doesNotMatch(markdownImage, /\b(?:role|tabIndex|tabindex|overflow)\b/);
});

test('Mermaid images fit their content container', () => {
  const rule = appCss.match(
    /\.blog-post-content\s+\.mermaid-diagram\s*,\s*\.static-page-content\s+\.mermaid-diagram\s*\{([^}]*)\}/s,
  );

  assert.ok(rule, 'expected the shared Mermaid presentation rule');
  assert.match(rule[1], /(?:^|;)\s*width:\s*100%\s*;/);
  assert.match(rule[1], /(?:^|;)\s*max-width:\s*100%\s*;/);
  assert.match(rule[1], /(?:^|;)\s*height:\s*auto\s*;/);
  assert.doesNotMatch(rule[1], /\boverflow(?:-x)?:/);
});
