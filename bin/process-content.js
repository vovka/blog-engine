#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadEnv } from 'vite';
import { loadBlogConfig } from '../src/config/loadBlogConfig.js';
import { ContentBuildTransaction } from './content/ContentBuildTransaction.js';
import { createGeneratedModules } from './content/generatedModules.js';
import { generateDiscovery } from './content/discovery.js';
import { readPages, readPosts } from './content/readContent.js';
import { MermaidBuildSession } from './mermaid/MermaidBuildSession.js';

export const findProjectRoot = (start = process.cwd()) => {
  let directory = start;
  while (directory !== path.dirname(directory)) {
    if (fs.existsSync(path.join(directory, 'content'))) return directory;
    directory = path.dirname(directory);
  }
  throw new Error('Could not find content/ directory. Make sure you run this from a blog-content project.');
};

const loadConfig = async projectRoot => {
  const env = loadEnv(process.env.NODE_ENV || 'production', projectRoot, '');
  return loadBlogConfig(projectRoot, { ...process.env, ...env }, {
    strict: process.env.GEEK_BLOG_STRICT_CONFIG === '1',
    warn: console.warn,
  });
};

const transformRecords = (records, session) => Promise.all(records.map(async record => {
  const { sourcePath, originalContent, ...generated } = record;
  const content = await session.transform({
    markdown: originalContent,
    sourcePath,
    title: record.title,
  });
  return { ...generated, content };
}));

const defaultSessionFactory = options => new MermaidBuildSession(options);
const defaultTransactionFactory = projectRoot => new ContentBuildTransaction(projectRoot);

export async function processContent(projectRoot = findProjectRoot(), dependencies = {}) {
  const config = await (dependencies.loadConfig || loadConfig)(projectRoot);
  const sourcePosts = readPosts(projectRoot);
  const sourcePages = readPages(projectRoot);
  const session = (dependencies.sessionFactory || defaultSessionFactory)({
    projectRoot,
    basePath: config.basePath,
  });
  try {
    const [posts, pages] = await Promise.all([
      transformRecords(sourcePosts, session),
      transformRecords(sourcePages, session),
    ]);
    await session.close();
    const discovery = await (dependencies.generateDiscovery || generateDiscovery)(
      projectRoot,
      posts,
      pages,
      config,
    ) || {};
    const mermaidStage = await session.prepareForCommit();
    const transaction = (dependencies.transactionFactory || defaultTransactionFactory)(projectRoot);
    await transaction.commit(mermaidStage, {
      ...createGeneratedModules(posts, pages),
      ...discovery,
    });
    console.log('✅ Generated robots.txt');
    if (!config.siteUrl) console.warn('⚠️  Skipped sitemap.xml: configure siteUrl or VITE_SITE_URL');
    console.log(`✅ Processed ${posts.length} blog post(s) and ${pages.length} page(s)`);
    return { posts, pages };
  } catch (error) {
    await session.abort();
    throw error;
  }
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isMain) {
  processContent().catch(error => {
    console.error('❌ Error processing content:', error.message);
    process.exitCode = 1;
  });
}
