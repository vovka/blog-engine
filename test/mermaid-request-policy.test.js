import assert from 'node:assert/strict';
import test from 'node:test';
import { DEFAULT_INTERCEPT_RESOLUTION_PRIORITY } from 'puppeteer';
import {
  installMermaidRequestPolicy,
  isAllowedMermaidRequestUrl,
  MERMAID_CLI_PAGE_URL,
} from '../bin/mermaid/MermaidRequestPolicy.js';

test('allows only passive schemes and the exact Mermaid CLI intercept origin', () => {
  for (const url of [
    MERMAID_CLI_PAGE_URL,
    'about:blank',
    'blob:null/1234',
    'data:text/css,body{}',
    'https://mermaid-cli-intercept.invalid/mermaid.esm.mjs',
  ]) {
    assert.equal(isAllowedMermaidRequestUrl(url), true, url);
  }
  for (const url of [
    'file:///etc/passwd',
    `${MERMAID_CLI_PAGE_URL}?changed=true`,
    'http://mermaid-cli-intercept.invalid/file.js',
    'https://example.com/file.js',
    'https://mermaid-cli-intercept.invalid.evil.example/file.js',
    'ftp://example.com/file.js',
    'not a URL',
  ]) {
    assert.equal(isAllowedMermaidRequestUrl(url), false, url);
  }
});

const fakeRequest = (url, handled = false) => {
  const calls = [];
  return {
    calls,
    url: () => url,
    isInterceptResolutionHandled: () => handled,
    continue: (...args) => calls.push(['continue', ...args]),
    abort: (...args) => calls.push(['abort', ...args]),
  };
};

test('uses cooperative resolution without preempting the CLI interceptor', async () => {
  const handlers = [];
  const interception = [];
  const page = {
    on: (event, handler) => handlers.push({ event, handler }),
    setRequestInterception: async value => interception.push(value),
  };
  const browser = { newPage: async () => page };

  assert.equal(installMermaidRequestPolicy(browser), browser);
  assert.equal(installMermaidRequestPolicy(browser), browser);
  await browser.newPage();
  assert.deepEqual(interception, [true]);
  assert.equal(handlers.length, 1);
  assert.equal(handlers[0].event, 'request');

  const cli = fakeRequest('https://mermaid-cli-intercept.invalid/mermaid.esm.mjs');
  handlers[0].handler(cli);
  assert.deepEqual(cli.calls, [[
    'continue',
    undefined,
    DEFAULT_INTERCEPT_RESOLUTION_PRIORITY,
  ]]);

  const external = fakeRequest('https://evil.example/tracker.js');
  handlers[0].handler(external);
  assert.deepEqual(external.calls, [[
    'abort',
    'blockedbyclient',
    DEFAULT_INTERCEPT_RESOLUTION_PRIORITY + 1,
  ]]);

  const handled = fakeRequest('https://evil.example/already-handled.js', true);
  handlers[0].handler(handled);
  assert.deepEqual(handled.calls, []);
});
