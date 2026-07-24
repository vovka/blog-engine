import { createHash } from 'node:crypto';

export const MERMAID_CLI_VERSION = '11.16.0';
export const MERMAID_BACKGROUND = 'transparent';
export const SVG_OUTPUT_POLICY = 'intrinsic-viewbox-v1';

export const FIXED_MERMAID_CONFIG = Object.freeze({
  securityLevel: 'strict',
  secure: [
    'secure',
    'securityLevel',
    'startOnLoad',
    'maxTextSize',
    'suppressErrorRendering',
    'maxEdges',
    'htmlLabels',
    'theme',
    'themeCSS',
    'themeVariables',
    'deterministicIds',
    'deterministicIDSeed',
  ],
  startOnLoad: false,
  htmlLabels: false,
  theme: 'default',
  deterministicIds: true,
});

const sha256 = value => createHash('sha256').update(value).digest('hex');

export const createRenderSpec = (definition, outputPolicy = SVG_OUTPUT_POLICY) => {
  const definitionHash = sha256(definition);
  const mermaidConfig = {
    ...FIXED_MERMAID_CONFIG,
    deterministicIDSeed: definitionHash,
  };
  const policy = JSON.stringify({
    background: MERMAID_BACKGROUND,
    output: outputPolicy,
    mermaidConfig,
  });
  return {
    assetHash: sha256(`${MERMAID_CLI_VERSION}\0${policy}\0${definition}`),
    mermaidConfig,
    svgId: `mermaid-${definitionHash}`,
  };
};

export const buildMermaidUrl = (basePath, assetHash) => {
  const prefix = basePath === '/' ? '' : `/${basePath.replace(/^\/|\/$/g, '')}`;
  return `${prefix}/mermaid/${assetHash}.svg`;
};
