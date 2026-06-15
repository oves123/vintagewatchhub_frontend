"use client";

import { useEffect, useState, Suspense } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import ProductCard from "../components/ProductCard";
import { ProductGridSkeleton } from "../components/Skeleton";

import { useSearchParams, useRouter } from "next/navigation";
import { API_URL } from "../services/api";

function HomeContent() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [featuredSelection, setFeaturedSelection] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [viewMode, setViewMode] = useState("grid"); // "grid" or "list"
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [totalProducts, setTotalProducts] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const searchParams = useSearchParams();
  const router = useRouter();

  const search = searchParams.get("search");
  const category = searchParams.get("category");
  const brand = searchParams.get("brand");
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const conditionParam = searchParams.get("condition");
  const formatParam = searchParams.get("format");
  const sortParam = searchParams.get("sort") || "";
  const strapParam = searchParams.get("strap_type");

  const isCatalogView = Boolean(search || category || brand || minPrice || maxPrice || conditionParam || formatParam || strapParam || searchParams.get("catalog"));

  const [localMin, setLocalMin] = useState(minPrice || "");
  const [localMax, setLocalMax] = useState(maxPrice || "");

  const updateFilters = (key, value) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(key, value); else params.delete(key);
    router.push(`/?${params.toString()}`);
  };

  useEffect(() => {
    setLocalMin(minPrice || "");
    setLocalMax(maxPrice || "");
  }, [minPrice, maxPrice]);

  useEffect(() => {
    try {
      const storedViewed = localStorage.getItem("recentlyViewed");
      if (storedViewed) setRecentlyViewed(JSON.parse(storedViewed));
    } catch (e) {
      console.error("Error loading recently viewed", e);
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    let url = `${API_URL}/products`;
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (category) params.append("category", category);
    if (brand) params.append("brand", brand);
    if (minPrice) params.append("minPrice", minPrice);
    if (maxPrice) params.append("maxPrice", maxPrice);
    if (conditionParam) params.append("condition", conditionParam);
    if (formatParam) params.append("format", formatParam);
    if (sortParam) params.append("sort", sortParam);
    if (strapParam) params.append("strap_type", strapParam);

    if (params.toString()) {
      url += `?${params.toString()}&t=${Date.now()}`;
    } else {
      url += `?t=${Date.now()}`;
    }

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        // Handle both paginated { products, total, pages } and legacy plain array
        const rawItems = Array.isArray(data) ? data : (data.products || []);
        const items = rawItems.filter(p => p.status !== 'sold');
        const total = data.total ?? items.length;
        const pages = data.pages ?? 1;

        if (!Array.isArray(items)) {
          console.error("Expected array from API, got:", data);
          setProducts([]);
          return;
        }

        setProducts(items);
        setTotalProducts(total);
        setTotalPages(pages);
        setCurrentPage(1);

        if (!search && !category) {
          const sortedData = [...items].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          const mix = [];
          const usedCats = new Set();

          for (const p of sortedData) {
            const cName = p.category_name || 'Other';
            if (!usedCats.has(cName)) {
              usedCats.add(cName);
              mix.push(p);
              if (mix.length === 4) break;
            }
          }

          if (mix.length < 4) {
            for (const p of sortedData) {
              if (!mix.some(m => m.id === p.id)) {
                mix.push(p);
                if (mix.length === 4) break;
              }
            }
          }

          setFeaturedSelection(mix);

          let preOwnedExcellent = items.filter(p =>
            p.category_name?.toLowerCase().includes("pre-owned") &&
            JSON.stringify(p.condition_details || {}).toLowerCase().includes("excellent")
          );

          if (preOwnedExcellent.length === 0) {
            preOwnedExcellent = items.filter(p => p.category_name?.toLowerCase().includes("pre-owned"));
          }

          setNewArrivals(preOwnedExcellent.sort((a, b) => b.id - a.id).slice(0, 4));
        }
      })
      .catch((err) => {
        console.error("Products fetch error:", err);
        setProducts([]);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [search, category, brand, minPrice, maxPrice, conditionParam, formatParam, sortParam, strapParam]);

  useEffect(() => {
    // Fetch categories for sidebar
    fetch(`${API_URL}/products/categories`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          setCategories(data);
        } else {
          console.error("Categories API returned non-array:", data);
          setCategories([]);
        }
      })
      .catch(err => {
        console.error("Categories fetch error:", err);
        setCategories([]);
      });

    // Fetch brands for sidebar
    fetch(`${API_URL}/products/brands`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          setBrands(data);
        } else {
          console.error("Brands API returned non-array:", data);
          setBrands([]);
        }
      })
      .catch(err => {
        console.error("Brands fetch error:", err);
        setBrands([]);
      });
  }, []);

  return (
    <div className="bg-background min-h-screen flex flex-col transition-colors duration-500">
      <Navbar />





      {/* Main Container */}
      <main id="market" className="w-full px-4 sm:px-8 py-8 min-h-screen animate-in fade-in duration-700">

        {/* Curated Sections - Only show on Home without filters */}
        {!isCatalogView && (
          <div className="space-y-16 mb-16">
            {/* Ending Soon Section */}
            {featuredSelection.length > 0 && (
              <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between mb-8 border-b border-border pb-4">
                  <div>
                    <h2 className="text-3xl font-serif text-foreground tracking-wide">Featured Selection</h2>
                    <p className="text-[11px] text-gold font-bold uppercase tracking-widest mt-2">Curated assets from across all categories</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {isLoading ? (
                    <ProductGridSkeleton count={4} />
                  ) : (
                    featuredSelection.map(p => (
                      <ProductCard key={p.id} product={p} />
                    ))
                  )}
                </div>
              </section>
            )}

            {/* Pre-Owned Excellence Section */}
            {newArrivals.length > 0 && (
              <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
                <div className="flex items-center justify-between mb-8 border-b border-border pb-4">
                  <div>
                    <h2 className="text-3xl font-serif text-foreground tracking-wide">Pre-Owned Excellence</h2>
                    <p className="text-[11px] text-muted font-bold uppercase tracking-widest mt-2">Exceptional pre-owned pieces in prime condition</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {isLoading ? (
                    <ProductGridSkeleton count={4} />
                  ) : (
                    newArrivals.map(p => (
                      <ProductCard key={p.id} product={p} />
                    ))
                  )}
                </div>
              </section>
            )}

            {/* Recently Viewed Section */}
            {recentlyViewed.length > 0 && (
              <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
                <div className="flex items-center justify-between mb-8 border-b border-border pb-4">
                  <div>
                    <h2 className="text-3xl font-serif text-foreground tracking-wide">Recently Viewed</h2>
                    <p className="text-[11px] text-muted font-bold uppercase tracking-widest mt-2">Pick up right where you left off</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {recentlyViewed.map((p: any) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {isCatalogView && (
          <div className="flex flex-col lg:flex-row gap-8">

            {/* Off-canvas Filter Drawer */}
            <aside className={`
              fixed inset-0 z-[110]
              ${showMobileFilters ? 'pointer-events-auto' : 'pointer-events-none'}
            `}>
              {/* Overlay */}
              <div 
                className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${showMobileFilters ? 'opacity-100' : 'opacity-0'}`} 
                onClick={() => setShowMobileFilters(false)}
              />
              
              {/* Drawer Content */}
              <div className={`
                absolute right-0 top-0 bottom-0 w-full sm:w-96 bg-surface shadow-2xl flex flex-col
                transition-transform duration-300 ${showMobileFilters ? 'translate-x-0' : 'translate-x-full'}
              `}>
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-surface z-10">
                <h3 className="text-lg font-serif text-foreground tracking-widest">Filter Assets</h3>
                <button onClick={() => setShowMobileFilters(false)} className="p-2 text-muted hover:text-foreground">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {/* Category Filter */}
                <div>
                  <h3 className="font-serif text-xs font-bold text-foreground mb-4 uppercase tracking-[0.15em]">Category</h3>
                  <ul className="space-y-3 text-[12px] font-serif uppercase tracking-[0.1em]">
                    {categories.map(c => (
                      <li key={c.id}>
                        <button
                          onClick={() => updateFilters('category', c.name.toLowerCase())}
                          className={`hover:text-gold transition-colors text-left ${category === c.name.toLowerCase() ? "font-bold text-gold" : "text-muted"}`}
                        >
                          {c.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Brand Filter */}
                {brands.length > 0 && (
                  <div className="border-t border-border pt-6">
                    <h3 className="font-serif text-xs font-bold text-foreground mb-4 uppercase tracking-[0.15em]">Brand</h3>
                    <ul className="space-y-3 text-[12px] font-serif uppercase tracking-[0.1em]">
                      <li>
                        <button
                          onClick={() => updateFilters('brand', '')}
                          className={`hover:text-gold transition-colors text-left ${!brand ? "font-bold text-gold" : "text-muted"}`}
                        >
                          All Brands
                        </button>
                      </li>
                      {brands.map(b => (
                        <li key={b}>
                          <button
                            onClick={() => updateFilters('brand', b.toLowerCase())}
                            className={`hover:text-gold transition-colors text-left ${brand === b.toLowerCase() ? "font-bold text-gold" : "text-muted"} capitalize`}
                          >
                            {b}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Price Filter */}
                <div className="border-t border-border pt-6">
                  <h3 className="font-serif text-xs font-bold text-foreground mb-4 uppercase tracking-[0.15em]">Price</h3>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (localMin) updateFilters("minPrice", localMin); else updateFilters("minPrice", "");
                      if (localMax) updateFilters("maxPrice", localMax); else updateFilters("maxPrice", "");
                    }}
                    className="flex items-center gap-2"
                  >
                    <input type="number" placeholder="Min ₹" className="w-full px-3 py-2 bg-background border border-border rounded-none text-xs font-semibold text-foreground outline-none focus:border-gold transition-all placeholder:font-normal placeholder:text-muted" value={localMin} onChange={e => setLocalMin(e.target.value)} />
                    <span className="text-muted text-xs">to</span>
                    <input type="number" placeholder="Max ₹" className="w-full px-3 py-2 bg-background border border-border rounded-none text-xs font-semibold text-foreground outline-none focus:border-gold transition-all placeholder:font-normal placeholder:text-muted" value={localMax} onChange={e => setLocalMax(e.target.value)} />
                    <button type="submit" className="p-2 bg-primary text-white border border-primary hover:bg-transparent hover:text-primary transition rounded-none">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                    </button>
                  </form>
                </div>

                {/* Strap Type Filter */}
                <div className="border-t border-border pt-6">
                  <h3 className="font-serif text-xs font-bold text-foreground mb-4 uppercase tracking-[0.15em]">Strap Type</h3>
                  <ul className="space-y-3 text-[12px] font-serif uppercase tracking-[0.1em]">
                    <li>
                      <button
                        onClick={() => updateFilters('strap_type', '')}
                        className={`hover:text-gold transition-colors text-left ${!strapParam ? "font-bold text-gold" : "text-muted"}`}
                      >
                        All Straps
                      </button>
                    </li>
                    {['Metal', 'Leather', 'No Strap'].map(s => (
                      <li key={s}>
                        <button
                          onClick={() => updateFilters('strap_type', s)}
                          className={`hover:text-gold transition-colors text-left ${strapParam === s ? "font-bold text-gold" : "text-muted"}`}
                        >
                          {s}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

              </div>

              {/* Drawer Footer */}
              <div className="p-6 border-t border-border bg-background">
                 <button 
                  onClick={() => setShowMobileFilters(false)}
                  className="w-full py-4 bg-primary text-white border border-primary hover:bg-transparent hover:text-primary rounded-none font-bold text-[10px] uppercase tracking-[0.2em] transition"
                 >
                    Apply & Show {products.length} Results
                 </button>
              </div>

              </div>
            </aside>

            {/* Results Area */}
            <div className="flex-grow">

              {/* Top Bar (eBay style info & sort) */}
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4 border-b border-border pb-4">
                <div>
                  <h2 className="text-xl font-serif text-foreground tracking-wide capitalize">
                    {products.length} Results for {search ? `"${search}"` : brand ? `${brand}` : category ? `${category}` : "All Items"}
                  </h2>
                </div>
                <div className="flex items-center gap-3">
                  {/* Filter Toggle Button */}
                  <button 
                    onClick={() => setShowMobileFilters(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-background border border-border rounded-none text-[10px] font-bold uppercase tracking-widest text-foreground hover:border-gold transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                    Filters
                  </button>
                  
                  <span className="text-[11px] font-bold text-muted uppercase tracking-widest hidden sm:inline-block">Sort:</span>
                  <select
                    className="bg-background border border-border text-foreground text-xs font-bold rounded-none focus:border-gold outline-none block px-4 py-2 cursor-pointer"
                    value={sortParam}
                    onChange={(e) => updateFilters("sort", e.target.value)}
                  >
                    <option value="">Newly Listed</option>
                    <option value="lowest_price">Lowest Price</option>
                    <option value="highest_price">Highest Price</option>
                  </select>
                  <div className="border border-border ml-2 rounded-none p-1 bg-background hidden sm:flex gap-1">
                    <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-none ${viewMode === 'grid' ? 'bg-primary text-white' : 'text-muted hover:text-foreground'}`}>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M4 4h6v6H4zm10 0h6v6h-6zM4 14h6v6H4zm10 0h6v6h-6z" /></svg>
                    </button>
                    <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-none ${viewMode === 'list' ? 'bg-primary text-white' : 'text-muted hover:text-foreground'}`}>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z" /></svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Active Filters Pill Bar (Optional if needed) */}
              {(minPrice || maxPrice) && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {(minPrice || maxPrice) && (
                    <button onClick={() => { updateFilters('minPrice', ''); updateFilters('maxPrice', ''); setLocalMin(''); setLocalMax(''); }} className="flex items-center gap-1.5 px-3 py-1 bg-background border border-border rounded-none text-[10px] font-bold text-foreground uppercase tracking-widest hover:border-gold transition">
                      ₹{minPrice || 0} - ₹{maxPrice || 'Any'} <svg className="w-3 h-3 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  )}
                </div>
              )}

              {/* Load More & Products Grid */}
              <div className="mt-8">
                {isLoading ? (
                  <ProductGridSkeleton count={8} />
                ) : products.length > 0 ? (
                  <>
                    <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6' : 'grid-cols-1 gap-4'}`}>
                      {products.map(p => (
                        <ProductCard key={p.id} product={p} horizontal={viewMode === 'list'} />
                      ))}
                    </div>
                    
                    {currentPage < totalPages && (
                      <div className="flex justify-center mt-12">
                        <button
                          onClick={async () => {
                            setLoadingMore(true);
                            const nextPage = currentPage + 1;
                            const moreParams = new URLSearchParams();
                            if (search) moreParams.append("search", search);
                            if (category) moreParams.append("category", category);
                            if (brand) moreParams.append("brand", brand);
                            if (minPrice) moreParams.append("minPrice", minPrice);
                            if (maxPrice) moreParams.append("maxPrice", maxPrice);
                            if (conditionParam) moreParams.append("condition", conditionParam);
                            if (formatParam) moreParams.append("format", formatParam);
                            if (sortParam) moreParams.append("sort", sortParam);
                            if (strapParam) moreParams.append("strap_type", strapParam);
                            moreParams.append("page", String(nextPage));
                            try {
                              const res = await fetch(`${API_URL}/products?${moreParams.toString()}&t=${Date.now()}`);
                              const data = await res.json();
                              const rawNewItems = Array.isArray(data) ? data : (data.products || []);
                              const newItems = rawNewItems.filter(p => p.status !== 'sold');
                              setProducts(prev => [...prev, ...newItems]);
                              setCurrentPage(nextPage);
                            } catch (e) { console.error(e); }
                            setLoadingMore(false);
                          }}
                          disabled={loadingMore}
                          className="px-12 py-4 bg-foreground text-background text-[11px] font-black uppercase tracking-widest hover:bg-primary transition disabled:opacity-50"
                        >
                          {loadingMore ? "Loading..." : `Load More \u2014 ${totalProducts - products.length} remaining`}
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="bg-surface p-20 text-center border border-border shadow-sm">
                    <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center mx-auto mb-6">
                      <svg className="w-8 h-8 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>
                    <h3 className="text-xl font-serif text-foreground">No Listings Found</h3>
                    <p className="text-sm text-muted font-medium mt-2">Try adjusting your filters or searching for something else.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </main>

      <Footer />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomeContent />
    </Suspense>
  );
}