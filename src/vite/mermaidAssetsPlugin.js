import fs from 'node:fs';
import path from 'node:path';

const HASHED_SVG = /^[a-f0-9]{64}\.svg$/;

export const isMermaidAssetName = name => HASHED_SVG.test(name);

const assetPrefix = basePath => {
  const base = basePath === '/' ? '' : `/${basePath.replace(/^\/|\/$/g, '')}`;
  return `${base}/mermaid/`;
};

const requestAsset = (requestUrl, basePath) => {
  const pathname = requestUrl.split(/[?#]/, 1)[0];
  const prefix = assetPrefix(basePath);
  if (!pathname.startsWith(prefix)) return { handled: false };
  const name = pathname.slice(prefix.length);
  return { handled: true, name: isMermaidAssetName(name) ? name : null };
};

const openAsset = filePath => {
  try {
    if (!fs.lstatSync(filePath).isFile() || !fs.constants.O_NOFOLLOW) return null;
    const file = fs.openSync(filePath, fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW);
    if (fs.fstatSync(file).isFile()) return file;
    fs.closeSync(file);
  } catch {
    return null;
  }
  return null;
};

const sendAsset = (request, response, filePath, file) => {
  response.statusCode = 200;
  response.setHeader('Content-Type', 'image/svg+xml');
  response.setHeader('X-Content-Type-Options', 'nosniff');
  if (request.method === 'HEAD') {
    fs.closeSync(file);
    return response.end();
  }
  fs.createReadStream(filePath, { fd: file, autoClose: true }).pipe(response);
};

const devMiddleware = (assetDirectory, basePath) => (request, response, next) => {
  const asset = requestAsset(request.url, basePath);
  if (!asset.handled) return next();
  if (!asset.name || !['GET', 'HEAD'].includes(request.method)) {
    response.statusCode = 404;
    return response.end();
  }
  const filePath = path.join(assetDirectory, asset.name);
  const file = openAsset(filePath);
  if (file === null) {
    response.statusCode = 404;
    return response.end();
  }
  return sendAsset(request, response, filePath, file);
};

const copyAssets = (source, destination) => {
  if (!fs.existsSync(source)) return;
  fs.mkdirSync(destination, { recursive: true });
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    if (entry.isFile() && isMermaidAssetName(entry.name)) {
      fs.copyFileSync(path.join(source, entry.name), path.join(destination, entry.name));
    }
  }
};

export const mermaidAssetsPlugin = (projectRoot, basePath = '/') => {
  const source = path.join(projectRoot, '.geek-blog', 'mermaid');
  return {
    name: 'geek-blog-mermaid-assets',
    configureServer(server) {
      server.middlewares.use(devMiddleware(source, basePath));
    },
    closeBundle() {
      copyAssets(source, path.join(projectRoot, 'dist', 'mermaid'));
    },
  };
};
