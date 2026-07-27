# Workspace Bootstrap

## Overview

The workspace CLI makes an exact canonical engine revision responsible for Yalc hydration, npm installation,
content processing, builds, previews, diagnostics, updates, and optional enhancer setup.

## Key Files And Structure

- `bin/workspace.js`: dependency-free command entry point.
- `bin/workspace/lock.js`: schema, repository, package, command, and SHA validation.
- `bin/workspace/git.js`: immutable per-user source checkouts keyed by repository and SHA.
- `bin/workspace/yalc.js`: exact Yalc execution, project copies, and signature checks.
- `bin/workspace/npm.js`: tracked lock validation and clean installation.
- `bin/workspace/setup.js`: idempotent warm/fresh setup.
- `bin/workspace/enhancer.js`: private entitlement and isolated tool installation.
- `bin/workspace/update.js`: explicit pin and npm-lock updates.

## Core Concepts

`geek-blog.lock.json` schema 1 identifies the canonical public engine and optional private enhancer with exact
40-character commits. Branches and tags are never resolved. The public engine origin must be
`https://github.com/geek-blog/blog-engine.git`.

Yalc is always invoked as `yalc@1.0.0-pre.53` with `--sig` and a project-isolated store. `.yalc/` and `yalc.lock`
are runtime state; `package-lock.json` is reviewed source. Signature agreement is checked across `yalc.lock`,
`yalc.sig`, and the copied package manifest. A separate digest catches later copy corruption. Its boundary is the
published package payload: `node_modules/` directories created inside `.yalc/<package>` during installation are
excluded, while changes to published source, metadata, signatures, and other payload files remain detectable.

## How It Works

`setup` validates Node 20, Linux/macOS/WSL2, Git, npm, ignore rules, the lock, and the `file:.yalc/blog-engine`
dependency. A valid warm state is reused. Otherwise the exact source is published, the project copy is hydrated,
the npm lock is checked, and `npm ci` runs.

`dev` runs setup, processing, and Vite. `build` uses the same sequence with strict production configuration.
`update` accepts explicit engine or enhancer SHAs, rehydrates, regenerates the npm lock, and leaves the JSON lock
and npm lock as reviewable changes.

`enhance` maps `GEEK_BLOG_TOKEN` to `GH_TOKEN` only for GitHub subprocesses in CI. Local users authenticate with
`gh auth`. Access is verified before cloning the exact private SHA. Credentials are never written to disk.

## Testing Strategy

Unit tests cover lock validation, argument parsing, config precedence, aliases, safe defaults, and strict failures.
Contract tests use Node 20 to cover clean and warm setup, corrupt Yalc state, stale npm locks, wrong SHAs, cache
remote mismatch, inaccessible enhancer access, and blogs pinned to different commits.

## Important Patterns And Pitfalls

- A new engine commit changes the Yalc signature and therefore requires a reviewed npm-lock update.
- `npm ci` must run only after `.yalc/blog-engine` exists.
- Do not include install-time `node_modules/` trees in the hydrated package digest; npm can create them after the
  setup state is recorded.
- Do not repair a mismatched cache origin silently; report the cache path.
- Do not add the enhancer to the content repository's root runtime dependencies.

---
Last updated: 2026-07-24
