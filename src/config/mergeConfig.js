const isObject = value => value && typeof value === 'object' && !Array.isArray(value);

export const mergeConfig = (...sources) => sources.reduce((result, source) => {
  if (!isObject(source)) return result;
  Object.entries(source).forEach(([key, value]) => {
    result[key] = isObject(value) ? mergeConfig(result[key], value) : value;
  });
  return result;
}, {});
