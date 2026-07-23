const PRIVATE_PROFILES = new Set(['development', 'staging', 'test']);

export const resolveRobotsDirective = ({
  routeNoindex = false,
  profile = 'production',
  index,
} = {}) => {
  if (routeNoindex || index === false) return 'noindex,nofollow';
  if (index === true) return 'index,follow';
  return PRIVATE_PROFILES.has(profile.toLowerCase()) ? 'noindex,nofollow' : 'index,follow';
};

export const getRobotsConfig = config => ({
  profile: config.robots?.profile || config.analytics?.environment || 'production',
  index: config.robots?.index,
});
