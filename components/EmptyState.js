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
    <div className="bg-surface rounded-xl p-8 md:p-12 text-center border border-border shadow-none">
      {icon && (
        <div className="w-20 h-20 bg-gold/5 text-gold border border-gold/10 rounded-xl flex items-center justify-center mx-auto mb-6">
          {icon}
        </div>
      )}
      <h3 className="text-xl font-serif font-bold text-foreground mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-muted mb-8 max-w-md mx-auto">{description}</p>
      )}
      {actionLabel &&
        (actionHref ? (
          <Link
            href={actionHref}
            className="gold-sweep inline-flex items-center gap-2 px-8 py-4 font-black text-xs uppercase tracking-widest"
          >
            {actionLabel}
          </Link>
        ) : onAction ? (
          <button
            onClick={onAction}
            className="gold-sweep inline-flex items-center gap-2 px-8 py-4 font-black text-xs uppercase tracking-widest"
          >
            {actionLabel}
          </button>
        ) : null)}
    </div>
  );
}
