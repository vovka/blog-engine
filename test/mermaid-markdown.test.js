import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createMarkdownImage,
  findMermaidBlocks,
  replaceMermaidBlocks,
  selectAccessibleText,
} from '../bin/mermaid/markdown.js';

const markdown = [
  'Before.',
  '```mermaid',
  'flowchart LR',
  '  A --> B',
  '```',
  'Middle.',
  '```mermaid',
  'sequenceDiagram',
  '  A->>B: Hello',
  '```',
  'After.',
].join('\n');

test('finds exact Mermaid fences with source locations', () => {
  const blocks = findMermaidBlocks(markdown);

  assert.deepEqual(blocks.map(({ definition, startLine, ordinal }) => ({
    definition,
    startLine,
    ordinal,
  })), [
    { definition: 'flowchart LR\n  A --> B', startLine: 2, ordinal: 1 },
    { definition: 'sequenceDiagram\n  A->>B: Hello', startLine: 7, ordinal: 2 },
  ]);
  assert.ok(blocks.every(block => block.start < block.end));
});

test('leaves non-exact languages and unterminated fences untouched', () => {
  const source = [
    '```Mermaid',
    'A --> B',
    '```',
    '```mermaid extra',
    'B --> C',
    '```',
    '```mermaid',
    'C --> D',
  ].join('\n');

  assert.deepEqual(findMermaidBlocks(source), []);
  assert.equal(replaceMermaidBlocks(source, [], []), source);
});

test('replaces blocks while preserving all surrounding Markdown', () => {
  const blocks = findMermaidBlocks(markdown);
  const replacements = [
    '![First diagram](/mermaid/a.svg)',
    '![Second diagram](/mermaid/b.svg)',
  ];

  assert.equal(
    replaceMermaidBlocks(markdown, blocks, replacements),
    [
      'Before.',
      replacements[0],
      'Middle.',
      replacements[1],
      'After.',
    ].join('\n'),
  );
});

test('selects descriptions before titles and creates escaped images', () => {
  assert.equal(selectAccessibleText({
    desc: 'Diagram description',
    title: 'Diagram title',
    fallback: 'Fallback',
  }), 'Diagram description');
  assert.equal(selectAccessibleText({ title: 'Diagram title', fallback: 'Fallback' }), 'Diagram title');
  assert.equal(selectAccessibleText({ fallback: 'Article — diagram 1' }), 'Article — diagram 1');
  assert.equal(
    createMarkdownImage('Nodes [A] and B', '/blog/mermaid/a.svg'),
    '![Nodes \\[A\\] and B](/blog/mermaid/a.svg)',
  );
});
