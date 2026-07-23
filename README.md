# Geek Blog Engine

This is the canonical public engine for Geek Blog content repositories. It renders Markdown with React and Vite,
owns analytics and discovery configuration, and bootstraps exact Yalc packages for local and CI builds.

## Ownership

- Canonical repository: `geek-blog/blog-engine`
- Fallback mirror: `vovka/blog-engine`
- License: ISC

Consumers must pin a 40-character commit from the canonical repository in `geek-blog.lock.json`. The mirror is
for recovery only and must never appear in an official dependency, lock, launcher, or workflow.

## Workspace

Content repositories keep `blog-engine` as `file:.yalc/blog-engine` and run:

```sh
npm run workspace -- setup
npm run dev
npm run build
npm run process
npm run preview
npm run enhance
npm run workspace -- doctor
npm run workspace -- update --engine <sha>
```

The repository launcher fetches the pinned public engine revision. The engine then validates Node 20, Git, lock
schema, repository identity, Yalc signatures, and the tracked npm lock before it runs the requested command.
`.yalc/`, `yalc.lock`, and `.geek-blog/` remain ignored.

The optional private enhancer uses GitHub CLI authentication locally. In customer-owned CI, set a fine-grained
read token as `GEEK_BLOG_TOKEN`.

## Configuration

The resolver applies safe defaults, then `blog.config.js`, then supported `VITE_*` overrides. Instance files own
branding, author, base path, comments, and consent policy. The engine owns environment parsing, provider IDs,
hosts, canonical URL, validation, and robots profiles.

Run `npm test` for deterministic configuration, analytics, sitemap, and workspace-contract tests.
