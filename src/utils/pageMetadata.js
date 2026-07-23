const trimSlashes = value => String(value || '').replace(/^\/+|\/+$/g, '');

export const buildCanonicalPath = (canonicalPath, basePath = '/') => {
  const path = trimSlashes(canonicalPath);
  const base = trimSlashes(basePath);
  return `/${[base, path].filter(Boolean).join('/')}`;
};

export const buildCanonicalUrl = (canonicalPath, config, origin) => {
  const siteUrl = config.siteUrl || config.comments?.canonicalBaseUrl || origin;
  const path = buildCanonicalPath(canonicalPath, config.basePath);
  return new URL(path, siteUrl).href;
};
