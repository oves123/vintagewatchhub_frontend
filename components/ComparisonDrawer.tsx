"use client";

import React from "react";
import { useComparison } from "../context/ComparisonContext";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { API_BASE_URL } from "../services/api";
import OptimizedImage from "./OptimizedImage";

const AUTH_PAGES = ["/login", "/register", "/forgot-password", "/reset-password", "/terms"];

export default function ComparisonDrawer() {
  const pathname = usePathname();
  const { comparedProducts, removeFromCompare, clearCompare } = useComparison();

  if (AUTH_PAGES.includes(pathname)) return null;
  if (comparedProducts.length === 0) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-[100] bg-background/80 backdrop-blur-sm border-t border-border/40 p-3">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-3">
          <div className="w-8 h-8 bg-gold/5 text-gold border border-gold/10 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
          </div>
          <p className="text-xs text-muted">Add watches to compare them side by side</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] bg-background/90 backdrop-blur-xl border-t border-gold/10 shadow-[0_-10px_40px_rgba(212,168,83,0.08)] p-4 animate-in slide-in-from-bottom duration-500">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-6">
        <div className="flex-shrink-0">
          <h4 className="text-sm font-black uppercase tracking-tighter text-gold">Compare Tool</h4>
          <p className="label-engraved">{comparedProducts.length} of 4 selected</p>
        </div>

        <div className="flex flex-wrap justify-center gap-3 flex-grow">
          {comparedProducts.map((p) => (
            <div key={p.id} className="relative group w-16 h-16 sm:w-20 sm:h-20 bg-background border border-border p-1.5 overflow-hidden transition-all hover:border-gold/30 card-glow">
              <OptimizedImage 
                src={p.images && p.images[0] ? (p.images[0].startsWith('http') ? p.images[0] : `${API_BASE_URL}/uploads/${p.images[0]}`) : "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150' fill='%23e5e7eb'%3E%3Crect width='150' height='150'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%239ca3af' font-size='12'%3ENo Image%3C/text%3E%3C/svg%3E"} 
                alt={p.title}
                fill
                className="object-contain"
                size="thumbnail"
              />
              <button 
                onClick={() => removeFromCompare(p.id)}
                className="absolute -top-1 -right-1 bg-background text-muted hover:text-gold rounded-full shadow-sm border border-border p-0.5 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={clearCompare}
            className="text-xs font-black uppercase tracking-widest text-muted hover:text-gold-dark transition-colors"
          >
            Clear
          </button>
          <Link 
            href="/compare" 
            className="gold-sweep px-8 py-3 font-black text-sm uppercase tracking-widest shadow-lg"
          >
            Compare Now
          </Link>
        </div>
      </div>
    </div>
  );
}
