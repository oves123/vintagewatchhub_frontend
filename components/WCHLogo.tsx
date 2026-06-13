"use client";

import Link from "next/link";

export default function WCHLogo({ className = "", onClick, showAdminLabel = false, size = 32 }: any) {
  return (
    <Link href="/" onClick={onClick} className={`flex items-center gap-2 flex-shrink-0 ${className}`}>
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
        <circle cx="16" cy="18" r="12" stroke="currentColor" className="text-primary" strokeWidth="2"/>
        <circle cx="16" cy="18" r="8" stroke="var(--gold-dark)" strokeWidth="1.5"/>
        <line x1="16" y1="10" x2="16" y2="18" stroke="currentColor" className="text-primary" strokeWidth="2" strokeLinecap="round"/>
        <line x1="16" y1="18" x2="21" y2="18" stroke="var(--gold-dark)" strokeWidth="2" strokeLinecap="round"/>
        <path d="M10 6 L12 3 L14 5 L16 2 L18 5 L20 3 L22 6 Z" fill="var(--gold-dark)"/>
        <circle cx="16" cy="18" r="1.5" fill="currentColor" className="text-primary"/>
      </svg>
      <div className="flex flex-col leading-none">
        <span className="font-serif font-black tracking-[0.2em] uppercase text-foreground text-[18px] sm:text-[22px] leading-none">
          AERA
        </span>
        {showAdminLabel && (
          <span className="text-xs font-bold text-muted uppercase tracking-widest mt-0.5">Admin Panel</span>
        )}
      </div>
    </Link>
  );
}
