"use client";

import { useRecentlyViewed } from "../context/RecentlyViewedContext";
import ProductCard from "./ProductCard";

export default function RecentlyViewedCarousel() {
  const { recentItems, clearRecent } = useRecentlyViewed();

  if (!recentItems || recentItems.length === 0) return null;

  return (
    <section className="mt-16">
      <div className="flex items-center justify-between mb-8 border-b border-border pb-4">
        <div>
          <h2 className="section-title">Recently Viewed</h2>
          <p className="label-engraved mt-2">Your recently visited timepieces</p>
        </div>
        <button
          onClick={clearRecent}
          className="text-xs text-muted hover:text-gold-dark uppercase tracking-widest font-bold transition-colors"
        >
          Clear History
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {recentItems.slice(0, 4).map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
      {recentItems.length > 4 && (
        <div className="mt-6 text-center">
          <button
            onClick={() => {
              const remaining = recentItems.slice(4);
              const target = document.getElementById("recently-viewed-more");
              if (target) {
                target.classList.toggle("hidden");
                target.innerHTML = remaining.map(
                  (p) => `<div class="col-span-1">${p.title}</div>`
                ).join("");
              }
            }}
            className="text-xs text-gold uppercase tracking-widest font-bold gold-underline"
          >
            View All {recentItems.length} Items
          </button>
        </div>
      )}
    </section>
  );
}
