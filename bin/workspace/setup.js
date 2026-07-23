import fs from 'node:fs';
import { resolveEngineSource } from './git.js';
import { projectPaths } from './files.js';
import { installClean, installedEngineBin, verifyNpmLock } from './npm.js';
import { validatePrerequisites, validateProject } from './prerequisites.js';
import { verifyEngineState, writeEngineState } from './state.js';
import { hydratePackage, validateDependency } from './yalc.js';

const ready = (projectRoot, lock) => {
  try {
    const yalcPackage = verifyEngineState(projectRoot, lock);
    verifyNpmLock(projectRoot, lock.engine.package, yalcPackage);
    return fs.existsSync(installedEngineBin(projectRoot));
  } catch {
    return false;
  }
};

export const prepareWorkspace = (projectRoot, lock, engineRoot, options = {}) => {
  validatePrerequisites();
  validateProject(projectRoot);
  validateDependency(projectRoot, lock.engine.package);
  if (!options.force && ready(projectRoot, lock)) {
    console.log(`Workspace ready at engine ${lock.engine.commit}.`);
    return installedEngineBin(projectRoot);
  }
  const source = resolveEngineSource(lock.engine, engineRoot);
  const yalcPackage = hydratePackage(projectRoot, source, lock.engine);
  verifyNpmLock(projectRoot, lock.engine.package, yalcPackage);
  installClean(projectRoot);
  writeEngineState(projectRoot, lock, yalcPackage);
  console.log(`Workspace hydrated at engine ${lock.engine.commit}.`);
  return installedEngineBin(projectRoot);
};

export const workspacePaths = projectPaths;
