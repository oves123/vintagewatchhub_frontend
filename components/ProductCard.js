"use client";

import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { API_BASE_URL, API_URL } from "../services/api";

export default function ProductCard({ product, horizontal = false }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const images = useMemo(() => {
    let imgs = [];
    if (product?.images && Array.isArray(product.images) && product.images.length > 0) {
      imgs = product.images.map(img => ({
        url: img?.startsWith('http') ? img : `${API_BASE_URL}/uploads/${img}`,
        path: img
      }));
    } else if (product?.image) {
      const img = product.image;
      imgs = [{
        url: img.startsWith('http') ? img : `${API_BASE_URL}/uploads/${img}`,
        path: img
      }];
    } else {
      imgs = [{
        url: "https://www.omegawatches.com/chronicle/img/template/mobile/1952/1952-the-first-model-in-the-omega-constellation-collection.jpg",
        path: ""
      }];
    }
    return imgs;
  }, [product]);

  const isVideo = (url) => url && url.match(/\.(mp4|mov|webm|quicktime)$/i);

  const handleNextImage = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrevImage = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const [isInWatchlist, setIsInWatchlist] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        fetch(`${API_URL}/watchlist/${parsedUser.id}`)
          .then(res => res.json())
          .then(data => {
            if (Array.isArray(data)) {
              setIsInWatchlist(data.some(item => item.product_id === parseInt(product.id)));
            }
          })
          .catch(err => console.error("Failed to fetch watchlist:", err));
      } catch (e) {
        console.error(e);
      }
    }
  }, [product.id]);

  const handleWatchlistToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      window.location.href = "/login";
      return;
    }
    const user = JSON.parse(storedUser);

    try {
      const endpoint = isInWatchlist ? "remove" : "add";
      const res = await fetch(`${API_URL}/watchlist/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, product_id: parseInt(product.id) }),
      });

      if (res.ok) {
        setIsInWatchlist(!isInWatchlist);
        window.dispatchEvent(new Event("watchlistUpdated"));
      }
    } catch (err) {
      console.error("Failed to update watchlist", err);
    }
  };

  if (horizontal) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-xl transition-all group flex flex-col sm:flex-row mb-6">
        <Link href={`/products/${product.id}`} className="block w-full sm:w-48 md:w-64 aspect-[4/3] sm:aspect-square bg-gray-50 flex-shrink-0 relative overflow-hidden">
          {isVideo(images[currentImageIndex]?.url) ? (
            <div className="w-full h-full bg-gray-900 flex items-center justify-center">
              <svg className="w-10 h-10 text-white opacity-40 absolute z-10" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
              <video 
                src={images[currentImageIndex]?.url} 
                className="w-full h-full object-cover" 
                muted={product.video_settings?.[images[currentImageIndex]?.path]?.muted ?? true} 
                playsInline 
              />
            </div>
          ) : (
            <img
              src={images[currentImageIndex]?.url}
              alt={product.title}
              className="w-full h-full object-contain p-6 transition-transform group-hover:scale-105 duration-500"
            />
          )}
          {images.length > 1 && (
            <>
              <button onClick={handlePrevImage} className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-white/90 backdrop-blur border border-gray-100 rounded-full text-gray-700 hover:text-blue-600 shadow-sm opacity-0 group-hover:opacity-100 transition z-10">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
              </button>
              <button onClick={handleNextImage} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-white/90 backdrop-blur border border-gray-100 rounded-full text-gray-700 hover:text-blue-600 shadow-sm opacity-0 group-hover:opacity-100 transition z-10">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
              </button>
            </>
          )}
          {product.status === 'sold' && (
            <div className="absolute inset-0 z-30 bg-black/60 flex items-center justify-center backdrop-blur-sm">
              <span className="bg-red-600 text-white text-[13px] font-black uppercase tracking-[0.2em] px-5 py-2 rounded-full shadow-xl border-2 border-white/20 rotate-[-8deg]">
                SOLD
              </span>
            </div>
          )}
          <button 
            onClick={handleWatchlistToggle}
            className={`absolute top-2 right-2 z-20 p-2 bg-white/90 backdrop-blur rounded-full transition shadow-sm ${isInWatchlist ? 'text-red-500 opacity-100' : 'text-gray-400 opacity-0 group-hover:opacity-100 hover:text-red-500'}`}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
          </button>
        </Link>

        <div className="p-5 sm:p-7 flex-grow flex flex-col justify-between">
          <div>
            <Link href={`/products/${product.id}`}>
              <h3 className="text-xl font-semibold text-gray-900 leading-snug hover:text-blue-600 transition-colors line-clamp-2">
                {product.title}
              </h3>
            </Link>
            <div className="flex items-center gap-3 mt-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">{product.category_name || "Certified Asset"}</span>
            </div>
            <p className="mt-4 text-[13px] text-gray-500 line-clamp-2 leading-relaxed font-medium">
              {product.description || "Expertly inspected and verified timepiece ready for domestic shipping."}
            </p>
          </div>

          <div className="mt-8 flex flex-wrap items-end justify-between gap-6 pt-5 border-t border-gray-100">
            <div>
              <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest mb-1.5">
                Price Guide
              </p>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-gray-950">₹{parseFloat(product.allow_auction ? (product.current_bid || product.starting_bid) : product.price).toLocaleString()}</span>
                  {product.allow_auction && (
                    <span className="bg-amber-100 text-amber-700 text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter">
                      {product.current_bid ? 'Current Bid' : 'Starting Bid'}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-0.5">
                   {product.shipping_type === 'free' ? (
                      <span className="text-emerald-600">Free Shipping</span>
                   ) : product.shipping_type === 'contact' ? (
                      <span className="text-blue-600">Shipping TBD</span>
                   ) : (
                      <>+ ₹{parseFloat(product.shipping_fee || 0).toLocaleString()} Shipping</>
                   )}
                </span>
              </div>
              <p className="text-xs text-gray-500 font-semibold mt-1">
                Free Authentication • Secure Transit
              </p>
            </div>
            <Link href={`/products/${product.id}`} className="bg-blue-600 text-white px-10 py-3 rounded-lg font-bold text-[12px] uppercase tracking-wider hover:bg-blue-700 transition shadow-sm whitespace-nowrap">
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-300 group flex flex-col h-full">
      <Link href={`/products/${product.id}`} className="block aspect-[5/4] bg-gray-50 relative overflow-hidden">
        {isVideo(images[currentImageIndex]?.url) ? (
          <div className="w-full h-full bg-gray-900 flex items-center justify-center">
            <svg className="w-10 h-10 text-white opacity-40 absolute z-10" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
            <video 
              src={images[currentImageIndex]?.url} 
              className="w-full h-full object-cover" 
              muted={product.video_settings?.[images[currentImageIndex]?.path]?.muted ?? true} 
              playsInline 
            />
          </div>
        ) : (
          <img
            src={images[currentImageIndex]?.url}
            alt={product.title}
            className="w-full h-full object-contain p-6 transition-transform group-hover:scale-105 duration-700"
          />
        )}
        {images.length > 1 && (
          <>
            <button onClick={handlePrevImage} className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-white/95 backdrop-blur border border-gray-100 rounded-full text-gray-700 hover:text-blue-600 shadow-md opacity-0 group-hover:opacity-100 transition z-10 hover:scale-110">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <button onClick={handleNextImage} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-white/95 backdrop-blur border border-gray-100 rounded-full text-gray-700 hover:text-blue-600 shadow-md opacity-0 group-hover:opacity-100 transition z-10 hover:scale-110">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
            </button>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              {images.map((_, i) => (
                <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === currentImageIndex ? 'bg-blue-600 w-4' : 'bg-gray-300 w-1.5'}`}></div>
              ))}
            </div>
          </>
        )}
        <div className="absolute top-3 left-3 z-20 bg-white/95 backdrop-blur px-2.5 py-1 rounded-md text-[10px] font-bold text-blue-600 uppercase tracking-tight shadow-sm border border-blue-50">
          Verified Hub
        </div>
        {product.status === 'sold' && (
          <div className="absolute inset-0 z-30 bg-black/60 flex items-center justify-center backdrop-blur-sm">
            <span className="bg-red-600 text-white text-[13px] font-black uppercase tracking-[0.2em] px-5 py-2 rounded-full shadow-xl border-2 border-white/20 rotate-[-8deg]">
              SOLD
            </span>
          </div>
        )}
        <button 
          onClick={handleWatchlistToggle}
          className={`absolute top-3 right-3 p-2 z-20 bg-white rounded-full transition shadow-md ${isInWatchlist ? 'text-red-500 opacity-100 translate-y-0' : 'text-gray-300 opacity-0 translate-y-2 group-hover:translate-y-0 group-hover:opacity-100 hover:text-red-500'}`}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
        </button>
      </Link>

      <div className="p-5 flex-grow flex flex-col">
        <Link href={`/products/${product.id}`}>
          <h3 className="font-semibold text-gray-900 line-clamp-2 hover:text-blue-600 transition-colors h-[2.5rem] text-[15px] leading-tight">
            {product.title}
          </h3>
        </Link>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{product.category_name || "Domestic Asset"}</p>
          {product.seller_verified && (
            <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
              <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
              Verified
            </span>
          )}
        </div>

        <div className="mt-auto pt-5">
          <div className="flex flex-col">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none mb-1.5">
              Price Guide
            </p>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-gray-950">₹{parseFloat(product.allow_auction ? (product.current_bid || product.starting_bid) : product.price).toLocaleString()}</span>
                {product.allow_auction && (
                  <span className="bg-amber-100 text-amber-700 text-[7px] font-black px-1 py-0.5 rounded uppercase tracking-tighter">
                    {product.current_bid ? 'Bid' : 'Start'}
                  </span>
                )}
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 mt-0.5">
                 {product.shipping_type === 'free' ? (
                    <span className="text-emerald-600">Free Delivery</span>
                 ) : product.shipping_type === 'contact' ? (
                    <span className="text-blue-600">Shipping TBD</span>
                 ) : (
                    <>+ ₹{parseFloat(product.shipping_fee || 0).toLocaleString()} Shipping</>
                 )}
              </span>
            </div>
          </div>

          <div className="mt-3.5 flex items-center justify-between border-t border-gray-50 pt-3">
            <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-tight">
              Hub Authenticated
            </span>
            <Link href={`/products/${product.id}`} className="text-[10px] text-blue-600 font-bold uppercase tracking-tighter hover:underline">
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}