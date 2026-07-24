import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { DEFAULT_INTERCEPT_RESOLUTION_PRIORITY } from 'puppeteer';

const require = createRequire(import.meta.url);
const cliEntry = require.resolve('@mermaid-js/mermaid-cli');
export const MERMAID_CLI_PAGE_URL = pathToFileURL(
  path.resolve(path.dirname(cliEntry), '..', 'dist', 'index.html'),
).href;

const INTERCEPT_ORIGIN = 'https://mermaid-cli-intercept.invalid';
const PASSIVE_PROTOCOLS = new Set(['about:', 'blob:', 'data:']);
const BLOCK_PRIORITY = DEFAULT_INTERCEPT_RESOLUTION_PRIORITY + 1;
const installed = new WeakSet();

export const isAllowedMermaidRequestUrl = requestUrl => {
  try {
    const parsed = new URL(requestUrl);
    return requestUrl === MERMAID_CLI_PAGE_URL
      || PASSIVE_PROTOCOLS.has(parsed.protocol)
      || parsed.origin === INTERCEPT_ORIGIN;
  } catch {
    return false;
  }
};

const handleRequest = request => {
  if (request.isInterceptResolutionHandled()) return;
  if (isAllowedMermaidRequestUrl(request.url())) {
    return request.continue(undefined, DEFAULT_INTERCEPT_RESOLUTION_PRIORITY);
  }
  return request.abort('blockedbyclient', BLOCK_PRIORITY);
};

export const installMermaidRequestPolicy = browser => {
  if (installed.has(browser) || typeof browser.newPage !== 'function') return browser;
  const newPage = browser.newPage.bind(browser);
  browser.newPage = async (...args) => {
    const page = await newPage(...args);
    await page.setRequestInterception?.(true);
    page.on('request', handleRequest);
    return page;
  };
  installed.add(browser);
  return browser;
};
