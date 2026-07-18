import assert from 'node:assert';
import { splitDialogueBlocks } from './splitDialogueBlocks.js';

assert.deepStrictEqual(splitDialogueBlocks('hello\nworld'), [
  { type: 'markdown', content: 'hello\nworld' }
]);

const withPair = [
  'intro',
  ':::dialogue',
  ':::primary',
  '## Heading',
  'my argument',
  ':::',
  ':::opponent',
  '> rebuttal',
  ':::',
  ':::',
  'outro'
].join('\n');
assert.deepStrictEqual(splitDialogueBlocks(withPair), [
  { type: 'markdown', content: 'intro' },
  { type: 'dialogue', primary: '## Heading\nmy argument', opponent: '> rebuttal' },
  { type: 'markdown', content: 'outro' }
]);

const primaryOnly = [':::dialogue', ':::primary', 'only side', ':::', ':::'].join('\n');
assert.deepStrictEqual(splitDialogueBlocks(primaryOnly), [
  { type: 'dialogue', primary: 'only side', opponent: '' }
]);

console.log('splitDialogueBlocks: all checks passed');
