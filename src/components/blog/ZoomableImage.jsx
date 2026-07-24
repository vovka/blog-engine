import { useContext, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import MarkdownImageLinkContext from './MarkdownImageLinkContext';
import {
  ZOOM_STEP,
  calculateAxisCompensation,
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
  const [imageOffset, setImageOffset] = useState({ x: 0, y: 0 });
  const triggerRef = useRef(null);
  const lightboxRef = useRef(null);
  const viewportRef = useRef(null);
  const lightboxImageRef = useRef(null);
  const closeButtonRef = useRef(null);
  const zoomRef = useRef(1);
  const fitZoomRef = useRef(1);
  const fitSelectedRef = useRef(true);
  const imageOffsetRef = useRef({ x: 0, y: 0 });
  const positionResetFrameRef = useRef(null);
  const pointerZoomFrameRef = useRef(null);
  const pointerZoomRef = useRef(null);
  const hintId = useId();

  const clearPositionReset = () => {
    if (positionResetFrameRef.current === null) return;

    cancelAnimationFrame(positionResetFrameRef.current);
    positionResetFrameRef.current = null;
  };

  const clearPointerZoom = () => {
    pointerZoomRef.current = null;
    if (pointerZoomFrameRef.current === null) return;

    cancelAnimationFrame(pointerZoomFrameRef.current);
    pointerZoomFrameRef.current = null;
  };

  const resetImagePosition = () => {
    clearPositionReset();
    clearPointerZoom();
    imageOffsetRef.current = { x: 0, y: 0 };
    setImageOffset(imageOffsetRef.current);

    positionResetFrameRef.current = requestAnimationFrame(() => {
      const viewport = viewportRef.current;
      positionResetFrameRef.current = null;
      if (!viewport) return;

      viewport.scrollLeft = (viewport.scrollWidth - viewport.clientWidth) / 2;
      viewport.scrollTop = (viewport.scrollHeight - viewport.clientHeight) / 2;
    });
  };

  const close = () => {
    clearPositionReset();
    clearPointerZoom();
    setOpen(false);
  };

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
    if (fitSelected) {
      resetImagePosition();
    } else {
      clearPositionReset();
    }
  };

  const zoomBy = factor => changeZoom(currentZoom => currentZoom * factor);

  const updateFitZoom = (width, height, resetZoom = false) => {
    const nextFitZoom = calculateFitZoom(width, height);

    fitZoomRef.current = nextFitZoom;
    setFitZoom(nextFitZoom);
    if (!resetZoom && !fitSelectedRef.current) return;

    resetImagePosition();
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

    clearPositionReset();
    if (!pointerZoomRef.current) {
      pointerZoomRef.current = {
        anchor: calculatePointerAnchor(event.clientX, event.clientY, image.getBoundingClientRect()),
        clientX: event.clientX,
        clientY: event.clientY,
      };
    }

    changeZoom(nextZoom);
    if (pointerZoomFrameRef.current !== null) return;

    pointerZoomFrameRef.current = requestAnimationFrame(() => {
      const pointerZoom = pointerZoomRef.current;
      pointerZoomFrameRef.current = null;
      pointerZoomRef.current = null;
      if (!pointerZoom) return;

      const delta = calculatePointerScrollDelta(
        pointerZoom.clientX,
        pointerZoom.clientY,
        pointerZoom.anchor,
        image.getBoundingClientRect(),
      );
      const horizontal = calculateAxisCompensation(
        delta.left,
        viewport.scrollLeft,
        Math.max(0, viewport.scrollWidth - viewport.clientWidth),
        imageOffsetRef.current.x,
      );
      const vertical = calculateAxisCompensation(
        delta.top,
        viewport.scrollTop,
        Math.max(0, viewport.scrollHeight - viewport.clientHeight),
        imageOffsetRef.current.y,
      );

      viewport.scrollLeft = horizontal.scroll;
      viewport.scrollTop = vertical.scroll;
      imageOffsetRef.current = {
        x: horizontal.offset + viewport.scrollLeft - horizontal.scroll,
        y: vertical.offset + viewport.scrollTop - vertical.scroll,
      };
      setImageOffset(imageOffsetRef.current);
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
      clearPositionReset();
      clearPointerZoom();
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
                style={{
                  width: imageWidth,
                  transform: `translate(${imageOffset.x}px, ${imageOffset.y}px)`,
                }}
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
