import fs from 'node:fs';
import path from 'node:path';
import { YALC_VERSION } from './constants.js';
import { digestDirectory, projectPaths, readJson } from './files.js';
import { run } from './process.js';

const runYalc = (cwd, store, args) => run(
  'npx',
  ['--yes', `yalc@${YALC_VERSION}`, '--store-folder', store, ...args],
  { cwd },
);

const packagePath = (projectRoot, packageName) => path.join(projectRoot, '.yalc', packageName);

const readSourcePackage = source => readJson(path.join(source, 'package.json'));

const digestPublishedPackage = target => digestDirectory(target, {
  ignoredDirectories: ['node_modules'],
});

export const validateDependency = (projectRoot, packageName) => {
  const manifest = readJson(path.join(projectRoot, 'package.json'));
  const expected = `file:.yalc/${packageName}`;
  if (manifest.dependencies?.[packageName] !== expected) {
    throw new Error(`${packageName} must remain ${expected} in package.json.`);
  }
};

export const hydratePackage = (projectRoot, source, entry, options = {}) => {
  const store = options.store || projectPaths(projectRoot).store;
  const manifest = readSourcePackage(source);
  if (manifest.name !== entry.package) throw new Error(`${entry.package} source has the wrong package name.`);
  const publishArgs = ['publish', '--sig'];
  if (manifest.private) publishArgs.push('--private');
  runYalc(source, store, publishArgs);
  runYalc(projectRoot, store, ['add', `${entry.package}@${manifest.version}`, '--pure']);
  return verifyYalcPackage(projectRoot, entry.package);
};

export const verifyYalcPackage = (projectRoot, packageName) => {
  const target = packagePath(projectRoot, packageName);
  if (!fs.existsSync(target)) throw new Error(`Missing hydrated .yalc/${packageName}.`);
  const manifest = readJson(path.join(target, 'package.json'));
  const lock = readJson(path.join(projectRoot, 'yalc.lock'));
  const expected = lock.packages?.[packageName]?.signature;
  const signature = fs.readFileSync(path.join(target, 'yalc.sig'), 'utf8').trim();
  if (!expected || expected !== signature || manifest.yalcSig !== signature) {
    throw new Error(`Yalc signature mismatch for ${packageName}.`);
  }
  if (!manifest.version.endsWith(`+${signature.slice(0, 8)}`)) {
    throw new Error(`Yalc version signature mismatch for ${packageName}.`);
  }
  return { digest: digestPublishedPackage(target), signature, version: manifest.version };
};
