import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ReactMarkdown from 'react-markdown';
import react from '@vitejs/plugin-react';
import { createServer } from 'vite';
import {
  calculateFitZoom,
  calculatePointerAnchor,
  calculatePointerScrollDelta,
  findFocusWrapTarget,
  getLightboxKeyAction,
} from '../src/components/blog/imageLightboxUtils.js';

test('fits oversized images but keeps small images at natural size', () => {
  const viewport = { innerWidth: 1048, innerHeight: 720 };

  assert.equal(calculateFitZoom(500, 300, viewport), 1);
  assert.equal(calculateFitZoom(2000, 1200, viewport), 0.5);
});

test('keeps the same image point under the pointer after zoom', () => {
  const anchor = calculatePointerAnchor(300, 250, {
    left: 100,
    top: 100,
    width: 400,
    height: 300,
  });
  const delta = calculatePointerScrollDelta(300, 250, anchor, {
    left: 40,
    top: 20,
    width: 800,
    height: 600,
  });

  assert.deepEqual(anchor, { x: 0.5, y: 0.5 });
  assert.deepEqual(delta, { left: 140, top: 70 });
});

test('wraps focus at both modal boundaries and when focus escapes', () => {
  const first = {};
  const middle = {};
  const last = {};
  const focusable = [first, middle, last];

  assert.equal(findFocusWrapTarget({ shiftKey: true }, focusable, first, true), last);
  assert.equal(findFocusWrapTarget({ shiftKey: false }, focusable, last, true), first);
  assert.equal(findFocusWrapTarget({ shiftKey: false }, focusable, middle, true), null);
  assert.equal(findFocusWrapTarget({ shiftKey: false }, focusable, {}, false), first);
});

test('handles only unmodified zoom shortcuts outside editable controls', () => {
  assert.equal(getLightboxKeyAction({ key: '+', ctrlKey: false }, false), 'zoom-in');
  assert.equal(getLightboxKeyAction({ key: '0', ctrlKey: false }, false), 'fit');
  assert.equal(getLightboxKeyAction({ key: '-', ctrlKey: true }, false), null);
  assert.equal(getLightboxKeyAction({ key: '=', metaKey: true }, false), null);
  assert.equal(getLightboxKeyAction({ key: '1' }, true), null);
  assert.equal(getLightboxKeyAction({ key: 'Escape', ctrlKey: true }, true), 'close');
});

test('keeps linked Markdown images as links and standalone images as lightbox triggers', async t => {
  const vite = await createServer({
    appType: 'custom',
    configFile: false,
    optimizeDeps: { noDiscovery: true },
    plugins: [react()],
    server: { middlewareMode: true },
  });
  t.after(() => vite.close());

  const { markdownComponents } = await vite.ssrLoadModule('/src/components/blog/markdownConfig.js');
  const standalone = renderMarkdown('![Diagram](/diagram.svg)', markdownComponents);
  const linked = renderMarkdown('[![Diagram](/diagram.svg)](/original.svg)', markdownComponents);

  assert.match(standalone, /role="button"/);
  assert.match(standalone, /Open full-size viewer/);
  assert.match(linked, /<a href="\/original\.svg"><img src="\/diagram\.svg" alt="Diagram"\/><\/a>/);
  assert.doesNotMatch(linked, /role="button"/);
});

function renderMarkdown(markdown, components) {
  return renderToStaticMarkup(createElement(ReactMarkdown, { components }, markdown));
}
