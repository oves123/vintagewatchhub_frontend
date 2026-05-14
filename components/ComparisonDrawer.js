"use client";

import React from "react";
import { useComparison } from "../context/ComparisonContext";
import Link from "next/link";
import { API_BASE_URL } from "../services/api";

export default function ComparisonDrawer() {
  const { comparedProducts, removeFromCompare, clearCompare } = useComparison();

  if (comparedProducts.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] bg-surface/80 backdrop-blur-xl border-t border-blue-100 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] p-4 animate-in slide-in-from-bottom duration-500">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-6">
        <div className="flex-shrink-0">
          <h4 className="text-sm font-black uppercase tracking-tighter text-primary">Compare Tool</h4>
          <p className="text-[10px] font-bold text-muted">{comparedProducts.length} of 4 selected</p>
        </div>

        <div className="flex flex-wrap justify-center gap-3 flex-grow">
          {comparedProducts.map((p) => (
            <div key={p.id} className="relative group w-16 h-16 sm:w-20 sm:h-20 bg-background rounded-none border border-border p-1.5 overflow-hidden transition-all hover:border-blue-200">
              <img 
                src={p.images && p.images[0] ? (p.images[0].startsWith('http') ? p.images[0] : `${API_BASE_URL}/uploads/${p.images[0]}`) : "https://via.placeholder.com/150"} 
                className="w-full h-full object-contain"
                alt={p.title}
              />
              <button 
                onClick={() => removeFromCompare(p.id)}
                className="absolute -top-1 -right-1 bg-surface text-muted hover:text-red-500 rounded-full shadow-sm border border-border p-0.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={clearCompare}
            className="text-[10px] font-black uppercase tracking-widest text-muted hover:text-red-500 transition-colors"
          >
            Clear
          </button>
          <Link 
            href="/compare" 
            className="bg-primary hover:bg-blue-700 text-white px-8 py-3 rounded-full font-black text-[11px] uppercase tracking-widest shadow-lg shadow-blue-200 transition-all hover:-translate-y-0.5 active:scale-95"
          >
            Compare Now
          </Link>
        </div>
      </div>
    </div>
  );
}
