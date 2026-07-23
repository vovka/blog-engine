import { ensureCheckout } from './git.js';
import { regenerateNpmLock, verifyNpmLock } from './npm.js';
import { validatePrerequisites, validateProject } from './prerequisites.js';
import { writeEngineState } from './state.js';
import { hydratePackage, validateDependency } from './yalc.js';
import { prepareWorkspace } from './setup.js';
import { setupEnhancer } from './enhancer.js';

export const parsePinChanges = args => {
  const changes = {};
  for (let index = 0; index < args.length; index += 2) {
    const name = args[index];
    const value = args[index + 1];
    if (name === '--engine') changes.engine = value;
    else if (name === '--enhancer') changes.enhancer = value;
    else throw new Error(`Unknown update option: ${name}.`);
    if (!value) throw new Error(`${name} requires a commit SHA.`);
  }
  if (!changes.engine && !changes.enhancer) throw new Error('Specify --engine SHA or --enhancer SHA.');
  return changes;
};

export const updateWorkspace = (projectRoot, lock, engineRoot, changes) => {
  validatePrerequisites();
  validateProject(projectRoot);
  validateDependency(projectRoot, lock.engine.package);
  const source = ensureCheckout(lock.engine);
  const yalcPackage = hydratePackage(projectRoot, source, lock.engine);
  regenerateNpmLock(projectRoot);
  verifyNpmLock(projectRoot, lock.engine.package, yalcPackage);
  prepareWorkspace(projectRoot, lock, engineRoot, { force: true });
  writeEngineState(projectRoot, lock, yalcPackage);
  if (changes.enhancer) setupEnhancer(projectRoot, lock);
  console.log('Updated explicit pins and tracked npm lock. Review the repository diff.');
};
