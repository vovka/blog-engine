# Repository Guidance

`geek-blog/blog-engine` is the canonical public ISC-licensed engine.

- Never add an official dependency on `vovka/blog-engine`; it is fallback-only.
- Keep consumer dependencies as `file:.yalc/blog-engine`.
- Require exact 40-character canonical commit pins in `geek-blog.lock.json`.
- Keep substantive bootstrap behavior in `bin/workspace/`; launchers must stay dependency-free and small.
- Use exactly `yalc@1.0.0-pre.53` with a project-isolated store and signature verification.
- Keep `.yalc/`, `yalc.lock`, and `.geek-blog/` ignored while tracking `package-lock.json`.
- Preserve legacy `VITE_SITE_*` and `VITE_ANALYTICS_*` names in the engine resolver.
- Analytics must default off, non-production environments must fail closed, and production builds must reject
  malformed deployment configuration.
- The private enhancer is optional. Never place credentials in manifests, repository URLs, logs, caches, or
  artifacts.
- Update `docs/features/` after changing configuration, workspace bootstrap, analytics, or discovery behavior.
