import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ENGINE_COMMANDS,
  ENGINE_REPOSITORY,
  ENHANCER_COMMANDS,
  ENHANCER_REPOSITORY,
} from '../bin/workspace/constants.js';
import { validateLock } from '../bin/workspace/lock.js';
import { repositoryName } from '../bin/workspace/git.js';
import { parsePinChanges } from '../bin/workspace/update.js';

const sha = 'a'.repeat(40);
const validLock = {
  schemaVersion: 1,
  engine: {
    repository: ENGINE_REPOSITORY,
    commit: sha,
    package: 'blog-engine',
    commands: ENGINE_COMMANDS,
  },
  enhancer: {
    optional: true,
    repository: ENHANCER_REPOSITORY,
    commit: sha,
    package: 'blog-enhancer',
    commands: ENHANCER_COMMANDS,
  },
};

test('accepts the canonical exact-pin schema', () => {
  assert.deepEqual(validateLock(structuredClone(validLock)), validLock);
});

test('rejects noncanonical repositories and moving refs', () => {
  const noncanonical = structuredClone(validLock);
  noncanonical.engine.repository = 'https://github.com/example/blog-engine.git';
  assert.throws(() => validateLock(noncanonical), /must use/);
  const branch = structuredClone(validLock);
  branch.engine.commit = 'main';
  assert.throws(() => validateLock(branch), /40-character SHA/);
});

test('requires the complete command contract', () => {
  const incomplete = structuredClone(validLock);
  incomplete.engine.commands = ['setup', 'build'];
  assert.throws(() => validateLock(incomplete), /commands are incomplete/);
});

test('parses only explicit update pins', () => {
  assert.deepEqual(parsePinChanges(['--engine', sha]), { engine: sha });
  assert.throws(() => parsePinChanges([]), /Specify/);
  assert.throws(() => parsePinChanges(['--branch', 'main']), /Unknown/);
});

test('normalizes HTTPS and SSH GitHub origins to one repository identity', () => {
  assert.equal(repositoryName(ENGINE_REPOSITORY), 'geek-blog/blog-engine');
  assert.equal(repositoryName('git@github.com:geek-blog/blog-engine.git'), 'geek-blog/blog-engine');
});
