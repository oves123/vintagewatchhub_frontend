"use client";

import { useState, useEffect, useRef } from "react";
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ImageLightbox({ images, startIndex = 0, initialIndex = 0, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex || startIndex);
  const [isZoomed, setIsZoomed] = useState(false);
  const overlayRef = useRef(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, onClose]);

  const goNext = (e?: any) => {
    e?.stopPropagation();
    setIsZoomed(false);
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const goPrev = (e?: any) => {
    e?.stopPropagation();
    setIsZoomed(false);
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  if (!images || images.length === 0) return null;
  const current = images[currentIndex];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      ref={overlayRef}
      className="fixed inset-0 z-[9999] bg-black/95 select-none"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 h-20 flex items-center justify-between px-6 z-50 pointer-events-none">
        <div className="w-12 h-12 flex gap-2 pointer-events-auto">
          {current.type !== "video" && (
            <button 
              onClick={(e) => { e.stopPropagation(); setIsZoomed(!isZoomed); }}
              className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors border border-white/20 backdrop-blur-md"
            >
              {isZoomed ? <ZoomOut className="w-5 h-5" /> : <ZoomIn className="w-5 h-5" />}
            </button>
          )}
        </div>
        <div className="px-4 py-1.5 bg-white/10 rounded-full text-white font-medium text-sm border border-white/20 pointer-events-auto backdrop-blur-md">
          {currentIndex + 1} / {images.length}
        </div>
        <button
          onClick={onClose}
          className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors border border-white/20 pointer-events-auto backdrop-blur-md"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Navigation Buttons */}
      {images.length > 1 && !isZoomed && (
        <>
          <button
            onClick={goPrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors border border-white/20 z-50 backdrop-blur-md"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
          <button
            onClick={goNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors border border-white/20 z-50 backdrop-blur-md"
          >
            <ChevronRight className="w-8 h-8" />
          </button>
        </>
      )}

      {/* Image Container */}
      <div 
        className="absolute inset-0 flex items-center justify-center overflow-hidden"
      >
        <AnimatePresence mode="wait">
          {current.type === "video" ? (
            <motion.video
              key={current.url}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              src={current.url}
              className="max-w-full max-h-full object-contain p-4 md:p-20"
              controls
              autoPlay
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <motion.img
              key={current.url}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: isZoomed ? 2 : 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              drag={isZoomed}
              dragConstraints={{ left: -500, right: 500, top: -500, bottom: 500 }}
              dragElastic={0.1}
              onDoubleClick={(e) => { e.stopPropagation(); setIsZoomed(!isZoomed); }}
              src={current.url}
              alt="Product image"
              className={`max-w-full max-h-full object-contain ${isZoomed ? 'cursor-grab active:cursor-grabbing' : 'cursor-zoom-in'} p-4 md:p-20`}
              draggable={false}
            />
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
