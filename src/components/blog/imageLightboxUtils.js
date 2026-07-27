const VIEWPORT_HORIZONTAL_PADDING = 48;
const VIEWPORT_VERTICAL_PADDING = 120;

export const MIN_ZOOM = 0.05;
export const MAX_ZOOM = 5;
export const ZOOM_STEP = 1.2;

export function clampZoom(value) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
}

export function calculateFitZoom(width, height, viewport = globalThis.window) {
  if (!width || !height || !viewport) return 1;

  const availableWidth = Math.max(1, viewport.innerWidth - VIEWPORT_HORIZONTAL_PADDING);
  const availableHeight = Math.max(1, viewport.innerHeight - VIEWPORT_VERTICAL_PADDING);

  return Math.min(1, availableWidth / width, availableHeight / height);
}

export function calculatePointerAnchor(clientX, clientY, rect) {
  if (!rect?.width || !rect?.height) return null;

  return {
    x: (clientX - rect.left) / rect.width,
    y: (clientY - rect.top) / rect.height,
  };
}

export function calculatePointerScrollDelta(clientX, clientY, anchor, rect) {
  if (!anchor || !rect) return { left: 0, top: 0 };

  return {
    left: rect.left + (rect.width * anchor.x) - clientX,
    top: rect.top + (rect.height * anchor.y) - clientY,
  };
}

export function calculateAxisCompensation(delta, scroll, maxScroll, offset = 0) {
  const visualOffset = offset - scroll - delta;
  const nextScroll = Math.min(maxScroll, Math.max(0, -visualOffset));

  return {
    scroll: nextScroll,
    offset: visualOffset + nextScroll,
  };
}

export function findFocusWrapTarget(event, focusable, active, containsActive) {
  if (!focusable.length) return null;

  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  const leavingStart = event.shiftKey && active === first;
  const leavingEnd = !event.shiftKey && active === last;

  if (!leavingStart && !leavingEnd && containsActive) return null;
  return event.shiftKey ? last : first;
}

export function getLightboxKeyAction(event, editing) {
  if (event.key === 'Escape') return 'close';
  if (editing || event.ctrlKey || event.metaKey || event.altKey) return null;

  if (event.key === '+' || event.key === '=') return 'zoom-in';
  if (event.key === '-') return 'zoom-out';
  if (event.key === '0') return 'fit';
  if (event.key === '1') return 'actual-size';
  return null;
}
