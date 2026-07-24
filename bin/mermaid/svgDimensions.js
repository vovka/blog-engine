const NUMBER = String.raw`[-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[-+]?\d+)?`;
const VIEWBOX = new RegExp(
  String.raw`\bviewBox\s*=\s*(['"])\s*(${NUMBER})[\s,]+(${NUMBER})[\s,]+(${NUMBER})[\s,]+(${NUMBER})\s*\1`,
  'i',
);
const ROOT_SVG = /<svg\b([^>]*)>/i;
const SIZE_ATTRIBUTE = /\s(?:width|height)\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi;

export class InvalidMermaidViewBoxError extends Error {
  constructor() {
    super('Rendered Mermaid SVG requires a numeric viewBox with positive width and height');
    this.name = 'InvalidMermaidViewBoxError';
  }
}

export const normalizeMermaidSvgDimensions = svg => {
  const root = svg.match(ROOT_SVG);
  const viewBox = root?.[1].match(VIEWBOX);
  const width = Number(viewBox?.[4]);
  const height = Number(viewBox?.[5]);
  if (!viewBox || !Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    throw new InvalidMermaidViewBoxError();
  }
  const attributes = root[1].replace(SIZE_ATTRIBUTE, '');
  const normalized = `<svg${attributes} width="${viewBox[4]}" height="${viewBox[5]}">`;
  return svg.slice(0, root.index) + normalized + svg.slice(root.index + root[0].length);
};
