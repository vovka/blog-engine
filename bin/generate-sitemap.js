import * as fs from 'node:fs';
import * as path from 'node:path';
import { buildCanonicalPath } from '../src/utils/pageMetadata.js';

const escapeXml = value => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&apos;');

const formatLastModified = value => {
  if (!value) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return String(value);
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.valueOf()) ? '' : date.toISOString();
};

const sitemapEntry = ({ url, lastModified }) => {
  const formattedDate = formatLastModified(lastModified);
  const lastmod = formattedDate ? `\n    <lastmod>${escapeXml(formattedDate)}</lastmod>` : '';
  return `  <url>\n    <loc>${escapeXml(url)}</loc>${lastmod}\n  </url>`;
};

export const buildSitemap = ({ posts = [], pages = [], siteUrl, basePath = '/' }) => {
  if (!siteUrl) throw new Error('siteUrl or VITE_SITE_URL is required to generate sitemap.xml');
  const canonicalUrl = route => new URL(buildCanonicalPath(route, basePath), siteUrl).href;
  const entries = [
    { url: canonicalUrl('/') },
    ...pages.map(page => ({ url: canonicalUrl(page.slug) })),
    ...posts.map(post => ({ url: canonicalUrl(post.slug), lastModified: post.date })),
  ];
  const unique = [...new Map(entries.map(entry => [entry.url, entry])).values()];
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...unique.map(sitemapEntry),
    '</urlset>',
    '',
  ].join('\n');
};

export const writeSitemap = (projectRoot, options) => {
  const publicDir = path.join(projectRoot, 'public');
  fs.mkdirSync(publicDir, { recursive: true });
  fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), buildSitemap(options));
};
