"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Bookmark, BookmarkCheck, Trash2 } from "lucide-react";

const STORAGE_KEY = "saved_searches";

export default function SavedSearches({ compact = false }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [saved, setSaved] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setSaved(JSON.parse(stored));
    } catch {}
    setLoaded(true);
  }, []);

  const hasActiveFilters = Array.from(searchParams.entries()).some(
    ([key]) => key !== "catalog"
  );

  const currentSearchString = useCallback(() => {
    const params = new URLSearchParams(searchParams);
    params.delete("catalog");
    return params.toString();
  }, [searchParams]);

  const isCurrentSaved = saved.some((s) => s.params === currentSearchString());

  const saveCurrent = () => {
    const paramsStr = currentSearchString();
    if (!paramsStr || isCurrentSaved) return;
    const label = searchParams.get("search") || searchParams.get("category") || `Filters (${new Date().toLocaleDateString()})`;
    const entry = { id: Date.now(), label, params: paramsStr, savedAt: new Date().toISOString() };
    const updated = [entry, ...saved].slice(0, 10);
    setSaved(updated);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch {}
  };

  const removeSearch = (id) => {
    const updated = saved.filter((s) => s.id !== id);
    setSaved(updated);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch {}
  };

  const applySearch = (paramsStr) => {
    router.push(`/?${paramsStr}`);
  };

  if (!loaded) return null;

  if (compact && saved.length === 0) {
    return (
      <div className="space-y-3">
        {hasActiveFilters && (
          <button
            onClick={saveCurrent}
            disabled={isCurrentSaved}
            className="filter-chip gap-2"
          >
            {isCurrentSaved ? (
              <BookmarkCheck className="w-3 h-3" />
            ) : (
              <Bookmark className="w-3 h-3" />
            )}
            {isCurrentSaved ? "Search Saved" : "Save This Search"}
          </button>
        )}
        {!hasActiveFilters && (
          <p className="text-xs text-muted/60 italic">No saved searches yet</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {hasActiveFilters && (
        <button
          onClick={saveCurrent}
          disabled={isCurrentSaved}
          className="filter-chip gap-2"
        >
          {isCurrentSaved ? (
            <BookmarkCheck className="w-3 h-3" />
          ) : (
            <Bookmark className="w-3 h-3" />
          )}
          {isCurrentSaved ? "Search Saved" : "Save This Search"}
        </button>
      )}

      {saved.length > 0 && (
        <div className={compact ? "" : "border-t border-border pt-4 mt-4"}>
          {!compact && (
            <h3 className="label-engraved mb-3">Saved Searches</h3>
          )}
          <div className={`flex ${compact ? "gap-2 flex-wrap" : "flex-col gap-1"}`}>
            {saved.map((s) => (
              <div
                key={s.id}
                className={`flex items-center gap-2 group ${
                  compact
                    ? "filter-chip text-xs"
                    : "px-3 py-2 hover:bg-surface cursor-pointer transition-colors border-b border-border last:border-0"
                }`}
              >
                <button
                  onClick={() => applySearch(s.params)}
                  className={`flex-1 text-left ${compact ? "" : "text-[12px] font-medium text-foreground hover:text-gold transition-colors"}`}
                >
                  {s.label}
                  {!compact && (
                    <span className="block text-xs text-muted font-normal">
                      {new Date(s.savedAt).toLocaleDateString()}
                    </span>
                  )}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); removeSearch(s.id); }}
                  className="text-muted hover:text-gold-dark transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
