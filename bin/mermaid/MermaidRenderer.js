import { renderMermaid } from '@mermaid-js/mermaid-cli';
import puppeteer from 'puppeteer';
import { ConcurrencyQueue } from './ConcurrencyQueue.js';
import { installMermaidRequestPolicy } from './MermaidRequestPolicy.js';
import { MERMAID_BACKGROUND } from './renderPolicy.js';
import { normalizeMermaidSvgDimensions } from './svgDimensions.js';
import { assertSafeMermaidSvg, sanitizeMermaidSvg } from './svgSafety.js';

const launchBrowser = () => puppeteer.launch();
const toSvg = data => new TextDecoder().decode(data);

export class MermaidRenderer {
  constructor({
    renderer = renderMermaid,
    browserLauncher = launchBrowser,
    concurrency = 2,
  } = {}) {
    this.renderer = renderer;
    this.browserLauncher = browserLauncher;
    this.queue = new ConcurrencyQueue(concurrency);
  }

  render(definition, spec) {
    return this.queue.run(() => this.#render(definition, spec));
  }

  async close() {
    if (!this.browserPromise) return;
    const browser = await this.browserPromise.catch(() => null);
    await browser?.close();
    this.browserPromise = null;
  }

  async #render(definition, spec) {
    this.browserPromise ??= Promise.resolve(this.browserLauncher())
      .then(installMermaidRequestPolicy);
    const browser = await this.browserPromise;
    const result = await this.renderer(browser, definition, 'svg', {
      backgroundColor: MERMAID_BACKGROUND,
      mermaidConfig: spec.mermaidConfig,
      svgId: spec.svgId,
    });
    const sanitized = sanitizeMermaidSvg(toSvg(result.data));
    const svg = normalizeMermaidSvgDimensions(sanitized);
    assertSafeMermaidSvg(svg);
    return { svg, desc: result.desc, title: result.title };
  }
}
