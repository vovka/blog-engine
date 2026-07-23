# Analytics And Discovery

## Overview

The engine provides consent-gated GA4 and Microsoft Clarity loading, SPA page views, article engagement events,
route metadata, and sitemap generation. Provider failures are isolated so one service can remain active.

## Key Files And Structure

- `src/components/analytics/AnalyticsProvider.jsx`: consent UI, lifecycle, and route tracking.
- `src/utils/consentMode.js`: Google Consent Mode v2 and Clarity consent commands.
- `src/utils/analyticsProviders.js`: independent provider script initialization.
- `src/components/analytics/ArticleAnalytics.jsx`: scroll, read, and outbound-link events.
- `src/components/analytics/PageMetadata.jsx`: route-specific title, canonical, social, and robots metadata.
- `bin/generate-sitemap.js`: canonical sitemap serialization.
- `bin/process-content.js`: content processing and sitemap orchestration.

## How It Works

`src/main.jsx` synchronously queues a denied Google Consent Mode v2 default before React or provider scripts run.
The provider reads the versioned preference. Acceptance sends a granted analytics update and starts GA4 and
Clarity independently. Rejection or reopening preferences sends denied updates, enables the GA disable flag,
clears GA cookies, and pauses route/article tracking.
Global Privacy Control forces rejection for the full page session and cannot be overridden by stored or UI choices.
Clarity receives `stop` on revocation and `start` before consent is granted again on the same page.

GA4 uses manual SPA `page_view` events. Article pages emit `article_scroll` at 25, 50, 75, and 90 percent,
`article_read` at 90 percent, `outbound_click` for external HTTP links, and `dialogue_toggle` for second-opinion
visibility. Outbound event URLs contain only origin and pathname. Custom event names are also sent to Clarity.

## Configuration

The generated `blog.config.js` template reads these values from the consuming content repository:

- `VITE_SITE_URL`
- `VITE_ANALYTICS_ENABLED`
- `VITE_ANALYTICS_ENVIRONMENT`
- `VITE_ANALYTICS_ALLOWED_HOSTS`
- `VITE_ANALYTICS_GA4_MEASUREMENT_ID`
- `VITE_ANALYTICS_CLARITY_PROJECT_ID`
- `VITE_ANALYTICS_CONSENT_REQUIRED`
- `VITE_SITE_PROFILE`
- `VITE_ROBOTS_INDEX`

`vite.config.js` sets `envDir` to the consuming repository. Keep test and production values in separate
deployment environments. The older `VITE_GA4_MEASUREMENT_ID` and `VITE_CLARITY_PROJECT_ID` names remain aliases.

`VITE_SITE_URL` is also read by `blog-engine process` to generate `public/sitemap.xml`. `siteUrl` in the exported
config is a fallback. Canonical metadata falls back to `comments.canonicalBaseUrl`, then the current origin.

Robots metadata defaults to `noindex,nofollow` for development, staging, and test profiles. Production remains
`index,follow`. Set `robots.index` through `VITE_ROBOTS_INDEX` for an explicit override; route-level noindex wins.

## Testing Strategy

Run `npm test` for config validation, exact consent commands, provider failure isolation, article event helpers,
canonical URL handling, and sitemap output. A full build must run from a consuming content repository because
the engine aliases `@config` and `@content/*` to files under `process.cwd()`.

For browser verification, check that no provider request occurs before acceptance, then confirm
`google-analytics.com/g/collect` and `clarity.ms/collect` requests after acceptance. Reopen preferences and verify
requests stop and GA cookies are removed. Disable GA history-based enhanced page views to avoid SPA duplicates.
Cookie removal covers the current hostname and parent-domain candidates used by GA.

## Important Patterns And Pitfalls

- Establish the Google denied default before calling any `gtag` config command.
- Preserve the exact Clarity keys `ad_Storage` and `analytics_Storage`.
- Always supply a canonical `VITE_SITE_URL` before generating a deployable sitemap.
- Search Console cannot validate localhost activity; submit the deployed `/sitemap.xml` instead.
- A package-root `npm run build` cannot resolve consumer-owned config/content and is not a valid build check.

## Known Issues Or Future Improvements

- The generated client bundle currently triggers Vite's large-chunk warning.
- Browser-level consent and event tests would complement the current deterministic Node test suite.

---
Last updated: 2026-07-23
