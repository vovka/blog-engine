// Splits raw post Markdown on :::dialogue/:::primary/:::opponent blocks into
// an ordered list of { type: 'markdown', content } and
// { type: 'dialogue', primary, opponent } segments. Markers must sit on
// their own line; nesting is fixed at two levels (dialogue > primary/opponent).
// No Node-only imports here: this module ships to the browser (imported by
// DialogueContent.jsx). See splitDialogueBlocks.selfcheck.mjs for the test.
export function splitDialogueBlocks(markdown) {
  const lines = markdown.split('\n');
  const segments = [];
  let buffer = [];

  const flushMarkdown = () => {
    if (buffer.length) segments.push({ type: 'markdown', content: buffer.join('\n') });
    buffer = [];
  };

  let i = 0;
  while (i < lines.length) {
    if (lines[i].trim() !== ':::dialogue') {
      buffer.push(lines[i]);
      i++;
      continue;
    }

    flushMarkdown();
    i++;
    let primary = '';
    let opponent = '';
    while (i < lines.length && lines[i].trim() !== ':::') {
      const marker = lines[i].trim();
      if (marker === ':::primary' || marker === ':::opponent') {
        i++;
        const start = i;
        while (i < lines.length && lines[i].trim() !== ':::') i++;
        const text = lines.slice(start, i).join('\n');
        if (marker === ':::primary') primary = text; else opponent = text;
      }
      i++;
    }
    i++; // skip the :::dialogue block's closing :::
    segments.push({ type: 'dialogue', primary, opponent });
  }
  flushMarkdown();
  return segments;
}
