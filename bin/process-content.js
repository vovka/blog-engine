#!/usr/bin/env node
import * as fs from 'node:fs';
import * as path from 'node:path';
import matter from 'gray-matter';
import readingTime from 'reading-time';
import { loadEnv } from 'vite';
import { writeSitemap } from './generate-sitemap.js';
import { loadBlogConfig } from '../src/config/loadBlogConfig.js';

// Lists .md files under dir (optionally recursive), full paths.
function findMarkdownFiles(dir, { recursive = false } = {}) {
  return fs.readdirSync(dir, { recursive })
    .filter(name => name.endsWith('.md'))
    .map(name => path.join(dir, name));
}

// Find project root (traverse up until we find content/)
function findProjectRoot() {
  let dir = process.cwd();
  while (dir !== '/') {
    if (fs.existsSync(path.join(dir, 'content'))) {
      return dir;
    }
    dir = path.dirname(dir);
  }
  throw new Error('Could not find content/ directory. Make sure you run this from a blog-content project.');
}

async function processContent() {
  const PROJECT_ROOT = findProjectRoot();

  // Process posts
  const posts = await processPosts(PROJECT_ROOT);

  // Process pages
  const pages = await processPages(PROJECT_ROOT);

  // Generate metadata
  await generateMetadata(PROJECT_ROOT);

  // Generate sitemap when a canonical site URL is configured
  await generateSitemap(PROJECT_ROOT, posts, pages);
}

async function generateSitemap(PROJECT_ROOT, posts, pages) {
  const env = loadEnv(process.env.NODE_ENV || 'production', PROJECT_ROOT, '');
  const config = await loadBlogConfig(PROJECT_ROOT, { ...process.env, ...env }, {
    strict: process.env.GEEK_BLOG_STRICT_CONFIG === '1',
    warn: console.warn,
  });
  if (!config.siteUrl) {
    console.warn('⚠️  Skipped sitemap.xml: configure siteUrl or VITE_SITE_URL');
    return;
  }
  writeSitemap(PROJECT_ROOT, { posts, pages, siteUrl: config.siteUrl, basePath: config.basePath });
  console.log(`✅ Generated sitemap.xml`);
  console.log(`📦 Output: ${path.join(PROJECT_ROOT, 'public/sitemap.xml')}`);
}

async function processPosts(PROJECT_ROOT) {
  const POSTS_DIR = path.join(PROJECT_ROOT, 'content/posts');
  const OUTPUT_FILE = path.join(PROJECT_ROOT, 'content/posts.js');

  console.log(`📂 Looking for posts in: ${POSTS_DIR}`);

  // Ensure posts directory exists
  if (!fs.existsSync(POSTS_DIR)) {
    console.log(`⚠️  No posts directory found at ${POSTS_DIR}`);
    console.log('Creating empty posts array...');

    const emptyOutput = generatePostsOutput([]);
    fs.writeFileSync(OUTPUT_FILE, emptyOutput);
    console.log(`✅ Generated empty posts file`);
    return [];
  }

  // Find all markdown files in content/posts
  const postFiles = findMarkdownFiles(POSTS_DIR, { recursive: true });

  if (postFiles.length === 0) {
    console.log('⚠️  No markdown files found in posts directory');
    const emptyOutput = generatePostsOutput([]);
    fs.writeFileSync(OUTPUT_FILE, emptyOutput);
    console.log(`✅ Generated empty posts file`);
    return [];
  }

  console.log(`📝 Found ${postFiles.length} post(s)`);

  const posts = postFiles.map(filePath => {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const { data, content } = matter(fileContent);
    const stats = readingTime(content);

    // Extract slug from filename
    const slug = path.basename(filePath, '.md');

    console.log(`   - ${slug}`);

    return {
      slug,
      title: data.title || 'Untitled',
      date: data.date || new Date().toISOString().split('T')[0],
      author: data.author || 'Anonymous',
      category: data.category || 'Uncategorized',
      excerpt: data.excerpt || '',
      coverImage: data.coverImage,
      tags: data.tags || [],
      layout: data.layout || 'default',
      primaryAuthor: data.primaryAuthor,
      opponentAuthor: data.opponentAuthor,
      commentsEnabled: data.comments === true,
      commentId: data.commentId || slug,
      content: content,
      readingTime: stats.text
    };
  });

  // Sort posts by date (newest first)
  posts.sort((a, b) => new Date(b.date) - new Date(a.date));

  // Generate JavaScript file
  const output = generatePostsOutput(posts);

  fs.writeFileSync(OUTPUT_FILE, output);
  console.log(`✅ Processed ${posts.length} blog post(s)`);
  console.log(`📦 Output: ${OUTPUT_FILE}`);
  return posts;
}

async function processPages(PROJECT_ROOT) {
  const PAGES_DIR = path.join(PROJECT_ROOT, 'content/pages');
  const OUTPUT_FILE = path.join(PROJECT_ROOT, 'content/pages.js');

  console.log(`📂 Looking for pages in: ${PAGES_DIR}`);

  // Ensure pages directory exists
  if (!fs.existsSync(PAGES_DIR)) {
    console.log(`⚠️  No pages directory found at ${PAGES_DIR}`);
    console.log('Creating empty pages array...');

    const emptyOutput = generatePagesOutput([]);
    fs.writeFileSync(OUTPUT_FILE, emptyOutput);
    console.log(`✅ Generated empty pages file`);
    return [];
  }

  // Find all markdown files in content/pages
  const pageFiles = findMarkdownFiles(PAGES_DIR);

  if (pageFiles.length === 0) {
    console.log('⚠️  No markdown files found in pages directory');
    const emptyOutput = generatePagesOutput([]);
    fs.writeFileSync(OUTPUT_FILE, emptyOutput);
    console.log(`✅ Generated empty pages file`);
    return [];
  }

  console.log(`📄 Found ${pageFiles.length} page(s)`);

  const pages = pageFiles.map(filePath => {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const { data, content } = matter(fileContent);

    // Extract slug from filename
    const slug = path.basename(filePath, '.md');

    // Extract title from frontmatter or first H1
    let title = data.title;
    if (!title) {
      const h1Match = content.match(/^#\s+(.+)$/m);
      title = h1Match ? h1Match[1] : slug.charAt(0).toUpperCase() + slug.slice(1);
    }

    console.log(`   - ${slug} (${title})`);

    return {
      slug,
      title,
      description: data.description || '',
      order: data.order !== undefined ? data.order : 999,
      content: content
    };
  });

  // Sort pages by order
  pages.sort((a, b) => a.order - b.order);

  // Generate JavaScript file
  const output = generatePagesOutput(pages);

  fs.writeFileSync(OUTPUT_FILE, output);
  console.log(`✅ Processed ${pages.length} page(s)`);
  console.log(`📦 Output: ${OUTPUT_FILE}`);

  return pages;
}

async function generateMetadata(PROJECT_ROOT) {
  const PAGES_FILE = path.join(PROJECT_ROOT, 'content/pages.js');
  const OUTPUT_FILE = path.join(PROJECT_ROOT, 'content/metadata.js');

  console.log(`📋 Generating metadata...`);

  let pages = [];

  // Try to extract page metadata if pages.js exists
  if (fs.existsSync(PAGES_FILE)) {
    try {
      const pagesContent = fs.readFileSync(PAGES_FILE, 'utf8');
      const pagesMatch = pagesContent.match(/export const pages = (\[[\s\S]*?\]);/);
      if (pagesMatch) {
        pages = eval(pagesMatch[1]);
        pages = pages.map(({ slug, title, order }) => ({ slug, title, order }));
      }
    } catch (error) {
      console.warn('⚠️  Could not parse pages.js for metadata');
    }
  }

  const output = `// Auto-generated file - DO NOT EDIT MANUALLY
// This file is generated by: npx blog-engine process
// Generated at: ${new Date().toISOString()}

export const pages = ${JSON.stringify(pages, null, 2)};
`;

  fs.writeFileSync(OUTPUT_FILE, output);
  console.log(`✅ Generated metadata`);
  console.log(`📦 Output: ${OUTPUT_FILE}`);
}

function generatePostsOutput(posts) {
  return `// Auto-generated file - DO NOT EDIT MANUALLY
// This file is generated by: npx blog-engine process
// Generated at: ${new Date().toISOString()}

export const posts = ${JSON.stringify(posts, null, 2)};

export const getPostBySlug = (slug) => {
  return posts.find(post => post.slug === slug);
};

export const getPostsByCategory = (category) => {
  return posts.filter(post => post.category.toLowerCase() === category.toLowerCase());
};

export const getAllCategories = () => {
  return Array.from(new Set(posts.map(post => post.category)));
};

export const getAllTags = () => {
  const allTags = posts.flatMap(post => post.tags);
  return Array.from(new Set(allTags));
};

export const getPostsByTag = (tag) => {
  return posts.filter(post => post.tags.includes(tag));
};
`;
}

function generatePagesOutput(pages) {
  return `// Auto-generated file - DO NOT EDIT MANUALLY
// This file is generated by: npx blog-engine process
// Generated at: ${new Date().toISOString()}

export const pages = ${JSON.stringify(pages, null, 2)};

export const getPageBySlug = (slug) => {
  return pages.find(page => page.slug === slug);
};
`;
}

processContent().catch(error => {
  console.error('❌ Error processing content:', error.message);
  process.exit(1);
});
