#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const CANONICAL_REPOSITORY = 'https://github.com/geek-blog/blog-engine.git';
const SHA_PATTERN = /^[0-9a-f]{40}$/;
const [command = 'doctor', ...args] = process.argv.slice(2);
const projectRoot = process.cwd();

const fail = message => {
  console.error(`Geek Blog launcher error: ${message}`);
  process.exit(1);
};

const run = (executable, values, options = {}) => {
  const result = spawnSync(executable, values, {
    cwd: options.cwd,
    encoding: 'utf8',
    stdio: options.capture ? 'pipe' : 'inherit',
  });
  if (result.status === 0) return options.capture ? result.stdout.trim() : '';
  const detail = options.capture ? (result.stderr || result.stdout).trim() : '';
  fail(`${[executable, ...values].join(' ')} failed.${detail ? ` ${detail}` : ''}`);
};

const readLock = () => {
  const file = path.join(projectRoot, 'geek-blog.lock.json');
  if (!fs.existsSync(file)) fail('Missing geek-blog.lock.json.');
  const lock = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (lock.schemaVersion !== 1) fail(`Unsupported lock schema ${lock.schemaVersion}.`);
  if (lock.engine?.repository !== CANONICAL_REPOSITORY) fail('Engine repository is not canonical.');
  if (!SHA_PATTERN.test(lock.engine?.commit || '')) fail('Engine commit must be a 40-character SHA.');
  if (!lock.engine?.commands?.includes(command)) fail(`Command is not locked: ${command}.`);
  return lock;
};

const cacheRoot = () => {
  if (process.env.GEEK_BLOG_CACHE_DIR) return path.resolve(process.env.GEEK_BLOG_CACHE_DIR);
  return path.join(process.env.XDG_CACHE_HOME || path.join(os.homedir(), '.cache'), 'geek-blog');
};

const sourcePath = lock => {
  const key = crypto.createHash('sha256').update(lock.engine.repository).digest('hex').slice(0, 16);
  return path.join(cacheRoot(), 'sources', key, lock.engine.commit);
};

const repositoryName = value => value
  .replace(/^git@[^:]+:/, '')
  .replace(/^https?:\/\/[^/]+\//, '')
  .replace(/\.git$/, '');

const validateSource = (source, lock) => {
  const head = run('git', ['rev-parse', 'HEAD'], { cwd: source, capture: true });
  const remote = run('git', ['remote', 'get-url', 'origin'], { cwd: source, capture: true });
  const dirty = run('git', ['status', '--porcelain'], { cwd: source, capture: true });
  if (head !== lock.engine.commit) fail(`Cached engine has the wrong SHA: ${source}.`);
  if (repositoryName(remote) !== repositoryName(lock.engine.repository)) fail(`Cached engine has the wrong origin.`);
  if (dirty) fail(`Cached engine is modified: ${source}.`);
  return source;
};

const cloneSource = (source, lock) => {
  fs.mkdirSync(path.dirname(source), { recursive: true });
  const temporary = `${source}.tmp-${process.pid}`;
  fs.rmSync(temporary, { force: true, recursive: true });
  run('git', ['init', '--quiet', temporary]);
  run('git', ['remote', 'add', 'origin', lock.engine.repository], { cwd: temporary });
  run('git', ['fetch', '--quiet', '--depth=1', 'origin', lock.engine.commit], { cwd: temporary });
  run('git', ['checkout', '--quiet', '--detach', 'FETCH_HEAD'], { cwd: temporary });
  try {
    fs.renameSync(temporary, source);
  } catch (error) {
    fs.rmSync(temporary, { force: true, recursive: true });
    if (!fs.existsSync(source)) fail(error.message);
  }
};

if (Number(process.versions.node.split('.')[0]) !== 20) fail(`Node 20 is required; found ${process.version}.`);
const lock = readLock();
const source = sourcePath(lock);
if (!fs.existsSync(source)) cloneSource(source, lock);
validateSource(source, lock);
const workspace = path.join(source, 'bin/workspace.js');
const result = spawnSync(process.execPath, [workspace, command, ...args], { cwd: projectRoot, stdio: 'inherit' });
process.exit(result.status ?? 1);
