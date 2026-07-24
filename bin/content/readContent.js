import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import readingTime from 'reading-time';

const markdownFiles = (directory, recursive = false) => {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { recursive })
    .filter(name => name.endsWith('.md'))
    .map(name => path.join(directory, name))
    .sort();
};

const readMarkdown = filePath => {
  const source = fs.readFileSync(filePath, 'utf8');
  return { ...matter(source), sourcePath: filePath };
};

export const readPosts = projectRoot => markdownFiles(path.join(projectRoot, 'content/posts'), true)
  .map(filePath => {
    const { data, content, sourcePath } = readMarkdown(filePath);
    const slug = path.basename(filePath, '.md');
    return {
      sourcePath,
      originalContent: content,
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
      readingTime: readingTime(content).text,
    };
  })
  .sort((left, right) => new Date(right.date) - new Date(left.date));

const pageTitle = (data, content, slug) => {
  const heading = content.match(/^#\s+(.+)$/m);
  return data.title || heading?.[1] || `${slug.charAt(0).toUpperCase()}${slug.slice(1)}`;
};

export const readPages = projectRoot => markdownFiles(path.join(projectRoot, 'content/pages'))
  .map(filePath => {
    const { data, content, sourcePath } = readMarkdown(filePath);
    const slug = path.basename(filePath, '.md');
    return {
      sourcePath,
      originalContent: content,
      slug,
      title: pageTitle(data, content, slug),
      description: data.description || '',
      order: data.order ?? 999,
    };
  })
  .sort((left, right) => left.order - right.order);
