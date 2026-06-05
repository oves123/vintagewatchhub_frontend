"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import OptimizedImage from "./OptimizedImage";
import { API_BASE_URL } from "../services/api";

export default function QuickViewModal({ product, onClose }) {
  const [imageIndex, setImageIndex] = useState(0);
  const [isInWatchlist, setIsInWatchlist] = useState(false);

  const modalRef = useRef(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const handleEsc = (e) => { if (e.key === "Escape") onClose(); };
    const handleTab = (e) => {
      if (e.key !== "Tab" || !modalRef.current) return;
      const focusable = modalRef.current.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (focusable.length === 0) return;
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    window.addEventListener("keydown", handleEsc);
    window.addEventListener("keydown", handleTab);
    // Focus the close button on open
    setTimeout(() => modalRef.current?.querySelector("button")?.focus(), 100);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleEsc);
      window.removeEventListener("keydown", handleTab);
    };
  }, [onClose]);

  const images = [];
  if (product.images && Array.isArray(product.images)) {
    product.images.forEach((img) => {
      images.push({
        url: img.startsWith("http") ? img : `${API_BASE_URL}/uploads/${img}`,
        path: img,
        type: img.match(/\.(mp4|mov|webm)$/i) ? "video" : "image",
      });
    });
  }

  const price = parseFloat(
    product.allow_auction
      ? product.current_bid || product.starting_bid
      : product.price
  ).toLocaleString();

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div ref={modalRef} className="relative bg-background border border-border max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 p-2 bg-background/90 backdrop-blur border border-border text-muted hover:text-foreground transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          <div className="aspect-square bg-background relative border-r border-border">
            {images.length > 0 && images[imageIndex]?.type === "image" ? (
              <OptimizedImage
                src={images[imageIndex]?.url}
                alt={product.title}
                fill
                size="medium"
                className="object-contain p-8"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted text-sm">
                No image
              </div>
            )}
            {images.length > 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setImageIndex(i)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      i === imageIndex ? "bg-gold w-4" : "bg-border"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="p-6 flex flex-col">
            <p className="label-engraved text-gold mb-2">
              {product.category_name || "Collectible"}
            </p>
            <h3 className="text-xl font-serif text-foreground leading-snug mb-3">
              {product.title}
            </h3>
            <p className="text-sm text-muted line-clamp-3 mb-4">
              {product.description || "No description available."}
            </p>

            <div className="space-y-2 mb-6 text-sm">
              {product.item_specifics?.brand && (
                <div className="flex justify-between border-b border-border pb-1">
                  <span className="text-muted text-xs uppercase tracking-wider font-bold">Brand</span>
                  <span className="text-foreground font-medium">{product.item_specifics.brand}</span>
                </div>
              )}
              {product.condition_code && (
                <div className="flex justify-between border-b border-border pb-1">
                  <span className="text-muted text-xs uppercase tracking-wider font-bold">Condition</span>
                  <span className="text-foreground font-medium">{product.condition_code}</span>
                </div>
              )}
            </div>

            <div className="mt-auto space-y-4">
              <div>
                <p className="label-engraved mb-1">Price Guide</p>
                <span className="price-serif text-3xl tracking-tight">₹{price}</span>
                {product.allow_auction && (
                  <span className="ml-2 text-xs font-bold text-gold-dark uppercase tracking-wider">
                    {product.current_bid ? "Current Bid" : "Starting Bid"}
                  </span>
                )}
              </div>

              <div className="flex gap-3">
                <Link
                  href={`/products/${product.id}`}
                  className="gold-sweep flex-1 text-center py-3 text-xs font-bold uppercase tracking-widest"
                >
                  View Details
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
