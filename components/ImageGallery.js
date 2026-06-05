"use client";

import { useEffect, useState, useCallback } from "react";
import OptimizedImage from "./OptimizedImage";

export default function ImageGalleryLightbox({ images, startIndex = 0, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [zoom, setZoom] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });

  const handleMouseMove = (e) => {
    if (!zoom) return;
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setMousePos({ x, y });
  };

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") setCurrentIndex((i) => (i > 0 ? i - 1 : images.length - 1));
      if (e.key === "ArrowRight") setCurrentIndex((i) => (i < images.length - 1 ? i + 1 : 0));
    };
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKey);
    };
  }, [images.length, onClose]);

  const current = images[currentIndex];
  if (!current) return null;

  return (
    <div className="fixed inset-0 z-[300] bg-black/95 flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/80 border-b border-white/10">
        <span className="text-white/60 text-xs font-medium">
          {currentIndex + 1} / {images.length}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoom(!zoom)}
            className="p-2 text-white/60 hover:text-white transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            title={zoom ? "Zoom out" : "Zoom in"}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {zoom ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
              )}
            </svg>
          </button>
          <button onClick={onClose} className="p-2 text-white/60 hover:text-white transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Image area */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden">
        <button
          onClick={() => setCurrentIndex((i) => (i > 0 ? i - 1 : images.length - 1))}
          className="absolute left-4 z-10 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div 
          className={`w-full h-full flex items-center justify-center p-8 transition-transform duration-200 ${zoom ? 'cursor-zoom-out' : 'cursor-zoom-in'}`}
          onClick={() => {
            setZoom(!zoom);
            if (!zoom) setMousePos({ x: 50, y: 50 });
          }}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setMousePos({ x: 50, y: 50 })}
        >
          {current.type === "video" ? (
            <video src={current.url} className={`max-w-full max-h-full transition-transform duration-200 ${zoom ? 'scale-[2.5]' : 'scale-100'}`} controls autoPlay />
          ) : (
            <div 
              className="relative w-full h-full transition-all duration-200 ease-out"
              style={zoom ? {
                transform: 'scale(2.5)',
                transformOrigin: `${mousePos.x}% ${mousePos.y}%`
              } : {
                transform: 'scale(1)',
                transformOrigin: '50% 50%'
              }}
            >
              <OptimizedImage
                src={current.url}
                alt={`Product image ${currentIndex + 1} of ${images.length}`}
                fill
                size="large"
                className="object-contain"
                priority
              />
            </div>
          )}
        </div>


        <button
          onClick={() => setCurrentIndex((i) => (i < images.length - 1 ? i + 1 : 0))}
          className="absolute right-4 z-10 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Thumbnail strip */}
      <div className="bg-black/80 border-t border-white/10 px-4 py-3">
        <div className="flex gap-2 overflow-x-auto justify-center">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`relative w-16 h-16 flex-shrink-0 border-2 transition-all ${
                i === currentIndex ? "border-gold opacity-100" : "border-transparent opacity-50 hover:opacity-80"
              }`}
            >
              {img.type === "video" ? (
                <div className="w-full h-full bg-white/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                  </svg>
                </div>
              ) : (
                <OptimizedImage src={img.url} alt={`Product thumbnail ${i + 1}`} fill size="thumbnail" className="object-cover" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
