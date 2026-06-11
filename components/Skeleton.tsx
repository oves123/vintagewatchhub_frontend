"use client";

export function SkeletonCard() {
  return (
    <div className="bg-surface rounded-xl border border-border overflow-hidden animate-pulse">
      <div className="aspect-square bg-foreground/5" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-foreground/5 rounded w-3/4" />
        <div className="h-3 bg-foreground/5 rounded w-1/2" />
        <div className="h-6 bg-foreground/5 rounded w-1/3" />
      </div>
    </div>
  );
}

export function SkeletonLine({ width = "full", className = "" }) {
  const widthMap = { full: "100%", "3/4": "75%", "1/2": "50%", "1/3": "33.333%", "1/4": "25%" };
  return <div className={`h-3 bg-foreground/5 rounded ${className}`} style={{ width: widthMap[width] || width }} />;
}

export function SkeletonImage({ className = "aspect-square" }) {
  return <div className={`bg-foreground/5 animate-pulse ${className}`} />;
}

export function ProductGridSkeleton({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
