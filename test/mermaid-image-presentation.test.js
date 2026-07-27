import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const markdownImage = readFileSync(
  new URL('../src/components/blog/MarkdownImage.jsx', import.meta.url),
  'utf8',
);
const appCss = readFileSync(new URL('../src/App.css', import.meta.url), 'utf8');

test('ordinary Markdown images delegate to the lightbox renderer', () => {
  assert.match(markdownImage, /import ZoomableImage from '\.\/ZoomableImage';/);
  assert.match(markdownImage, /return <ZoomableImage src=\{src\}/);
});

test('Mermaid assets preserve their presentation class in the lightbox renderer', () => {
  assert.match(markdownImage, /isMermaidAssetUrl\(src\) \? 'mermaid-diagram' : ''/);
  assert.match(markdownImage, /className=\{classes \|\| undefined\}/);
  assert.doesNotMatch(markdownImage, /<(?:div|figure|section)\b/i);
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
