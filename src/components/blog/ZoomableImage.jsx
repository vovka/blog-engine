import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './ZoomableImage.css';

const MIN_ZOOM = 0.05;
const MAX_ZOOM = 5;
const ZOOM_STEP = 1.2;
const VIEWPORT_HORIZONTAL_PADDING = 48;
const VIEWPORT_VERTICAL_PADDING = 120;

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

function calculateFitZoom(width, height) {
  if (!width || !height || typeof window === 'undefined') return 1;

  const availableWidth = Math.max(1, window.innerWidth - VIEWPORT_HORIZONTAL_PADDING);
  const availableHeight = Math.max(1, window.innerHeight - VIEWPORT_VERTICAL_PADDING);

  return Math.min(1, availableWidth / width, availableHeight / height);
}

function ZoomableImage({
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
  const viewportRef = useRef(null);
  const closeButtonRef = useRef(null);
  const fitZoomRef = useRef(1);
  const hintId = useId();

  const close = () => setOpen(false);

  const openLightbox = event => {
    event?.preventDefault();
    event?.stopPropagation();
    setOpen(true);
  };

  const changeZoom = nextZoom => {
    setZoom(currentZoom => {
      const value = typeof nextZoom === 'function' ? nextZoom(currentZoom) : nextZoom;
      return clamp(value, MIN_ZOOM, MAX_ZOOM);
    });
  };

  const zoomBy = factor => changeZoom(currentZoom => currentZoom * factor);

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
    const nextFitZoom = calculateFitZoom(width, height);

    fitZoomRef.current = nextFitZoom;
    setNaturalSize({ width, height });
    setFitZoom(nextFitZoom);
    setZoom(nextFitZoom);
  };

  const handleWheel = event => {
    if (!event.ctrlKey) return;

    event.preventDefault();

    const viewport = viewportRef.current;
    const currentZoom = zoom;
    const nextZoom = clamp(
      event.deltaY < 0 ? currentZoom * ZOOM_STEP : currentZoom / ZOOM_STEP,
      MIN_ZOOM,
      MAX_ZOOM,
    );

    if (nextZoom === currentZoom) return;

    if (!viewport) {
      setZoom(nextZoom);
      return;
    }

    const rect = viewport.getBoundingClientRect();
    const pointerX = event.clientX - rect.left;
    const pointerY = event.clientY - rect.top;
    const contentX = viewport.scrollLeft + pointerX;
    const contentY = viewport.scrollTop + pointerY;
    const ratio = nextZoom / currentZoom;

    setZoom(nextZoom);

    requestAnimationFrame(() => {
      viewport.scrollLeft = contentX * ratio - pointerX;
      viewport.scrollTop = contentY * ratio - pointerY;
    });
  };

  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    const handleKeyDown = event => {
      if (event.key === 'Escape') close();
      if (event.key === '+' || event.key === '=') zoomBy(ZOOM_STEP);
      if (event.key === '-') zoomBy(1 / ZOOM_STEP);
      if (event.key === '0') changeZoom(fitZoomRef.current);
      if (event.key === '1') changeZoom(1);
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
      triggerRef.current?.focus();
    };
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
              <button type="button" onClick={() => changeZoom(fitZoom)}>Fit</button>
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

          <div ref={viewportRef} className="image-lightbox__viewport" onWheel={handleWheel}>
            <div className="image-lightbox__canvas">
              <img
                {...imageProps}
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

export default ZoomableImage;
