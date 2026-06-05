"use client";

import React from "react";
import { useComparison } from "../../context/ComparisonContext";
import Breadcrumbs from "../../components/Breadcrumbs";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { API_BASE_URL } from "../../services/api";
import Link from "next/link";
import OptimizedImage from "../../components/OptimizedImage";

export default function ComparePage() {
  const { comparedProducts, removeFromCompare, clearCompare } = useComparison();

  const specs = [
    { label: "Price", key: (p) => `Rs.${parseFloat(p.price).toLocaleString()}` },
    { label: "Category", key: "category_name" },
    { label: "Brand", key: (p) => p.item_specifics?.brand || "N/A" },
    { label: "Condition", key: "condition_code" },
    { label: "Movement", key: (p) => p.item_specifics?.movement || "N/A" },
    { label: "Case Size", key: (p) => p.item_specifics?.case_size || "N/A" },
    { label: "Year", key: (p) => p.item_specifics?.year || "N/A" },
    { label: "Scope", key: "shipping_scope" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-grow max-w-7xl mx-auto w-full px-4 py-12">
        <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Compare' }]} />
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-black text-foreground tracking-tighter mb-2">Watch Comparison</h1>
            <p className="text-muted font-medium">Analyze and compare up to 4 timepieces side-by-side.</p>
          </div>
          <button 
            onClick={clearCompare}
            className="text-xs font-black uppercase tracking-widest text-red-500 bg-rose-50 px-6 py-3 rounded-lg border border-rose-100 hover:bg-rose-100 transition-colors"
          >
            Clear All
          </button>
        </div>

        {comparedProducts.length === 0 ? (
          <div className="bg-surface rounded-xl p-8 md:p-12 text-center border border-border shadow-none">
            <div className="w-20 h-20 bg-gold/5 text-gold border border-gold/10 rounded-xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            </div>
            <h2 className="text-2xl font-serif font-bold tracking-wide text-foreground mb-2">No watches selected</h2>
            <p className="text-muted mb-8 max-w-md mx-auto">Add watches from the marketplace to compare their specs, prices, and conditions side-by-side.</p>
            <Link href="/" className="bg-black text-white px-10 py-4 rounded-lg font-black text-sm uppercase tracking-widest hover:bg-gold hover:text-black transition-all">
              Go to Marketplace
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border bg-surface">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-background/50">
                  <th className="p-8 w-64 border-b border-border"></th>
                  {comparedProducts.map((p) => (
                    <th key={p.id} className="p-8 border-b border-border min-w-[280px]">
                      <div className="relative group">
                        <button 
                          onClick={() => removeFromCompare(p.id)}
                          className="absolute -top-4 -right-4 bg-surface text-muted hover:text-red-500 rounded-lg shadow-none border border-border p-1.5 transition-all z-10 min-w-[44px] min-h-[44px] flex items-center justify-center"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                        <div className="aspect-square bg-background rounded-xl p-4 mb-6 overflow-hidden relative">
                          <OptimizedImage 
                            src={p.images && p.images[0] ? (p.images[0].startsWith('http') ? p.images[0] : `${API_BASE_URL}/uploads/${p.images[0]}`) : "https://via.placeholder.com/150"} 
                            alt={p.title}
                            fill
                            className="object-contain transition-transform group-hover:scale-110 duration-500"
                            size="medium"
                          />
                        </div>
                        <h3 className="font-bold text-foreground line-clamp-2 h-12 leading-tight mb-4">{p.title}</h3>
                        <Link href={`/products/${p.id}`} className="block text-center bg-black text-white py-3 rounded-lg font-black text-sm uppercase tracking-widest hover:bg-gold hover:text-black transition">
                          View Details
                        </Link>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {specs.map((spec, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-surface" : "bg-background/30"}>
                    <td className="p-8 font-black text-sm uppercase tracking-widest text-muted border-r border-gray-50">
                      {spec.label}
                    </td>
                    {comparedProducts.map((p) => (
                      <td key={p.id} className="p-8 text-sm font-bold text-muted border-r border-gray-50 last:border-r-0">
                        {typeof spec.key === 'function' ? spec.key(p) : (p[spec.key] || "N/A")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
