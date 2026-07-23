import { SAFE_BLOG_DEFAULTS } from './defaults.js';
import { readEnvironmentOverrides } from './environment.js';
import { mergeConfig } from './mergeConfig.js';
import { validateBlogConfig } from './validation.js';

export class BlogConfigurationError extends Error {
  constructor(diagnostics) {
    super(`Invalid blog configuration:\n- ${diagnostics.join('\n- ')}`);
    this.name = 'BlogConfigurationError';
    this.diagnostics = diagnostics;
  }
}

const failClosed = config => mergeConfig(config, {
  robots: { index: false },
  analytics: {
    enabled: false,
    allowedHosts: [],
    ga4MeasurementId: '',
    clarityProjectId: '',
  },
});

export const resolveBlogConfigResult = (instance = {}, env = {}) => {
  const environment = readEnvironmentOverrides(env);
  const config = mergeConfig(SAFE_BLOG_DEFAULTS, instance, environment.overrides);
  const diagnostics = [...environment.diagnostics, ...validateBlogConfig(config)];
  return { config, diagnostics };
};

export const resolveBlogConfig = (instance = {}, env = {}, options = {}) => {
  const result = resolveBlogConfigResult(instance, env);
  if (!result.diagnostics.length) return result.config;
  if (options.strict) throw new BlogConfigurationError(result.diagnostics);
  options.warn?.(`Blog configuration failed closed:\n- ${result.diagnostics.join('\n- ')}`);
  return failClosed(result.config);
};
