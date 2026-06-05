"use client";

import { useEffect, useState, useCallback, useRef } from "react";

export default function ImageLightbox({ images, initialIndex = 0, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(false);
  const [slideDir, setSlideDir] = useState(null);
  const overlayRef = useRef(null);
  const closeRef = useRef(null);
  const prevRef = useRef(null);
  const nextRef = useRef(null);

  const goNext = useCallback(() => {
    setSlideDir("right");
    setCurrentIndex((i) => (i < images.length - 1 ? i + 1 : 0));
  }, [images.length]);

  const goPrev = useCallback(() => {
    setSlideDir("left");
    setCurrentIndex((i) => (i > 0 ? i - 1 : images.length - 1));
  }, [images.length]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") { e.stopPropagation(); onClose(); }
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, goNext, goPrev]);

  useEffect(() => {
    setZoom(false);
  }, [currentIndex]);

  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;
    const focusable = overlay.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const trap = (e) => {
      if (e.key === "Tab") {
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    overlay.addEventListener("keydown", trap);
    closeRef.current?.focus();
    return () => overlay.removeEventListener("keydown", trap);
  }, [currentIndex]);

  const current = images[currentIndex];
  if (!current) return null;

  const slideOffset = slideDir === "right" ? "translateX(6%)" : slideDir === "left" ? "translateX(-6%)" : "translateX(0)";

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/90 backdrop-blur-md select-none"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label="Image lightbox"
    >
      {/* Close button - top right */}
      <button
        ref={closeRef}
        onClick={onClose}
        className="fixed top-6 right-6 z-50 min-w-[48px] min-h-[48px] rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center text-white/80 hover:text-white transition-all border border-white/10"
        aria-label="Close lightbox"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Counter */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-5 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/10 text-white/80 text-sm font-medium tracking-wider">
        {currentIndex + 1} <span className="text-white/40 mx-1.5">/</span> {images.length}
      </div>

      {/* Previous button */}
      <button
        ref={prevRef}
        onClick={goPrev}
        className="fixed left-6 top-1/2 -translate-y-1/2 z-50 min-w-[48px] min-h-[48px] rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center text-white/80 hover:text-white transition-all border border-white/10"
        aria-label="Previous image"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Image */}
      <div
        className="relative w-full h-full flex items-center justify-center cursor-pointer"
        onClick={() => setZoom(!zoom)}
      >
        <div
          className="transition-all duration-500 ease-out"
          style={{
            transform: zoom ? "scale(2)" : "scale(1)",
            transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          <div
            className="transition-transform duration-400 ease-out"
            style={{
              transform: slideOffset,
              opacity: slideOffset === "translateX(0)" ? 1 : 0.4,
              transition: "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease",
            }}
            onTransitionEnd={() => setSlideDir(null)}
          >
            {current.type === "video" ? (
              <video
                src={current.url}
                className="max-h-[85vh] max-w-[90vw] object-contain"
                controls
                autoPlay
              />
            ) : (
              <img
                src={current.url}
                alt={`Image ${currentIndex + 1} of ${images.length}`}
                className="max-h-[85vh] max-w-[90vw] object-contain"
                draggable={false}
              />
            )}
          </div>
        </div>
      </div>

      {/* Next button */}
      <button
        ref={nextRef}
        onClick={goNext}
        className="fixed right-6 top-1/2 -translate-y-1/2 z-50 min-w-[48px] min-h-[48px] rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center text-white/80 hover:text-white transition-all border border-white/10"
        aria-label="Next image"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}
