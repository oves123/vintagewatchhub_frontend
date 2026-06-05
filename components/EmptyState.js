"use client";

import Link from "next/link";

export default function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
}) {
  return (
    <div className="bg-background rounded-none p-12 md:p-20 text-center border-2 border-dashed border-border shadow-sm relative overflow-hidden group">
      {/* Subtle Background Pattern / Glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-surface opacity-50"></div>
      
      <div className="relative z-10 flex flex-col items-center">
        {icon && (
          <div className="w-24 h-24 bg-surface text-muted border border-border rounded-full flex items-center justify-center mb-8 transform group-hover:scale-105 transition-transform duration-500 shadow-xl">
            {icon}
          </div>
        )}
        <h3 className="text-3xl font-serif font-black text-foreground mb-3 tracking-tight">
          {title}
        </h3>
        {description && (
          <p className="text-sm font-medium text-muted mb-10 max-w-md mx-auto leading-relaxed">
            {description}
          </p>
        )}
        {actionLabel &&
          (actionHref ? (
            <Link
              href={actionHref}
              className="inline-block px-10 py-4 bg-foreground text-background font-black text-[11px] uppercase tracking-widest hover:bg-gold transition-colors duration-300 shadow-2xl"
            >
              {actionLabel}
            </Link>
          ) : onAction ? (
            <button
              onClick={onAction}
              className="inline-block px-10 py-4 bg-foreground text-background font-black text-[11px] uppercase tracking-widest hover:bg-gold transition-colors duration-300 shadow-2xl"
            >
              {actionLabel}
            </button>
          ) : null)}
      </div>
    </div>
  );
}
