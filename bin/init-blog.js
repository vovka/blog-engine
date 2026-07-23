import path from 'node:path';
import fs from 'fs-extra';

const copy = (templatesDir, targetDir, source, destination = source) => (
  fs.copy(path.join(templatesDir, source), path.join(targetDir, destination))
);

const createDirectories = targetDir => Promise.all([
  fs.ensureDir(path.join(targetDir, 'content/posts')),
  fs.ensureDir(path.join(targetDir, 'content/pages')),
  fs.ensureDir(path.join(targetDir, 'public')),
  fs.ensureDir(path.join(targetDir, '.github/workflows')),
]);

const copyWelcome = async (templatesDir, targetDir) => {
  const source = await fs.readFile(path.join(templatesDir, 'welcome.md'), 'utf8');
  const content = source.replace('{{DATE}}', new Date().toISOString().split('T')[0]);
  await fs.writeFile(path.join(targetDir, 'content/posts/welcome.md'), content);
};

const copyTemplates = async (templatesDir, targetDir) => Promise.all([
  copy(templatesDir, targetDir, 'pages/about.md', 'content/pages/about.md'),
  copy(templatesDir, targetDir, 'pages/contact.md', 'content/pages/contact.md'),
  copy(templatesDir, targetDir, '404.html', 'public/404.html'),
  copy(templatesDir, targetDir, 'blog.config.js'),
  copy(templatesDir, targetDir, 'gitignore', '.gitignore'),
  copy(templatesDir, targetDir, 'deploy.yml', '.github/workflows/deploy.yml'),
]);

export const initializeBlog = async engineRoot => {
  const targetDir = process.cwd();
  const templatesDir = path.join(engineRoot, 'templates');
  await createDirectories(targetDir);
  await copyWelcome(templatesDir, targetDir);
  await copyTemplates(templatesDir, targetDir);
  console.log('Blog content initialized.');
  console.log('Run `npm run process`, then `npm run dev`.');
};
