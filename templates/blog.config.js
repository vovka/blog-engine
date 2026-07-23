export default {
  siteName: "My Blog",
  title: "My Blog",
  description: "A blog powered by blog-engine",
  author: "Blog Author",
  basePath: "/",
  comments: {
    provider: "giscus",
    repo: "",
    repoId: "",
    category: "Announcements",
    categoryId: "",
    canonicalBaseUrl: ""
  },
  analytics: {
    consent: {
      required: true,
      storageKey: "blog.analyticsConsent",
      policyVersion: "1",
      privacyPagePath: "/privacy"
    }
  }
};
