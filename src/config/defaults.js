export const SAFE_BLOG_DEFAULTS = {
  siteName: 'My Blog',
  title: 'My Blog',
  description: 'A blog powered by blog-engine',
  author: 'Blog Author',
  basePath: '/',
  siteUrl: '',
  robots: {
    profile: 'local',
    index: false,
  },
  analytics: {
    enabled: false,
    environment: 'local',
    allowedHosts: [],
    ga4MeasurementId: '',
    clarityProjectId: '',
    consent: {
      required: true,
      storageKey: 'blog.analyticsConsent',
      policyVersion: '1',
      privacyPagePath: '/privacy',
    },
  },
};
