import fs from 'node:fs';
import path from 'node:path';
import { cacheRoot, digestText } from './files.js';
import { run } from './process.js';

const repoName = repository => repository.replace(/\.git$/, '').split('/').slice(-2).join('/');
const cachePath = entry => path.join(cacheRoot(), 'sources', digestText(entry.repository).slice(0, 16), entry.commit);

const readRemote = source => run('git', ['remote', 'get-url', 'origin'], { cwd: source, capture: true });

const validateCheckout = (source, entry) => {
  const head = run('git', ['rev-parse', 'HEAD'], { cwd: source, capture: true });
  if (head !== entry.commit) throw new Error(`Cached ${entry.package} checkout has the wrong SHA: ${source}.`);
  if (repoName(readRemote(source)) !== repoName(entry.repository)) {
    throw new Error(`Cached ${entry.package} checkout has the wrong origin: ${source}.`);
  }
  const dirty = run('git', ['status', '--porcelain'], { cwd: source, capture: true });
  if (dirty) throw new Error(`Cached ${entry.package} checkout is modified: ${source}.`);
  return source;
};

const clonePublic = (entry, target) => {
  run('git', ['init', '--quiet', target]);
  run('git', ['remote', 'add', 'origin', entry.repository], { cwd: target });
  run('git', ['fetch', '--quiet', '--depth=1', 'origin', entry.commit], { cwd: target });
  run('git', ['checkout', '--quiet', '--detach', 'FETCH_HEAD'], { cwd: target });
};

const githubEnvironment = () => {
  if (!process.env.GEEK_BLOG_TOKEN) return process.env;
  return { ...process.env, GH_TOKEN: process.env.GEEK_BLOG_TOKEN };
};

const verifyEnhancerAccess = entry => {
  const env = githubEnvironment();
  run('gh', ['auth', 'status'], { env, capture: true });
  run('gh', ['api', `repos/${repoName(entry.repository)}`, '--silent'], { env, capture: true });
  return env;
};

const clonePrivate = (entry, target) => {
  const env = verifyEnhancerAccess(entry);
  run('gh', ['repo', 'clone', repoName(entry.repository), target, '--', '--no-checkout'], { env });
  run('git', ['checkout', '--quiet', '--detach', entry.commit], { cwd: target, env });
};

export const ensureCheckout = (entry, options = {}) => {
  const target = cachePath(entry);
  if (fs.existsSync(target)) return validateCheckout(target, entry);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const temporary = `${target}.tmp-${process.pid}`;
  fs.rmSync(temporary, { force: true, recursive: true });
  try {
    (options.private ? clonePrivate : clonePublic)(entry, temporary);
    fs.renameSync(temporary, target);
  } catch (error) {
    fs.rmSync(temporary, { force: true, recursive: true });
    throw error;
  }
  return validateCheckout(target, entry);
};

export const resolveEngineSource = (entry, currentRoot) => {
  try {
    return validateCheckout(currentRoot, entry);
  } catch {
    return ensureCheckout(entry);
  }
};
