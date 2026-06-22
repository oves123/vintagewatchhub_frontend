"use client";

import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import OptimizedImage from "./OptimizedImage";
import QuickViewModal from "./QuickViewModal";
import { API_BASE_URL, API_URL, extractList, getUserId, getHeaders } from "../services/api";

const _watchlistCache = new Map();
const CACHE_TTL_MS = 30_000;

async function getCachedWatchlist(userId) {
  const cached = _watchlistCache.get(userId);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) return cached.data;
  const res = await fetch(`${API_URL}/watchlist/${userId}?t=${Date.now()}`, { headers: getHeaders(), cache: 'no-store' });
  if (!res.ok) return [];
  const data = await res.json();
  const list = extractList(data);
  _watchlistCache.set(userId, { data: list, ts: Date.now() });
  return list;
}

function invalidateWatchlistCache(userId) {
  _watchlistCache.delete(userId);
}

export default function ProductCard({ product, horizontal = false }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isOwner, setIsOwner] = useState(false);
  const [quickViewOpen, setQuickViewOpen] = useState(false);

  const timeLeft = useMemo(() => {
    if (!product.auction_end) return null;
    const end = new Date(product.auction_end);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    if (diff <= 0) return "Ended";
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 48) return `${Math.floor(hours / 24)}d left`;
    if (hours > 0) return `${hours}h ${minutes}m left`;
    return `${minutes}m left`;
  }, [product.auction_end]);

  const images = useMemo(() => {
    let imgs = [];
    if (product?.images && Array.isArray(product.images) && product.images.length > 0) {
      imgs = product.images.map(img => {
        const src = typeof img === 'string' ? img : (img?.url || img?.src || '');
        return {
          url: src?.startsWith('http') ? src : `${API_BASE_URL}/uploads/${src}`,
          path: src
        };
      });
    } else if (product?.image) {
      const img = typeof product.image === 'string' ? product.image : (product.image?.url || product.image?.src || '');
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
  const [heartActive, setHeartActive] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        const uid = getUserId(parsedUser);
        setIsOwner(parseInt(product.seller_id) === parseInt(uid));
        if (uid) {
          getCachedWatchlist(uid)
            .then(data => {
              if (cancelled) return;
              setIsInWatchlist(data.some(item => item.product_id === parseInt(product.id)));
            })
            .catch(err => console.error("Failed to fetch watchlist:", err));
        }
      } catch (e) {
        console.error(e);
      }
    }
    return () => { cancelled = true; };
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
    const uid = getUserId(user);
    if (!uid) return;

    try {
      const endpoint = isInWatchlist ? "remove" : "add";
      const res = await fetch(`${API_URL}/watchlist/${endpoint}`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ user_id: uid, product_id: parseInt(product.id) }),
      });

      if (res.status === 401) {
        // Token expired or invalid
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
        return;
      }

      if (res.ok) {
        setIsInWatchlist(!isInWatchlist);
        setHeartActive(true);
        setTimeout(() => setHeartActive(false), 800);
        invalidateWatchlistCache(uid);
        window.dispatchEvent(new Event("watchlistUpdated"));
      } else {
        const errorData = await res.json();
        console.error("Watchlist API Error:", errorData.message);
      }
    } catch (err) {
      console.error("Failed to update watchlist", err);
    }
  };

  const price = parseFloat(product.allow_auction ? (product.current_bid || product.starting_bid || 0) : (product.price || 0)).toLocaleString();
  const isAuction = product.allow_auction;

  if (horizontal) {
    return (
      <motion.div 
        whileHover={{ y: -4, boxShadow: "0 20px 40px -10px rgba(0,0,0,0.1)", borderColor: "var(--gold-light)" }}
        className="rounded-lg overflow-hidden group flex flex-col sm:flex-row mb-6 fade-up border border-border bg-background transition-colors"
      >
        <div className="relative w-full sm:w-48 md:w-64 flex-shrink-0">
          <Link href={`/products/${product.id}`} className="block w-full aspect-[4/3] sm:aspect-square bg-background relative overflow-hidden sm:rounded-l-xl">
            {isVideo(images[currentImageIndex]?.url) ? (
              <div className="w-full h-full bg-foreground/5 flex items-center justify-center">
                <video
                  src={images[currentImageIndex]?.url}
                  className="w-full h-full object-cover"
                  muted={product.video_settings?.[images[currentImageIndex]?.path]?.muted ?? true}
                  playsInline
                />
              </div>
            ) : (
              <OptimizedImage
                src={images[currentImageIndex]?.url}
                alt={product.title}
                fill
                size="small"
                className="object-contain p-6 transition-transform duration-[1500ms] ease-out group-hover:scale-110"
              />
            )}
            {images.length > 1 && (
              <>
                <button onClick={handlePrevImage} className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-background/90 backdrop-blur border border-border rounded-full text-muted hover:text-gold shadow-sm opacity-0 group-hover:opacity-100 transition z-10 flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
                </button>
                <button onClick={handleNextImage} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-background/90 backdrop-blur border border-border rounded-full text-muted hover:text-gold shadow-sm opacity-0 group-hover:opacity-100 transition z-10 flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
                </button>
              </>
            )}
            {product.status !== 'approved' && (
              <div className="absolute inset-0 z-30 bg-background/80 flex items-center justify-center backdrop-blur-sm">
                <span className="text-gold-dark font-black uppercase tracking-[0.25em] px-6 py-2 border border-gold/30 rotate-[-8deg]">
                  {(product.status === 'under_offer' || product.status === 'sold') ? 'Sold' : 'Ended'}
                </span>
              </div>
            )}
          </Link>
          <button
            onClick={handleWatchlistToggle}
            className={`absolute top-3 right-3 z-20 p-2 bg-background/90 backdrop-blur rounded-full transition-all shadow-md flex items-center justify-center ${
              isInWatchlist ? 'text-rose-500 opacity-100' : 'text-muted opacity-0 translate-y-1 group-hover:translate-y-0 group-hover:opacity-100 hover:text-rose-500'
            } ${heartActive ? 'scale-110' : ''}`}
          >
            <svg className="w-4 h-4" fill={isInWatchlist ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
          </button>
        </div>

      <div className="p-5 sm:p-7 flex-grow flex flex-col justify-between">
          <div>
            <Link href={`/products/${product.id}`}>
              <h3 className="text-xl font-serif text-foreground tracking-wide leading-snug hover:text-gold transition-colors line-clamp-2">
                {product.title}
              </h3>
            </Link>
            <div className="flex items-center gap-3 mt-2.5">
              <span className="text-xs uppercase tracking-widest text-muted">{product.category_name || "Certified Asset"}</span>
            </div>
            <p className="mt-4 text-sm text-muted line-clamp-2 leading-relaxed">
              {product.description || "Expertly inspected and verified timepiece ready for domestic shipping."}
            </p>
          </div>

          <div className="mt-8 flex flex-wrap items-end justify-between gap-6 pt-5 border-t border-border/50">
            <div className="flex items-center gap-2">
              <span className="font-serif text-2xl tracking-tight">₹{price}</span>
              {isAuction && (
                <span className="bg-primary/5 text-primary text-[10px] font-bold px-1.5 py-0.5 uppercase tracking-widest rounded">
                  {product.current_bid ? 'Current Bid' : 'Starting Bid'}
                </span>
              )}
            </div>
            <Link href={`/products/${product.id}`} className="text-[10px] font-bold uppercase tracking-widest text-muted hover:text-gold transition-colors">
              Explore
            </Link>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      whileHover={{ y: -4, boxShadow: "0 20px 40px -10px rgba(0,0,0,0.1)", borderColor: "var(--gold-light)" }}
      className="rounded-lg overflow-hidden group flex flex-col h-full border border-border bg-background transition-colors"
    >
      <div className="relative">
        <Link href={`/products/${product.id}`} className="block aspect-[5/4] bg-background relative overflow-hidden rounded-t-xl">
        {isVideo(images[currentImageIndex]?.url) ? (
          <div className="w-full h-full bg-foreground/5 flex items-center justify-center">
            <video
              src={images[currentImageIndex]?.url}
              className="w-full h-full object-cover"
              muted={product.video_settings?.[images[currentImageIndex]?.path]?.muted ?? true}
              playsInline
            />
          </div>
        ) : (
          <OptimizedImage
            src={images[currentImageIndex]?.url}
            alt={product.title}
            fill
            size="small"
            className="object-contain p-6 transition-transform duration-[1500ms] ease-out group-hover:scale-110"
          />
        )}
        {images.length > 1 && (
          <>
            <button onClick={handlePrevImage} className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-background/90 backdrop-blur border border-border rounded-full text-muted hover:text-foreground shadow-md opacity-0 group-hover:opacity-100 transition z-10 hover:scale-110 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <button onClick={handleNextImage} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-background/90 backdrop-blur border border-border rounded-full text-muted hover:text-foreground shadow-md opacity-0 group-hover:opacity-100 transition z-10 hover:scale-110 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
            </button>
          </>
        )}
        {product.status !== 'approved' && (
          <div className="absolute inset-0 z-30 bg-background/80 flex items-center justify-center backdrop-blur-sm">
            <span className="text-gold-dark font-black uppercase tracking-[0.25em] px-6 py-2 border border-gold/30 rotate-[-8deg]">
              {(product.status === 'under_offer' || product.status === 'sold') ? 'Sold' : 'Ended'}
            </span>
          </div>
        )}
      </Link>
      
      <button
        onClick={handleWatchlistToggle}
        className={`absolute top-3 right-3 z-20 p-2 bg-background/90 backdrop-blur rounded-full transition-all shadow-md flex items-center justify-center ${
          isInWatchlist ? 'text-rose-500 opacity-100' : 'text-muted opacity-0 translate-y-1 group-hover:translate-y-0 group-hover:opacity-100 hover:text-rose-500'
        } ${heartActive ? 'scale-110' : ''}`}
      >
        <svg className="w-4 h-4" fill={isInWatchlist ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
      </button>
      </div>

      {quickViewOpen && <QuickViewModal product={product} onClose={() => setQuickViewOpen(false)} />}

      <div className="p-3 sm:p-5 flex-grow flex flex-col">
        <Link href={`/products/${product.id}`}>
          <h3 className="font-serif tracking-wide text-foreground line-clamp-2 hover:text-gold transition-colors text-sm sm:text-base leading-tight mb-2">
            {product.title}
          </h3>
        </Link>
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-[10px] uppercase tracking-widest text-muted font-bold">{product.category_name || "Timepiece"}</p>
        </div>

        <div className="mt-auto pt-3 sm:pt-5">
          <div className="flex items-center justify-between">
            <span className="font-serif text-base sm:text-xl tracking-tight">₹{price}</span>
            <Link href={`/products/${product.id}`} className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-muted hover:text-gold transition-colors">
              Explore
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
