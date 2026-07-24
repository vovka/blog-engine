import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { verifyEngineState, writeEngineState } from '../bin/workspace/state.js';
import { verifyYalcPackage } from '../bin/workspace/yalc.js';

const packageName = 'blog-engine';
const signature = '1234567890abcdef';
const commit = 'a'.repeat(40);

const writeFile = (root, name, contents) => {
  const file = path.join(root, name);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, contents);
};

const createFixture = t => {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'workspace-yalc-'));
  const target = path.join(projectRoot, '.yalc', packageName);
  const manifest = { name: packageName, version: `1.1.0+${signature.slice(0, 8)}`, yalcSig: signature };
  t.after(() => fs.rmSync(projectRoot, { recursive: true, force: true }));
  writeFile(target, 'package.json', JSON.stringify(manifest));
  writeFile(target, 'yalc.sig', signature);
  writeFile(target, 'src/index.js', 'export const value = 1;\n');
  writeFile(projectRoot, 'yalc.lock', JSON.stringify({ packages: { [packageName]: { signature } } }));
  writeFile(projectRoot, 'package-lock.json', '{}');
  return { projectRoot, target, lock: { engine: { commit, package: packageName } } };
};

const saveState = fixture => {
  const yalcPackage = verifyYalcPackage(fixture.projectRoot, packageName);
  writeEngineState(fixture.projectRoot, fixture.lock, yalcPackage);
};

test('ignores nested node_modules installed into the hydrated package', t => {
  const fixture = createFixture(t);
  saveState(fixture);
  writeFile(fixture.target, 'node_modules/transitive/index.js', 'installed dependency\n');
  assert.doesNotThrow(() => verifyEngineState(fixture.projectRoot, fixture.lock));
});

test('detects mutations to the hydrated published payload', t => {
  const fixture = createFixture(t);
  saveState(fixture);
  writeFile(fixture.target, 'src/index.js', 'export const value = 2;\n');
  assert.throws(() => verifyEngineState(fixture.projectRoot, fixture.lock), /Hydrated engine package is corrupt/);
});
