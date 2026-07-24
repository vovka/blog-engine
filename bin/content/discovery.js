import { buildSitemap } from '../generate-sitemap.js';
import { buildRobots } from '../generate-robots.js';

export const createDiscoveryModules = (posts, pages, config) => {
  const modules = {
    'public/robots.txt': buildRobots({
      index: config.robots?.index,
      siteUrl: config.siteUrl,
    }),
  };
  if (config.siteUrl) {
    modules['public/sitemap.xml'] = buildSitemap({
      posts,
      pages,
      siteUrl: config.siteUrl,
      basePath: config.basePath,
    });
  }
  return modules;
};

export const generateDiscovery = (_projectRoot, posts, pages, config) => (
  createDiscoveryModules(posts, pages, config)
);
