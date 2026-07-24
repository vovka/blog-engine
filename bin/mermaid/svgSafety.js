const ACTIVE_ELEMENT = /<(?:script|foreignObject|iframe|object|embed|a)\b/i;
const EVENT_ATTRIBUTE = /\son[a-z]+\s*=/i;
const RESOURCE_ATTRIBUTE = /\s(?:href|xlink:href|src)\s*=\s*(['"])(.*?)\1/gi;
const CSS_RESOURCE = /url\(\s*(['"]?)(.*?)\1\s*\)/gi;
const FORBIDDEN_CSS_REFERENCE = /(?:https?:|file:|javascript:|data:|ftp:|\/\/)/i;

const decodeNumericEntities = value => value.replace(
  /&#(?:x([0-9a-f]+)|([0-9]+));?/gi,
  (entity, hex, decimal) => {
    try {
      return String.fromCodePoint(Number.parseInt(hex || decimal, hex ? 16 : 10));
    } catch {
      return entity;
    }
  },
);

const decodeCssEscapes = value => value
  .replace(/\\\r?\n/g, '')
  .replace(/\\([0-9a-f]{1,6})(?:[ \t\r\n\f])?|\\(.)/gi, (_escape, hex, character) => (
    hex ? String.fromCodePoint(Number.parseInt(hex, 16)) : character
  ));

const findUnsafeReference = (content, pattern, normalize = value => value) => {
  for (const match of content.matchAll(pattern)) {
    const reference = normalize(match[2].trim());
    if (reference && !reference.startsWith('#')) return reference;
  }
  return null;
};

const cssContent = svg => {
  const styles = [...svg.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)]
    .map(match => match[1]);
  const attributes = [...svg.matchAll(/\sstyle\s*=\s*(['"])(.*?)\1/gi)]
    .map(match => match[2]);
  return decodeCssEscapes(decodeNumericEntities([...styles, ...attributes].join('\n')))
    .replace(/\/\*[\s\S]*?\*\//g, '');
};

const sanitizeClass = (_attribute, whitespace, quote, value) => {
  const tokens = value.split(/\s+/).filter(token => token && token !== 'clickable');
  return tokens.length ? `${whitespace}class=${quote}${tokens.join(' ')}${quote}` : '';
};

export class UnsafeMermaidSvgError extends Error {
  constructor(reason) {
    super(`Unsafe Mermaid SVG output: ${reason}`);
    this.name = 'UnsafeMermaidSvgError';
  }
}

export const sanitizeMermaidSvg = svg => svg
  .replace(/<a\b[^>]*>/gi, '')
  .replace(/<\/a>/gi, '')
  .replace(/(\s)class=(['"])(.*?)\2/gi, sanitizeClass);

export const assertSafeMermaidSvg = svg => {
  const tags = svg.match(/<[^>]+>/g)?.join('') ?? '';
  if (ACTIVE_ELEMENT.test(svg)) throw new UnsafeMermaidSvgError('active element');
  if (EVENT_ATTRIBUTE.test(tags)) throw new UnsafeMermaidSvgError('event attribute');
  const resource = findUnsafeReference(tags, RESOURCE_ATTRIBUTE, decodeNumericEntities);
  if (resource) throw new UnsafeMermaidSvgError(`external resource ${resource}`);
  const css = cssContent(svg);
  if (/@import\b/i.test(css)) throw new UnsafeMermaidSvgError('CSS import');
  if (FORBIDDEN_CSS_REFERENCE.test(css)) throw new UnsafeMermaidSvgError('external CSS reference');
  const cssResource = findUnsafeReference(css, CSS_RESOURCE);
  if (cssResource) throw new UnsafeMermaidSvgError(`external CSS resource ${cssResource}`);
};
