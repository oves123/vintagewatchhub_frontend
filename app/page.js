"use client";

import { useEffect, useState, Suspense } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ProductCard from "../components/ProductCard";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { API_URL } from "../services/api";

function HomeContent() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [featuredSelection, setFeaturedSelection] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [viewMode, setViewMode] = useState("grid"); // "grid" or "list"
  const [showMobileFilters, setShowMobileFilters] = useState(false);
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

  const isCatalogView = Boolean(search || category || brand || minPrice || maxPrice || conditionParam || formatParam || searchParams.get("catalog"));

  const [localMin, setLocalMin] = useState(minPrice || "");
  const [localMax, setLocalMax] = useState(maxPrice || "");

  const updateFilters = (key, value) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(key, value); else params.delete(key);
    router.push(`/?${params.toString()}`);
  };

  const toggleMultiFilter = (key, val) => {
    const currentParam = searchParams.get(key) || "";
    let values = currentParam ? currentParam.split(',') : [];
    if (values.includes(val)) {
      values = values.filter(v => v !== val);
    } else {
      values.push(val);
    }
    updateFilters(key, values.join(','));
  };

  useEffect(() => {
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

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (!Array.isArray(data)) {
          console.error("Expected array from API, got:", data);
          setProducts([]);
          return;
        }

        setProducts(data);

        if (!search && !category) {
          const sortedData = [...data].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
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

          let preOwnedExcellent = data.filter(p =>
            p.category_name?.toLowerCase().includes("pre-owned") &&
            JSON.stringify(p.condition_details || {}).toLowerCase().includes("excellent")
          );

          if (preOwnedExcellent.length === 0) {
            preOwnedExcellent = data.filter(p => p.category_name?.toLowerCase().includes("pre-owned"));
          }

          setNewArrivals(preOwnedExcellent.sort((a, b) => b.id - a.id).slice(0, 4));
        }
      });

    // Fetch categories for sidebar
    fetch(`${API_URL}/products/categories`)
      .then(res => res.json())
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
      .then(res => res.json())
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
  }, [search, category, brand, minPrice, maxPrice, conditionParam, formatParam, sortParam]);

  return (
    <div className="bg-[#fafafa] min-h-screen flex flex-col">
      <Navbar />

      {/* Hero Section - Only show when NOT searching/filtering */}
      {!isCatalogView && (
        <section className="bg-white border-b border-gray-100 overflow-hidden">
          <div className="max-w-[1300px] mx-auto px-5 py-12 md:py-20 flex flex-col md:flex-row items-center gap-10 md:gap-16">
            <div className="w-full md:w-1/2 space-y-6 text-center md:text-left">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-950 leading-tight">
                Premium Marketplace for <span className="text-[#1e3a5f]">Timepiece</span> <span className="text-[#b8860b]">Collectors</span>.
              </h2>
              <p className="text-gray-500 text-base md:text-lg font-medium max-w-md mx-auto md:mx-0 leading-relaxed">
                The leading destination for authentic vintage watches and enthusiast collectibles.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                <Link href="/?catalog=true#market" className="bg-[#1e3a5f] text-white px-8 py-4 rounded-xl font-bold text-sm tracking-wide hover:bg-[#2e538a] transition shadow-lg">Shop Marketplace</Link>
                <Link href="/sell" className="bg-white border-2 border-[#1e3a5f] text-[#1e3a5f] px-8 py-4 rounded-xl font-bold text-sm tracking-wide hover:bg-blue-50 transition shadow-sm">Sell Your Watch</Link>
              </div>
            </div>
            <div className="w-full md:w-1/2 relative">
              <div className="w-full aspect-square md:aspect-[4/3] bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 shadow-xl relative group">
                <img
                  src="https://www.omegawatches.com/chronicle/img/template/mobile/1952/1952-the-first-model-in-the-omega-constellation-collection.jpg"
                  className="w-full h-full object-contain mix-blend-multiply p-10 md:p-16 transition-transform duration-700 group-hover:scale-105"
                  alt="Hero Watch"
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Brand Quick Links - New Section */}
      {!isCatalogView && brands.length > 0 && (
         <section className="bg-gray-50 border-b border-gray-100 py-6 overflow-x-auto selection:bg-none">
            <div className="max-w-[1300px] mx-auto px-5">
               <div className="flex items-center gap-6">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] whitespace-nowrap">Shop by Brand:</span>
                  <div className="flex items-center gap-4">
                     {brands.slice(0, 10).map(b => (
                        <button 
                           key={b}
                           onClick={() => updateFilters('brand', b.toLowerCase())}
                           className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-[11px] font-bold text-[#1e3a5f] uppercase tracking-wider hover:border-[#1e3a5f] hover:shadow-sm transition-all whitespace-nowrap"
                        >
                           {b}
                        </button>
                     ))}
                     <button 
                        onClick={() => router.push('/?catalog=true#market')}
                        className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline whitespace-nowrap"
                     >
                        View All →
                     </button>
                  </div>
               </div>
            </div>
         </section>
      )}

      {/* Main Container */}
      <main id="market" className="max-w-[1300px] mx-auto px-4 py-8">

        {/* Curated Sections - Only show on Home without filters */}
        {!isCatalogView && (
          <div className="space-y-16 mb-16">
            {/* Ending Soon Section */}
            {featuredSelection.length > 0 && (
              <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Featured Selection</h2>
                    <p className="text-[11px] text-blue-600 font-bold uppercase tracking-wider mt-1">Curated assets from across all categories</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {featuredSelection.map(p => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
              </section>
            )}

            {/* Pre-Owned Excellence Section */}
            {newArrivals.length > 0 && (
              <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Pre-Owned Excellence</h2>
                    <p className="text-[11px] text-gray-500 font-bold uppercase tracking-wider mt-1">Exceptional pre-owned pieces in prime condition</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {newArrivals.map(p => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {isCatalogView && (
          <div className="flex flex-col lg:flex-row gap-8">

            {/* Detailed Filters - Drawer on Mobile */}
            <aside className={`
              fixed inset-0 z-[110] lg:relative lg:inset-auto lg:z-auto
              ${showMobileFilters ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
              transition-transform duration-300 lg:transition-none
              w-full lg:w-64 flex-shrink-0 bg-white lg:bg-transparent overflow-y-auto lg:overflow-visible
            `}>
              {/* Mobile Header for Filters */}
              <div className="flex lg:hidden items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
                <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Filter Assets</h3>
                <button onClick={() => setShowMobileFilters(false)} className="p-2 text-gray-400 hover:text-gray-900">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="p-6 lg:p-0 space-y-8">
                {/* Category Filter */}
                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-widest text-[10px] text-gray-400">Category</h3>
                <ul className="space-y-3 text-[13px]">

                  {categories.map(c => (
                    <li key={c.id}>
                      <button
                        onClick={() => updateFilters('category', c.name.toLowerCase())}
                        className={`hover:text-blue-600 transition-colors text-left ${category === c.name.toLowerCase() ? "font-bold text-gray-900" : "text-gray-600"}`}
                      >
                        {c.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Brand Filter */}
              {brands.length > 0 && (
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-sm font-bold text-gray-900 mb-4">Brand</h3>
                  <ul className="space-y-3 text-[13px]">
                    <li>
                      <button
                        onClick={() => updateFilters('brand', '')}
                        className={`hover:text-blue-600 transition-colors text-left ${!brand ? "font-bold text-gray-900" : "text-gray-600"}`}
                      >
                        All Brands
                      </button>
                    </li>
                    {brands.map(b => (
                      <li key={b}>
                        <button
                          onClick={() => updateFilters('brand', b.toLowerCase())}
                          className={`hover:text-blue-600 transition-colors text-left ${brand === b.toLowerCase() ? "font-bold text-gray-900" : "text-gray-600"} capitalize`}
                        >
                          {b}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}



              {/* Price Filter */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-sm font-bold text-gray-900 mb-4">Price</h3>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (localMin) updateFilters("minPrice", localMin); else updateFilters("minPrice", "");
                    if (localMax) updateFilters("maxPrice", localMax); else updateFilters("maxPrice", "");
                  }}
                  className="flex items-center gap-2"
                >
                  <input type="number" placeholder="Min ₹" className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs font-semibold text-gray-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition-all placeholder:font-normal" value={localMin} onChange={e => setLocalMin(e.target.value)} />
                  <span className="text-gray-400 text-xs">to</span>
                  <input type="number" placeholder="Max ₹" className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs font-semibold text-gray-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition-all placeholder:font-normal" value={localMax} onChange={e => setLocalMax(e.target.value)} />
                  <button type="submit" className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                  </button>
                </form>
              </div>

              </div>

              {/* Mobile Footer for Filters */}
              <div className="lg:hidden p-6 border-t border-gray-100 bg-gray-50/50">
                 <button 
                  onClick={() => setShowMobileFilters(false)}
                  className="w-full py-4 bg-[#1e3a5f] text-white rounded-xl font-bold text-[11px] uppercase tracking-[0.2em] shadow-lg shadow-blue-100"
                 >
                    Apply & Show {products.length} Results
                 </button>
              </div>

            </aside>

            {/* Results Area */}
            <div className="flex-grow">

              {/* Top Bar (eBay style info & sort) */}
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4 border-b border-gray-200 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 tracking-tight capitalize">
                    {products.length} Results for {search ? `"${search}"` : brand ? `${brand}` : category ? `${category}` : "All Items"}
                  </h2>
                </div>
                <div className="flex items-center gap-3">
                  {/* Mobile Filter Toggle */}
                  <button 
                    onClick={() => setShowMobileFilters(true)}
                    className="lg:hidden flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-[10px] font-black uppercase tracking-widest text-gray-700 hover:bg-gray-50 transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                    Filters
                  </button>
                  
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest hidden sm:inline-block">Sort:</span>
                  <select
                    className="bg-white border border-gray-300 text-gray-900 text-xs font-bold rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none block px-4 py-2 cursor-pointer"
                    value={sortParam}
                    onChange={(e) => updateFilters("sort", e.target.value)}
                  >
                    <option value="">Newly Listed</option>
                    <option value="lowest_price">Lowest Price</option>
                    <option value="highest_price">Highest Price</option>
                  </select>
                  <div className="border border-gray-200 ml-2 rounded-lg p-1 bg-white hidden sm:flex gap-1">
                    <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-gray-100 text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M4 4h6v6H4zm10 0h6v6h-6zM4 14h6v6H4zm10 0h6v6h-6z" /></svg>
                    </button>
                    <button onClick={() => setViewMode('list')} className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-gray-100 text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z" /></svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Active Filters Pill Bar (Optional if needed) */}
              {(minPrice || maxPrice) && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {(minPrice || maxPrice) && (
                    <button onClick={() => { updateFilters('minPrice', ''); updateFilters('maxPrice', ''); setLocalMin(''); setLocalMax(''); }} className="flex items-center gap-1.5 px-3 py-1 bg-gray-100 border border-gray-200 rounded-full text-[10px] font-bold text-gray-600 uppercase tracking-widest hover:bg-gray-200 transition">
                      ₹{minPrice || 0} - ₹{maxPrice || 'Any'} <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  )}
                </div>
              )}

              <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6' : 'grid-cols-1 gap-4'}`}>
                {products.map(p => (
                  <ProductCard key={p.id} product={p} horizontal={viewMode === 'list'} />
                ))}
              </div>

              {products.length === 0 && (
                <div className="bg-white rounded-2xl p-20 text-center border border-gray-100 shadow-sm">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">No Listings Found</h3>
                  <p className="text-sm text-gray-500 font-medium mt-2">Try adjusting your filters or searching for something else.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Popular Categories - Narrowed */}
        {!isCatalogView && (
          <section className="mt-20">
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-2xl font-bold text-gray-950 tracking-tight">Browse Categories</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { name: "Pre-Owned Watches", icon: "🕰️", desc: "Rare timepieces from across the globe." },
                { name: "Watch Lots", icon: "📦", desc: "Bulk collections and estate finds." },
                { name: "Accessories", icon: "🎁", desc: "Premium straps, tools, and storage." },
              ].map((cat) => (
                <Link
                  href={`/?category=${cat.name}`}
                  key={cat.name}
                  className="bg-white p-10 rounded-2xl border border-gray-100 hover:shadow-xl transition-all group shadow-sm"
                >
                  <span className="text-4xl mb-6 block group-hover:scale-110 transition duration-500">{cat.icon}</span>
                  <p className="font-bold text-gray-900 text-lg mb-1">{cat.name}</p>
                  <p className="text-sm font-medium text-gray-500">{cat.desc}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Promotional Banner */}
        <section className="mt-24 bg-gray-900 rounded-2xl p-10 md:p-20 text-white overflow-hidden relative shadow-xl">
          <div className="md:w-2/3 relative z-10">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight tracking-tight">Join the Hub of Collectors.</h2>
            <p className="text-gray-400 text-lg font-medium mb-10 max-w-md leading-relaxed">Start selling your vintage pieces to a dedicated community of enthusiasts. Professional tools for professional sellers.</p>
            <Link href="/sell" className="bg-blue-600 text-white px-10 py-4 rounded-lg font-bold text-base hover:bg-blue-700 transition shadow-lg shadow-blue-900/20 inline-block">List Your Item</Link>
          </div>
          <div className="absolute right-0 top-0 h-full hidden lg:block opacity-20 transition-transform duration-1000 group-hover:scale-110">
            <img src="https://www.omegawatches.com/chronicle/img/template/mobile/1952/1952-the-first-model-in-the-omega-constellation-collection.jpg" className="h-full object-contain -rotate-12" />
          </div>
        </section>
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