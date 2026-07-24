const OPENING_FENCE = /^ {0,3}(`{3,}|~{3,})(.*)$/;

const readLines = markdown => [...markdown.matchAll(/.*(?:\r\n|\n|$)/g)]
  .filter(match => match[0])
  .map(match => ({
    raw: match[0],
    text: match[0].replace(/\r?\n$/, ''),
    start: match.index,
  }));

const closingFence = (line, marker) => {
  const escaped = marker[0] === '`' ? '`' : '~';
  return new RegExp(`^ {0,3}${escaped}{${marker.length},}[ \\t]*$`).test(line);
};

const createBlock = (lines, start, end, ordinal) => ({
  definition: lines.slice(start + 1, end).map(line => line.raw).join('').replace(/\r?\n$/, ''),
  start: lines[start].start,
  end: lines[end].start + lines[end].raw.length,
  lineEnding: lines[end].raw.match(/\r?\n$/)?.[0] ?? '',
  startLine: start + 1,
  ordinal,
});

export const findMermaidBlocks = markdown => {
  const lines = readLines(markdown);
  const blocks = [];
  for (let index = 0; index < lines.length; index += 1) {
    const opening = lines[index].text.match(OPENING_FENCE);
    if (!opening || opening[2].trim() !== 'mermaid') continue;
    const end = lines.findIndex((line, candidate) => (
      candidate > index && closingFence(line.text, opening[1])
    ));
    if (end < 0) continue;
    blocks.push(createBlock(lines, index, end, blocks.length + 1));
    index = end;
  }
  return blocks;
};

export const replaceMermaidBlocks = (markdown, blocks, replacements) => {
  let cursor = 0;
  return blocks.map((block, index) => {
    const prefix = markdown.slice(cursor, block.start);
    cursor = block.end;
    return `${prefix}${replacements[index]}${block.lineEnding}`;
  }).join('') + markdown.slice(cursor);
};

const escapeAlt = value => value.replace(/[[\]\\]/g, '\\$&').replace(/\r?\n/g, ' ');

export const createMarkdownImage = (alt, url) => `![${escapeAlt(alt)}](${url})`;

export const selectAccessibleText = ({ desc, title, fallback }) => (
  desc?.trim() || title?.trim() || fallback
);
