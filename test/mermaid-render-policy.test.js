import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildMermaidUrl,
  createRenderSpec,
  FIXED_MERMAID_CONFIG,
  MERMAID_BACKGROUND,
  MERMAID_CLI_VERSION,
  SVG_OUTPUT_POLICY,
} from '../bin/mermaid/renderPolicy.js';

test('pins the renderer and strict deterministic policy', () => {
  const spec = createRenderSpec('flowchart LR\nA --> B');

  assert.equal(MERMAID_CLI_VERSION, '11.16.0');
  assert.equal(MERMAID_BACKGROUND, 'transparent');
  assert.equal(FIXED_MERMAID_CONFIG.securityLevel, 'strict');
  assert.equal(FIXED_MERMAID_CONFIG.htmlLabels, false);
  assert.equal(FIXED_MERMAID_CONFIG.theme, 'default');
  assert.equal(FIXED_MERMAID_CONFIG.deterministicIds, true);
  assert.ok(FIXED_MERMAID_CONFIG.secure.includes('themeCSS'));
  assert.match(spec.assetHash, /^[a-f0-9]{64}$/);
  assert.match(spec.mermaidConfig.deterministicIDSeed, /^[a-f0-9]{64}$/);
  assert.equal(spec.svgId, `mermaid-${spec.mermaidConfig.deterministicIDSeed}`);
});

test('content-addresses definitions and joins base paths', () => {
  const first = createRenderSpec('flowchart LR\nA --> B');
  const repeated = createRenderSpec('flowchart LR\nA --> B');
  const changed = createRenderSpec('flowchart LR\nA --> C');

  assert.deepEqual(repeated, first);
  assert.notEqual(changed.assetHash, first.assetHash);
  assert.equal(buildMermaidUrl('/', first.assetHash), `/mermaid/${first.assetHash}.svg`);
  assert.equal(buildMermaidUrl('/blog/', first.assetHash), `/blog/mermaid/${first.assetHash}.svg`);
});

test('includes the explicit SVG output policy in the asset hash', () => {
  const definition = 'flowchart LR\nA --> B';
  const defaultSpec = createRenderSpec(definition);
  const explicit = createRenderSpec(definition, SVG_OUTPUT_POLICY);
  const alternate = createRenderSpec(definition, 'alternate-output-policy');

  assert.equal(SVG_OUTPUT_POLICY, 'intrinsic-viewbox-v1');
  assert.equal(defaultSpec.assetHash, explicit.assetHash);
  assert.notEqual(defaultSpec.assetHash, alternate.assetHash);
});
