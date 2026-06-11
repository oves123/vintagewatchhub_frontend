"use client";

import { useMemo } from "react";

export default function PriceHistoryChart({ bids, price }) {
  const chartData = useMemo(() => {
    if (!bids || bids.length < 2) return null;

    const sorted = [...bids].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    const min = Math.min(...sorted.map((b) => parseFloat(b.bid_amount)));
    const max = Math.max(...sorted.map((b) => parseFloat(b.bid_amount)), parseFloat(price || 0));
    const range = max - min || 1;
    const width = 280;
    const height = 60;
    const padding = 4;

    const points = sorted.map((b, i) => ({
      x: padding + (i / Math.max(sorted.length - 1, 1)) * (width - padding * 2),
      y: height - padding - ((parseFloat(b.bid_amount) - min) / range) * (height - padding * 2),
      amount: parseFloat(b.bid_amount),
      date: new Date(b.created_at).toLocaleDateString(),
    }));

    const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

    const gradient = points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

    return {
      points,
      linePath,
      width,
      height,
      areaPath: `${linePath} L${width - padding},${height} L${padding},${height} Z`,
      min,
      max,
    };
  }, [bids, price]);

  if (!chartData) return null;

  return (
    <div className="bg-surface border border-border p-4">
      <h4 className="text-xs font-black uppercase tracking-widest text-muted mb-3">Bid History</h4>
      <svg viewBox={`0 0 ${chartData.width} ${chartData.height}`} className="w-full h-16">
        {/* Area fill */}
        <defs>
          <linearGradient id="bidGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#d4a853" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#d4a853" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path d={chartData.areaPath} fill="url(#bidGradient)" />
        {/* Line */}
        <path d={chartData.linePath} fill="none" stroke="#d4a853" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        {/* Dots */}
        {chartData.points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="2.5" fill="#d4a853" stroke="#faf8f5" strokeWidth="1" />
        ))}
      </svg>
      <div className="flex justify-between text-xs font-bold text-muted mt-1">
        <span>₹{parseFloat(chartData.min).toLocaleString()}</span>
        <span>₹{parseFloat(chartData.max).toLocaleString()}</span>
      </div>
    </div>
  );
}
