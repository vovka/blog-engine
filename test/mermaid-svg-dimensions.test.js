import assert from 'node:assert/strict';
import test from 'node:test';
import {
  InvalidMermaidViewBoxError,
  normalizeMermaidSvgDimensions,
} from '../bin/mermaid/svgDimensions.js';

test('derives explicit dimensions without changing the viewBox or content', () => {
  const content = '<g id="content"><text>unchanged</text></g>';
  const source = [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-10.5 2 320.25 180">',
    content,
    '</svg>',
  ].join('');
  const normalized = normalizeMermaidSvgDimensions(source);

  assert.match(normalized, /<svg\b[^>]*\bwidth="320\.25"/);
  assert.match(normalized, /<svg\b[^>]*\bheight="180"/);
  assert.match(normalized, /viewBox="-10\.5 2 320\.25 180"/);
  assert.match(normalized, new RegExp(content));
});

test('replaces non-numeric root dimensions and is deterministic', () => {
  const source = [
    '<svg width="100%" height="auto" viewBox="0 0 640 360" preserveAspectRatio="xMidYMid meet">',
    '<path d="M0 0h1v1z"/>',
    '</svg>',
  ].join('');
  const first = normalizeMermaidSvgDimensions(source);
  const repeated = normalizeMermaidSvgDimensions(source);

  assert.equal(repeated, first);
  assert.equal(normalizeMermaidSvgDimensions(first), first);
  assert.doesNotMatch(first, /width="100%"|height="auto"/);
  assert.match(first, /\bwidth="640"/);
  assert.match(first, /\bheight="360"/);
  assert.match(first, /preserveAspectRatio="xMidYMid meet"/);
  assert.match(first, /<path d="M0 0h1v1z"\/>/);
});

for (const [name, source] of [
  ['missing', '<svg><path/></svg>'],
  ['malformed', '<svg viewBox="0 0 wide 100"><path/></svg>'],
  ['incomplete', '<svg viewBox="0 0 100"><path/></svg>'],
  ['non-finite', '<svg viewBox="0 0 1e999 100"><path/></svg>'],
  ['zero width', '<svg viewBox="0 0 0 100"><path/></svg>'],
  ['zero height', '<svg viewBox="0 0 100 0"><path/></svg>'],
  ['negative width', '<svg viewBox="0 0 -1 100"><path/></svg>'],
  ['negative height', '<svg viewBox="0 0 100 -1"><path/></svg>'],
]) {
  test(`fails closed for ${name} viewBox`, () => {
    assert.throws(
      () => normalizeMermaidSvgDimensions(source),
      InvalidMermaidViewBoxError,
    );
  });
}
