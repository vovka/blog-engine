# Image Lightbox

## Overview

Article-cover and article-body Markdown images open in a full-screen lightbox. The trigger is mouse- and
keyboard-accessible, while the viewer supports zooming, scrolling, body-scroll locking, and focus restoration.
Blog-card images, author avatars, and static-page Markdown images remain ordinary images.

## Purpose

The lightbox lets readers inspect article imagery without adding a package dependency or changing content,
configuration, the engine version, or the workspace lock schema.

## Key Files And Structure

- `src/components/blog/ZoomableImage.jsx`: accessible trigger, portal dialog, zoom state, keyboard behavior, and
  scroll-lock lifecycle.
- `src/components/blog/ZoomableImage.css`: trigger focus treatment, full-screen layout, toolbar, scrolling canvas,
  and narrow-viewport layout.
- `src/components/blog/imageLightboxUtils.js`: testable fit, pointer-anchor, focus-wrap, and keyboard policies.
- `src/components/blog/MarkdownImageLinkContext.js`: identifies images rendered inside Markdown links.
- `src/components/blog/MarkdownVideoLink.jsx`: preserves normal navigation for linked Markdown images.
- `src/components/blog/markdownConfig.js`: registers `ZoomableImage` as the shared article Markdown `img` renderer.
- `src/components/blog/BlogPostHeader.jsx`: renders an article's cover image through `ZoomableImage`.
- `src/pages/BlogPost.jsx`, `src/components/blog/DialogueContent.jsx`, and
  `src/components/blog/DialoguePair.jsx`: consume the shared Markdown component map.

## How It Works

`ZoomableImage` renders the original inline image as a focusable button-like trigger. Click, Enter, or Space opens
a modal dialog in a `document.body` portal. The dialog measures the lightbox image's natural dimensions and starts
at the smaller of 100% or the zoom needed to fit within the viewport padding. Small images therefore retain their
natural size, while oversized images fit the available viewport.

Toolbar buttons zoom out, zoom in, restore the fit zoom, or select 100%. The displayed zoom percentage is announced
as live status. A non-passive native wheel listener makes Ctrl+wheel zoom around the same image point under the
pointer. Scroll range supplies that compensation first; a temporary image offset retains any residual on centered
or scroll-bound axes and returns to scrolling when range becomes available. Regular scrolling pans overflowed
content. The keyboard shortcuts are Escape to close, `+` or `=` to zoom in, `-` to zoom out, `0` to fit, and `1`
for 100%. Modified shortcuts are left to the browser.

Opening locks body scrolling and focuses the close button. Closing restores the previous body overflow value and
focuses the originating image. Tab and Shift+Tab wrap within the dialog. Fit clears pointer offsets and re-centers
the image after layout. It is recalculated after a resize or orientation change, and remains selected across that
change only when the reader had not chosen another zoom. Zoom is clamped from 5% through 500%.

## Integration Points

Article-body Markdown uses `markdownComponents` for standard and dialogue layouts, so its images receive the
lightbox automatically. When an image is inside a Markdown link, `MarkdownVideoLink` supplies link context and the
image remains a normal link target rather than becoming a nested button-like trigger. `BlogPostHeader` opts article
covers in directly. `BlogCard`, author-avatar rendering, and `StaticPage` are intentionally unchanged.

## Configuration

There are no public configuration keys. Viewport padding, zoom bounds, and the 1.2 zoom step are private
implementation constants in `imageLightboxUtils.js`.

## Testing Strategy

Run `npm test` for fit sizing, pointer anchoring, focus wrapping, shortcut filtering, linked-image semantics, and
the engine's existing Node suite. Run `npm run build` for a standalone engine build; consumer content aliases fall
back to the engine's empty content modules.

In a browser, exercise small and oversized raster images, SVGs, article covers, regular Markdown, and dialogue
Markdown. Verify toolbar actions, all keyboard shortcuts, Enter/Space activation, Escape close, Ctrl+wheel
pointer-centered zoom, scrolling at enlarged sizes, focus restoration, body-scroll restoration, and the toolbar at
widths below 720px. Confirm cards, avatars, and static-page images do not open the viewer.

## Important Patterns And Pitfalls

- Preserve caller `onClick` and `onKeyDown` handlers; a caller can cancel opening with `preventDefault()`.
- Keep the natural dimensions as the basis for zoom calculations rather than the inline rendered size.
- Keep the lightbox in a body portal so article layout and overflow containers do not clip it.
- Restore the exact pre-existing body overflow value during effect cleanup.
- Update both the fit state and its ref after image load so toolbar and document-level shortcuts use the same value.
- Register Ctrl+wheel natively with `{ passive: false }`; React 19 delegates wheel events passively.
- Compensate pointer zoom per axis so scroll clamping leaves an explicit image offset rather than losing the anchor.
- Coalesce same-frame wheel events around their first stable pointer anchor before applying the final compensation.
- Keep linked Markdown images as links to avoid nesting a button-like image trigger inside an anchor.
- Keep the cover focus outline inset because `.blog-post-image` clips overflow.
- The viewer is browser-only; `calculateFitZoom` guards access to `window`.
- Preserve the full transplant sequence. Source commit `5a9348d` imports the stylesheet added by the following
  `52ae381`, so that intermediate source commit is not independently buildable even though the final range is.

## Known Issues Or Future Improvements

- Helper and server-rendered Markdown policies have deterministic tests, but full DOM interaction remains browser
  smoke coverage.

---
Last updated: 2026-07-24
