import fs from 'node:fs';
import { digestFile, projectPaths, readJson, writeJson } from './files.js';
import { verifyYalcPackage } from './yalc.js';

export const readState = projectRoot => {
  const file = projectPaths(projectRoot).state;
  return fs.existsSync(file) ? readJson(file) : {};
};

export const writeEngineState = (projectRoot, lock, yalcPackage) => {
  const paths = projectPaths(projectRoot);
  const state = {
    ...readState(projectRoot),
    engine: {
      commit: lock.engine.commit,
      packageDigest: yalcPackage.digest,
      packageLockDigest: digestFile(paths.npmLock),
      signature: yalcPackage.signature,
    },
  };
  writeJson(paths.state, state);
};

export const verifyEngineState = (projectRoot, lock) => {
  const paths = projectPaths(projectRoot);
  const state = readState(projectRoot).engine;
  const yalcPackage = verifyYalcPackage(projectRoot, lock.engine.package);
  if (!state || state.commit !== lock.engine.commit) throw new Error('Workspace engine state is stale.');
  if (state.packageDigest !== yalcPackage.digest) throw new Error('Hydrated engine package is corrupt.');
  if (state.packageLockDigest !== digestFile(paths.npmLock)) throw new Error('Tracked npm lock changed after setup.');
  return yalcPackage;
};

export const writeEnhancerState = (projectRoot, lock, yalcPackage) => {
  const paths = projectPaths(projectRoot);
  const state = {
    ...readState(projectRoot),
    enhancer: {
      commit: lock.enhancer.commit,
      packageDigest: yalcPackage.digest,
      signature: yalcPackage.signature,
    },
  };
  writeJson(paths.state, state);
};
