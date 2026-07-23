import fs from 'node:fs';
import {
  ENGINE_COMMANDS,
  ENGINE_REPOSITORY,
  ENHANCER_COMMANDS,
  ENHANCER_REPOSITORY,
  SCHEMA_VERSION,
  SHA_PATTERN,
} from './constants.js';
import { projectPaths, readJson, writeJson } from './files.js';

const sameCommands = (actual, required) => (
  Array.isArray(actual) && required.every(command => actual.includes(command))
);

const validatePackage = (entry, expected) => {
  if (!entry || entry.package !== expected.package) throw new Error(`Lock must define ${expected.package}.`);
  if (entry.repository !== expected.repository) throw new Error(`${expected.package} must use ${expected.repository}.`);
  if (!SHA_PATTERN.test(entry.commit || '')) throw new Error(`${expected.package} must pin a 40-character SHA.`);
  if (!sameCommands(entry.commands, expected.commands)) {
    throw new Error(`${expected.package} lock commands are incomplete.`);
  }
};

export const validateLock = lock => {
  if (lock.schemaVersion !== SCHEMA_VERSION) throw new Error(`Unsupported lock schema ${lock.schemaVersion}.`);
  validatePackage(lock.engine, {
    package: 'blog-engine',
    repository: ENGINE_REPOSITORY,
    commands: ENGINE_COMMANDS,
  });
  validatePackage(lock.enhancer, {
    package: 'blog-enhancer',
    repository: ENHANCER_REPOSITORY,
    commands: ENHANCER_COMMANDS,
  });
  if (lock.enhancer.optional !== true) throw new Error('blog-enhancer must be marked optional.');
  return lock;
};

export const loadLock = projectRoot => {
  const file = projectPaths(projectRoot).lock;
  if (!fs.existsSync(file)) throw new Error('Missing geek-blog.lock.json.');
  return validateLock(readJson(file));
};

export const updatePins = (projectRoot, changes) => {
  const paths = projectPaths(projectRoot);
  const lock = loadLock(projectRoot);
  if (changes.engine) lock.engine.commit = changes.engine;
  if (changes.enhancer) lock.enhancer.commit = changes.enhancer;
  validateLock(lock);
  writeJson(paths.lock, lock);
  return lock;
};
