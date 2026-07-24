import assert from 'node:assert/strict';
import test from 'node:test';
import {
  assertSafeMermaidSvg,
  sanitizeMermaidSvg,
  UnsafeMermaidSvgError,
} from '../bin/mermaid/svgSafety.js';

test('allows passive SVG with local fragment references', () => {
  const svg = [
    '<svg xmlns="http://www.w3.org/2000/svg">',
    '<defs><marker id="arrow"/></defs>',
    '<path marker-end="url(#arrow)"/>',
    '<use href="#shape"/>',
    '</svg>',
  ].join('');

  assert.doesNotThrow(() => assertSafeMermaidSvg(svg));
});

for (const [name, payload] of [
  ['scripts', '<svg><script>alert(1)</script></svg>'],
  ['active links', '<svg><a href="#safe"><text>link</text></a></svg>'],
  ['event attributes', '<svg><g onload="alert(1)"/></svg>'],
  ['JavaScript URLs', '<svg><use href="javascript:alert(1)"/></svg>'],
  ['file URLs', '<svg><image href="file:///etc/passwd"/></svg>'],
  ['external resources', '<svg><image href="https://evil.example/a.png"/></svg>'],
  ['protocol-relative resources', '<svg><image href="//evil.example/a.png"/></svg>'],
  ['CSS imports', '<svg><style>@import "https://evil.example/a.css";</style></svg>'],
  ['external CSS URLs', '<svg><style>g{fill:url(https://evil.example/a.svg)}</style></svg>'],
  ['foreign objects', '<svg><foreignObject><div>HTML</div></foreignObject></svg>'],
]) {
  test(`rejects ${name}`, () => {
    assert.throws(() => assertSafeMermaidSvg(payload), UnsafeMermaidSvgError);
  });
}

for (const [name, payload] of [
  ['CSS escape', '<svg><style>.x{fill:u\\72l(https://evil.example/a.svg)}</style></svg>'],
  ['CSS comment', '<svg><style>.x{fill:u/**/rl(https://evil.example/a.svg)}</style></svg>'],
  ['escaped CSS import', '<svg><style>@im\\70ort "https://evil.example/a.css";</style></svg>'],
  ['hex XML entity', '<svg><image href="&#x68;ttps://evil.example/a.png"/></svg>'],
  ['decimal XML entity', '<svg><image href="&#106;avascript:alert(1)"/></svg>'],
]) {
  test(`rejects a ${name} bypass`, () => {
    assert.throws(() => assertSafeMermaidSvg(payload), UnsafeMermaidSvgError);
  });
}

test('removes clickable class tokens without changing visible labels', () => {
  const source = [
    '<svg><a href="#safe">',
    '<g class="node clickable selected"><text>clickable label</text></g>',
    '</a></svg>',
  ].join('');
  const sanitized = sanitizeMermaidSvg(source);

  assert.doesNotMatch(sanitized, /<a\b/i);
  assert.doesNotMatch(sanitized, /class="[^"]*\bclickable\b/);
  assert.match(sanitized, />clickable label</);
  assert.doesNotThrow(() => assertSafeMermaidSvg(sanitized));
});
