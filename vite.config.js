import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { loadBlogConfig } from './src/config/loadBlogConfig.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Custom plugin to copy 404.html to dist/
const copy404Plugin = () => ({
  name: 'copy-404',
  closeBundle() {
    const source404 = path.resolve(process.cwd(), 'public', '404.html');
    const dest404 = path.resolve(process.cwd(), 'dist', '404.html');

    if (fs.existsSync(source404)) {
      fs.copyFileSync(source404, dest404);
      console.log('✅ Copied 404.html to dist/');
    }
  }
});

const configPlugin = config => ({
  name: 'geek-blog-config',
  resolveId(id) {
    return id === '@config' ? '\0geek-blog-config' : undefined;
  },
  load(id) {
    return id === '\0geek-blog-config' ? `export default ${JSON.stringify(config)};` : undefined;
  },
});

const aliases = projectRoot => ({
  '@content/posts': path.resolve(projectRoot, 'content', 'posts.js'),
  '@content/pages': path.resolve(projectRoot, 'content', 'pages.js'),
  '@content/metadata': path.resolve(projectRoot, 'content', 'metadata.js'),
  '@content': path.resolve(projectRoot, 'content'),
});

export default defineConfig(async ({ command, mode }) => {
  const projectRoot = process.cwd();
  const env = { ...process.env, ...loadEnv(mode, projectRoot, '') };
  const config = await loadBlogConfig(projectRoot, env, {
    strict: command === 'build',
    warn: console.warn,
  });
  return {
    envDir: projectRoot,
    plugins: [configPlugin(config), react(), copy404Plugin()],
    root: path.resolve(__dirname),
    publicDir: path.resolve(projectRoot, 'public'),
    build: { outDir: path.resolve(projectRoot, 'dist'), emptyOutDir: true },
    resolve: { alias: aliases(projectRoot) },
    server: { port: 3000, host: '0.0.0.0', fs: { allow: ['..'] } },
    preview: { port: 3000, host: '0.0.0.0' },
  };
});
