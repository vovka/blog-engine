import { useContext, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import MarkdownImageLinkContext from './MarkdownImageLinkContext';
import {
  ZOOM_STEP,
  calculateFitZoom,
  calculatePointerAnchor,
  calculatePointerScrollDelta,
  clampZoom,
  findFocusWrapTarget,
  getLightboxKeyAction,
} from './imageLightboxUtils';
import './ZoomableImage.css';

const FOCUSABLE_SELECTOR = 'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';

function trapFocus(event, lightbox) {
  if (event.key !== 'Tab' || !lightbox) return;

  const focusable = [...lightbox.querySelectorAll(FOCUSABLE_SELECTOR)];
  const active = document.activeElement;
  const target = findFocusWrapTarget(event, focusable, active, lightbox.contains(active));
  if (!target) return;

  event.preventDefault();
  target.focus();
}

function LightboxImage({
  alt = '',
  className = '',
  node: _node,
  onClick,
  onKeyDown,
  ...imageProps
}) {
  const [open, setOpen] = useState(false);
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
  const [fitZoom, setFitZoom] = useState(1);
  const [zoom, setZoom] = useState(1);
  const triggerRef = useRef(null);
  const lightboxRef = useRef(null);
  const viewportRef = useRef(null);
  const lightboxImageRef = useRef(null);
  const closeButtonRef = useRef(null);
  const zoomRef = useRef(1);
  const fitZoomRef = useRef(1);
  const fitSelectedRef = useRef(true);
  const hintId = useId();

  const close = () => setOpen(false);

  const openLightbox = event => {
    event?.preventDefault();
    event?.stopPropagation();
    setOpen(true);
  };

  const changeZoom = (nextZoom, fitSelected = false) => {
    const value = typeof nextZoom === 'function' ? nextZoom(zoomRef.current) : nextZoom;
    const clampedValue = clampZoom(value);

    fitSelectedRef.current = fitSelected;
    zoomRef.current = clampedValue;
    setZoom(clampedValue);
  };

  const zoomBy = factor => changeZoom(currentZoom => currentZoom * factor);

  const updateFitZoom = (width, height, resetZoom = false) => {
    const nextFitZoom = calculateFitZoom(width, height);

    fitZoomRef.current = nextFitZoom;
    setFitZoom(nextFitZoom);
    if (!resetZoom && !fitSelectedRef.current) return;

    fitSelectedRef.current = true;
    zoomRef.current = nextFitZoom;
    setZoom(nextFitZoom);
  };

  const handleInlineClick = event => {
    onClick?.(event);
    if (!event.defaultPrevented) openLightbox(event);
  };

  const handleInlineKeyDown = event => {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;

    if (event.key === 'Enter' || event.key === ' ') {
      openLightbox(event);
    }
  };

  const handleLightboxImageLoad = event => {
    const width = event.currentTarget.naturalWidth;
    const height = event.currentTarget.naturalHeight;

    setNaturalSize({ width, height });
    updateFitZoom(width, height, true);
  };

  const handleWheel = event => {
    if (!event.ctrlKey) return;

    event.preventDefault();

    const viewport = viewportRef.current;
    const image = lightboxImageRef.current;
    const currentZoom = zoomRef.current;
    const nextZoom = clampZoom(event.deltaY < 0 ? currentZoom * ZOOM_STEP : currentZoom / ZOOM_STEP);

    if (nextZoom === currentZoom) return;

    if (!viewport || !image) {
      changeZoom(nextZoom);
      return;
    }

    const anchor = calculatePointerAnchor(event.clientX, event.clientY, image.getBoundingClientRect());

    changeZoom(nextZoom);

    requestAnimationFrame(() => {
      const delta = calculatePointerScrollDelta(
        event.clientX,
        event.clientY,
        anchor,
        image.getBoundingClientRect(),
      );
      viewport.scrollLeft += delta.left;
      viewport.scrollTop += delta.top;
    });
  };

  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    const handleKeyDown = event => {
      if (event.key === 'Tab') {
        trapFocus(event, lightboxRef.current);
        return;
      }

      const editing = Boolean(
        event.target?.closest?.('input, textarea, select, [contenteditable="true"]'),
      );
      const action = getLightboxKeyAction(event, editing);
      if (!action || event.defaultPrevented) return;

      event.preventDefault();
      if (action === 'close') close();
      if (action === 'zoom-in') zoomBy(ZOOM_STEP);
      if (action === 'zoom-out') zoomBy(1 / ZOOM_STEP);
      if (action === 'fit') changeZoom(fitZoomRef.current, true);
      if (action === 'actual-size') changeZoom(1);
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
      triggerRef.current?.focus();
    };
  }, [open]);

  useEffect(() => {
    if (!open || !naturalSize.width || !naturalSize.height) return undefined;

    const handleResize = () => updateFitZoom(naturalSize.width, naturalSize.height);
    handleResize();
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [open, naturalSize.width, naturalSize.height]);

  useEffect(() => {
    if (!open) return undefined;

    const viewport = viewportRef.current;
    viewport?.addEventListener('wheel', handleWheel, { passive: false });

    return () => viewport?.removeEventListener('wheel', handleWheel);
  }, [open]);

  const imageWidth = naturalSize.width ? `${naturalSize.width * zoom}px` : 'auto';
  const zoomPercentage = Math.round(zoom * 100);
  const imageClassName = ['zoomable-image', className].filter(Boolean).join(' ');

  return (
    <>
      <img
        {...imageProps}
        ref={triggerRef}
        alt={alt}
        className={imageClassName}
        role="button"
        tabIndex={0}
        aria-label={`${alt || 'Image'}. Open full-size viewer`}
        onClick={handleInlineClick}
        onKeyDown={handleInlineKeyDown}
      />

      {open && createPortal(
        <div
          ref={lightboxRef}
          className="image-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={alt ? `Image viewer: ${alt}` : 'Image viewer'}
          aria-describedby={hintId}
        >
          <div className="image-lightbox__toolbar">
            <div className="image-lightbox__controls" aria-label="Image zoom controls">
              <button type="button" onClick={() => zoomBy(1 / ZOOM_STEP)} aria-label="Zoom out">−</button>
              <span className="image-lightbox__zoom" aria-live="polite">{zoomPercentage}%</span>
              <button type="button" onClick={() => zoomBy(ZOOM_STEP)} aria-label="Zoom in">+</button>
              <button type="button" onClick={() => changeZoom(fitZoom, true)}>Fit</button>
              <button type="button" onClick={() => changeZoom(1)}>100%</button>
            </div>
            <p id={hintId} className="image-lightbox__hint">Ctrl + wheel to zoom · scroll to pan</p>
            <button
              ref={closeButtonRef}
              type="button"
              className="image-lightbox__close"
              onClick={close}
              aria-label="Close image viewer"
            >
              ×
            </button>
          </div>

          <div ref={viewportRef} className="image-lightbox__viewport">
            <div className="image-lightbox__canvas">
              <img
                {...imageProps}
                ref={lightboxImageRef}
                alt={alt}
                className="image-lightbox__image"
                draggable="false"
                onLoad={handleLightboxImageLoad}
                style={{ width: imageWidth }}
              />
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}

function ZoomableImage({ node: _node, ...imageProps }) {
  const linked = useContext(MarkdownImageLinkContext);

  if (linked) return <img {...imageProps} />;
  return <LightboxImage {...imageProps} />;
}

export default ZoomableImage;
