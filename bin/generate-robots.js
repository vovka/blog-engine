import fs from 'node:fs';
import path from 'node:path';

export const buildRobots = ({ index = false, siteUrl = '' } = {}) => {
  const access = index ? 'Allow: /' : 'Disallow: /';
  const sitemap = siteUrl ? `\nSitemap: ${new URL('/sitemap.xml', siteUrl).href}` : '';
  return `User-agent: *\n${access}${sitemap}\n`;
};

export const writeRobots = (projectRoot, config) => {
  const output = path.join(projectRoot, 'public', 'robots.txt');
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, buildRobots(config));
  return output;
};
