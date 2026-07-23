import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { resolveBlogConfig } from './resolveBlogConfig.js';

const loadInstanceConfig = async projectRoot => {
  const configPath = path.join(projectRoot, 'blog.config.js');
  if (!fs.existsSync(configPath)) return {};
  const url = `${pathToFileURL(configPath).href}?updated=${fs.statSync(configPath).mtimeMs}`;
  return (await import(url)).default || {};
};

export const loadBlogConfig = async (projectRoot, env, options = {}) => {
  const instance = await loadInstanceConfig(projectRoot);
  return resolveBlogConfig(instance, env, options);
};
