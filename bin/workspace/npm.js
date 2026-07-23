import fs from 'node:fs';
import path from 'node:path';
import { projectPaths, readJson } from './files.js';
import { run } from './process.js';

const expectedPath = packageName => `.yalc/${packageName}`;

export const verifyNpmLock = (projectRoot, packageName, yalcPackage) => {
  const paths = projectPaths(projectRoot);
  if (!fs.existsSync(paths.npmLock)) throw new Error('Missing tracked package-lock.json.');
  const lock = readJson(paths.npmLock);
  const expected = `file:${expectedPath(packageName)}`;
  if (lock.packages?.['']?.dependencies?.[packageName] !== expected) {
    throw new Error(`package-lock.json does not retain ${expected}. Run workspace update.`);
  }
  const copy = lock.packages?.[expectedPath(packageName)];
  const installed = lock.packages?.[`node_modules/${packageName}`];
  if (copy?.version !== yalcPackage.version || installed?.resolved !== expectedPath(packageName)) {
    throw new Error(`package-lock.json is stale for ${packageName}. Run workspace update.`);
  }
};

export const installClean = projectRoot => run('npm', ['ci'], { cwd: projectRoot });

export const regenerateNpmLock = projectRoot => run(
  'npm',
  ['install', '--package-lock-only', '--ignore-scripts'],
  { cwd: projectRoot },
);

export const installedEngineBin = projectRoot => (
  path.join(projectRoot, 'node_modules/blog-engine/bin/blog-engine.js')
);
