const env = import.meta.env || {};
const optionalBoolean = value => value === undefined || value === '' ? undefined : value === 'true';

export default {
  siteName: "My Blog",
  title: "My Blog",
  description: "A blog powered by blog-engine",
  author: "Blog Author",
  basePath: "/",
  siteUrl: env.VITE_SITE_URL || "",
  robots: {
    profile: env.VITE_SITE_PROFILE || env.VITE_ANALYTICS_ENVIRONMENT || "production",
    index: optionalBoolean(env.VITE_ROBOTS_INDEX)
  },
  analytics: {
    enabled: env.VITE_ANALYTICS_ENABLED === "true",
    environment: env.VITE_ANALYTICS_ENVIRONMENT || "unknown",
    allowedHosts: (env.VITE_ANALYTICS_ALLOWED_HOSTS || "localhost").split(","),
    ga4MeasurementId: env.VITE_ANALYTICS_GA4_MEASUREMENT_ID || env.VITE_GA4_MEASUREMENT_ID || "",
    clarityProjectId: env.VITE_ANALYTICS_CLARITY_PROJECT_ID || env.VITE_CLARITY_PROJECT_ID || "",
    consent: {
      required: env.VITE_ANALYTICS_CONSENT_REQUIRED !== "false",
      storageKey: "blog.analyticsConsent",
      policyVersion: "1",
      privacyPagePath: "/privacy"
    }
  }
};
