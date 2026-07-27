import fs from 'node:fs/promises';
import path from 'node:path';
import { MermaidRenderer } from './MermaidRenderer.js';
import {
  createMarkdownImage,
  findMermaidBlocks,
  replaceMermaidBlocks,
  selectAccessibleText,
} from './markdown.js';
import {
  buildMermaidUrl,
  createRenderSpec,
} from './renderPolicy.js';

export class MermaidBuildSession {
  constructor({
    projectRoot,
    basePath,
    renderer,
    launchBrowser,
    concurrency = 2,
  }) {
    this.projectRoot = projectRoot;
    this.basePath = basePath;
    this.renderer = new MermaidRenderer({
      renderer,
      browserLauncher: launchBrowser,
      concurrency,
    });
    this.assets = new Map();
    this.stagingDir = path.join(projectRoot, '.geek-blog', `mermaid-next-${process.pid}`);
  }

  async transform({ markdown, sourcePath, title }) {
    const blocks = findMermaidBlocks(markdown);
    if (!blocks.length) return markdown;
    const replacements = await Promise.all(blocks.map(block => this.#replace(block, sourcePath, title)));
    return replaceMermaidBlocks(markdown, blocks, replacements);
  }

  async prepareForCommit() {
    await this.#prepare();
    return this.stagingDir;
  }

  async abort() {
    await fs.rm(this.stagingDir, { recursive: true, force: true });
    await this.close();
  }

  async close() {
    await this.renderer.close();
  }

  async #replace(block, sourcePath, title) {
    try {
      const rendered = await this.#render(block.definition);
      const fallback = `${title} — diagram ${block.ordinal}`;
      const alt = selectAccessibleText({ ...rendered, fallback });
      return createMarkdownImage(alt, buildMermaidUrl(this.basePath, rendered.assetHash));
    } catch (error) {
      throw this.#diagnostic(error, sourcePath, block);
    }
  }

  #render(definition) {
    const spec = createRenderSpec(definition);
    if (!this.assets.has(spec.assetHash)) {
      this.assets.set(spec.assetHash, this.#renderAsset(definition, spec));
    }
    return this.assets.get(spec.assetHash);
  }

  async #renderAsset(definition, spec) {
    await this.#prepare();
    const rendered = await this.renderer.render(definition, spec);
    await fs.writeFile(path.join(this.stagingDir, `${spec.assetHash}.svg`), rendered.svg);
    return { assetHash: spec.assetHash, desc: rendered.desc, title: rendered.title };
  }

  async #prepare() {
    if (!this.preparePromise) {
      this.preparePromise = fs.rm(this.stagingDir, { recursive: true, force: true })
        .then(() => fs.mkdir(this.stagingDir, { recursive: true }));
    }
    await this.preparePromise;
  }

  #diagnostic(error, sourcePath, block) {
    const absolute = path.resolve(this.projectRoot, sourcePath);
    const relative = path.relative(this.projectRoot, absolute);
    return new Error(
      `Mermaid render failed in ${relative}, diagram ${block.ordinal}, `
      + `line ${block.startLine}: ${error.message}`,
      { cause: error },
    );
  }
}
