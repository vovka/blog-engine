import fs from 'node:fs';
import os from 'node:os';
import { commandExists, run } from './process.js';

const assertNode = () => {
  const major = Number(process.versions.node.split('.')[0]);
  if (major !== 20) throw new Error(`Node 20 is required; found ${process.version}.`);
};

const assertPlatform = () => {
  if (process.platform === 'darwin') return;
  if (process.platform === 'linux') return;
  throw new Error('Native support is limited to Linux, macOS, and WSL2.');
};

const assertCommand = command => {
  if (!commandExists(command)) throw new Error(`Required command is missing: ${command}.`);
};

export const validatePrerequisites = () => {
  assertNode();
  assertPlatform();
  assertCommand('git');
  assertCommand('npm');
};

const assertIgnored = (projectRoot, target) => {
  run('git', ['check-ignore', '--quiet', '--no-index', target], { cwd: projectRoot });
};

export const validateProject = projectRoot => {
  if (!fs.existsSync(`${projectRoot}/package.json`)) throw new Error('Missing package.json.');
  run('git', ['rev-parse', '--show-toplevel'], { cwd: projectRoot, capture: true });
  run('git', ['ls-files', '--error-unmatch', 'package-lock.json'], { cwd: projectRoot, capture: true });
  assertIgnored(projectRoot, '.yalc/probe');
  assertIgnored(projectRoot, 'yalc.lock');
  assertIgnored(projectRoot, '.geek-blog/state.json');
  if (os.release().toLowerCase().includes('microsoft')) console.log('Detected WSL2-compatible Linux.');
};
