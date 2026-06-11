"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

const RecentlyViewedContext = createContext();
const STORAGE_KEY = "recently_viewed";
const MAX_ITEMS = 12;

export function RecentlyViewedProvider({ children }) {
  const [recentItems, setRecentItems] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setRecentItems(JSON.parse(stored));
    } catch {}
    setLoaded(true);
  }, []);

  const trackView = useCallback((product) => {
    if (!product || !product.id) return;
    setRecentItems((prev) => {
      const filtered = prev.filter((p) => p.id !== product.id);
      const updated = [product, ...filtered].slice(0, MAX_ITEMS);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch {}
      return updated;
    });
  }, []);

  const clearRecent = useCallback(() => {
    setRecentItems([]);
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  }, []);

  return (
    <RecentlyViewedContext.Provider value={{ recentItems, trackView, clearRecent, loaded }}>
      {children}
    </RecentlyViewedContext.Provider>
  );
}

export function useRecentlyViewed() {
  const ctx = useContext(RecentlyViewedContext);
  if (!ctx) throw new Error("useRecentlyViewed must be used within RecentlyViewedProvider");
  return ctx;
}
