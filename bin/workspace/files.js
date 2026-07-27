import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export const readJson = file => JSON.parse(fs.readFileSync(file, 'utf8'));

export const writeJson = (file, value) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
};

export const digestText = value => crypto.createHash('sha256').update(value).digest('hex');

export const digestFile = file => digestText(fs.readFileSync(file));

const walk = (directory, ignoredDirectories) => fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
  const target = path.join(directory, entry.name);
  if (!entry.isDirectory()) return [target];
  return ignoredDirectories.has(entry.name) ? [] : walk(target, ignoredDirectories);
});

export const digestDirectory = (directory, options = {}) => {
  const hash = crypto.createHash('sha256');
  const ignoredDirectories = new Set(options.ignoredDirectories);
  walk(directory, ignoredDirectories).sort().forEach(file => {
    hash.update(path.relative(directory, file).replaceAll(path.sep, '/'));
    hash.update(fs.readFileSync(file));
  });
  return hash.digest('hex');
};

export const cacheRoot = () => {
  if (process.env.GEEK_BLOG_CACHE_DIR) return path.resolve(process.env.GEEK_BLOG_CACHE_DIR);
  const base = process.env.XDG_CACHE_HOME || path.join(os.homedir(), '.cache');
  return path.join(base, 'geek-blog');
};

export const projectPaths = projectRoot => {
  const internal = path.join(projectRoot, '.geek-blog');
  return {
    internal,
    lock: path.join(projectRoot, 'geek-blog.lock.json'),
    npmLock: path.join(projectRoot, 'package-lock.json'),
    state: path.join(internal, 'state.json'),
    store: path.join(internal, 'yalc-store'),
    toolRoot: path.join(internal, 'tools/enhancer'),
  };
};
