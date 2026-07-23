import fs from 'node:fs';
import { resolveEngineSource } from './git.js';
import { installedEngineBin, verifyNpmLock } from './npm.js';
import { validatePrerequisites, validateProject } from './prerequisites.js';
import { verifyEngineState } from './state.js';
import { validateDependency } from './yalc.js';

export const runDoctor = (projectRoot, lock, engineRoot) => {
  validatePrerequisites();
  validateProject(projectRoot);
  validateDependency(projectRoot, lock.engine.package);
  resolveEngineSource(lock.engine, engineRoot);
  const yalcPackage = verifyEngineState(projectRoot, lock);
  verifyNpmLock(projectRoot, lock.engine.package, yalcPackage);
  if (!fs.existsSync(installedEngineBin(projectRoot))) throw new Error('Engine dependencies are not installed.');
  console.log(`Doctor passed: ${lock.engine.package}@${lock.engine.commit}.`);
};
