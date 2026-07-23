import fs from 'node:fs';
import path from 'node:path';

const contentFile = (root, name, fallback) => {
  const candidate = path.resolve(root, 'content', name);
  return fs.existsSync(candidate) ? candidate : fallback;
};

export const createContentAliases = (projectRoot, engineRoot) => {
  const fallback = path.resolve(engineRoot, 'src', 'content', 'empty.js');
  return {
    '@content/posts': contentFile(projectRoot, 'posts.js', fallback),
    '@content/pages': contentFile(projectRoot, 'pages.js', fallback),
    '@content/metadata': contentFile(projectRoot, 'metadata.js', fallback),
    '@content': path.resolve(projectRoot, 'content'),
  };
};
