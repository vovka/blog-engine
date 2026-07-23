import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

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

export default defineConfig({
  envDir: process.cwd(),
  plugins: [react(), copy404Plugin()],
  root: path.resolve(__dirname),
  publicDir: path.resolve(process.cwd(), 'public'),
  build: {
    outDir: path.resolve(process.cwd(), 'dist'),
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@content/posts': path.resolve(process.cwd(), 'content', 'posts.js'),
      '@content/pages': path.resolve(process.cwd(), 'content', 'pages.js'),
      '@content/metadata': path.resolve(process.cwd(), 'content', 'metadata.js'),
      '@content': path.resolve(process.cwd(), 'content'),
      '@config': path.resolve(process.cwd(), 'blog.config.js'),
    }
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
    fs: {
      allow: ['..']
    }
  },
  preview: {
    port: 3000,
    host: '0.0.0.0',
  }
});
