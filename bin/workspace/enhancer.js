import fs from 'node:fs';
import path from 'node:path';
import { ensureCheckout } from './git.js';
import { projectPaths, writeJson } from './files.js';
import { run } from './process.js';
import { hydratePackage, verifyYalcPackage } from './yalc.js';
import { writeEnhancerState } from './state.js';

const toolManifest = {
  name: 'geek-blog-enhancer-tool',
  private: true,
  version: '1.0.0',
  dependencies: {
    'blog-enhancer': 'file:.yalc/blog-enhancer',
  },
};

const ensureToolManifest = toolRoot => {
  fs.mkdirSync(toolRoot, { recursive: true });
  writeJson(path.join(toolRoot, 'package.json'), toolManifest);
};

export const setupEnhancer = (projectRoot, lock) => {
  const paths = projectPaths(projectRoot);
  const source = ensureCheckout(lock.enhancer, { private: true });
  ensureToolManifest(paths.toolRoot);
  const yalcPackage = hydratePackage(paths.toolRoot, source, lock.enhancer, { store: paths.store });
  run('npm', ['install', '--ignore-scripts'], { cwd: paths.toolRoot });
  verifyYalcPackage(paths.toolRoot, lock.enhancer.package);
  writeEnhancerState(projectRoot, lock, yalcPackage);
  return path.join(paths.toolRoot, 'node_modules/blog-enhancer/bin/blog-enhancer.js');
};
