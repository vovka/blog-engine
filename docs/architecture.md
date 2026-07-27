# Canonical Engine Architecture

## Repository Roles

`geek-blog/blog-engine` is authoritative and public under ISC. `geek-blog/blog-enhancer` is private proprietary
tooling.

## Consumer Flow

1. A content repository reads `geek-blog.lock.json`.
2. Its dependency-free launcher fetches the exact canonical engine commit into the per-user cache.
3. That engine revision validates the workspace and publishes itself with Yalc signatures.
4. Yalc hydrates `.yalc/blog-engine` from a project-isolated store.
5. The engine verifies Yalc and tracked npm locks before `npm ci`.
6. `dev` and `build` process content before starting Vite.
7. `enhance` separately checks private GitHub access and installs the pinned enhancer in an ignored tool workspace.

No workflow rewrites a manifest, deletes the tracked npm lock, follows a branch, or embeds credentials.

## Configuration

The shared resolver applies safe engine defaults, thin instance configuration, then whitelisted environment
overrides. Instance configuration owns brand text, author, base path, Giscus destination, and consent policy.
Environment parsing, canonical URL, analytics hosts and IDs, and robots profile live in the engine.

Analytics is disabled and indexing is denied by default. Development and test diagnostics fail closed. Vite
production builds reject malformed canonical URLs, hosts, provider IDs, indexing settings, and consent settings.
Content processing derives both `public/robots.txt` and `public/sitemap.xml` from the same resolved configuration.

## Release

Consumers update explicit canonical SHAs through `workspace update`.
