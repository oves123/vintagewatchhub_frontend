"use client";

import Link from "next/link";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-surface text-foreground border-t border-border mt-auto relative z-10">
      <div className="max-w-[1500px] mx-auto px-5 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">
          {/* Brand & Trust */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <svg width="30" height="30" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="16" cy="18" r="12" stroke="currentColor" strokeWidth="2"/>
                <circle cx="16" cy="18" r="8" stroke="var(--gold)" strokeWidth="1.5"/>
                <line x1="16" y1="10" x2="16" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <line x1="16" y1="18" x2="21" y2="18" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round"/>
                <path d="M10 6 L12 3 L14 5 L16 2 L18 5 L20 3 L22 6 Z" fill="var(--gold)"/>
                <circle cx="16" cy="18" r="1.5" fill="currentColor"/>
              </svg>
              <span className="font-bold text-[17px]">
                Aera
              </span>
            </div>
            <p className="text-[13px] text-muted leading-relaxed mb-6">
              The premium marketplace for pre-owned, authentic timepieces. Buy, sell, and trade watches with verified collectors worldwide.
            </p>

            {/* Escrow Trust Badge */}
            <div className="bg-background border border-border p-4 rounded-xl">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-gold-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <p className="text-[11px] font-black text-gold-dark uppercase tracking-widest">Escrow Protection</p>
                  <p className="text-xs text-muted">Funds held securely</p>
                </div>
              </div>
              <div className="h-1 bg-border rounded-full overflow-hidden mt-3">
                <div className="h-full w-3/4 bg-gold rounded-full"></div>
              </div>
              <div className="flex justify-between text-[10px] text-muted mt-1 uppercase tracking-wider font-bold">
                <span>Offer</span>
                <span>Escrow</span>
                <span>Shipped</span>
                <span>Inspection</span>
                <span className="text-gold-dark">Complete</span>
              </div>
            </div>
          </div>

          {/* Marketplace */}
          <div>
            <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-foreground mb-5">Marketplace</h4>
            <ul className="space-y-3">
              {[
                { label: "Browse Watches", href: "/" },
                { label: "Pre-Owned Watches", href: "/?category=Pre-Owned Watches" },
                { label: "New Watches", href: "/?category=New Watches" },
                { label: "Watch Lots", href: "/?category=Watch Lots" },
                { label: "Accessories", href: "/?category=Accessories" },
                { label: "Tools & Parts", href: "/?category=Tools & Parts" },
              ].map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="text-[13px] text-muted hover:text-foreground transition-colors relative group">
                    <span className="relative z-10">{link.label}</span>
                    <span className="absolute bottom-0 left-0 w-0 h-px bg-gold transition-all duration-300 group-hover:w-full"></span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account */}
          <div>
            <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-foreground mb-5">Account</h4>
            <ul className="space-y-3">
              {[
                { label: "My Profile", href: "/profile" },
                { label: "Watchlist", href: "/watchlist" },
                { label: "Messages", href: "/messages" },
                { label: "Sell a Watch", href: "/sell" },
                { label: "Sign In", href: "/login" },
              ].map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="text-[13px] text-muted hover:text-foreground transition-colors relative group">
                    <span className="relative z-10">{link.label}</span>
                    <span className="absolute bottom-0 left-0 w-0 h-px bg-gold transition-all duration-300 group-hover:w-full"></span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Security & Trust */}
          <div>
            <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-foreground mb-5">Buyer Protection</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <span className="wax-seal-sm shrink-0 flex items-center justify-center text-xs mt-0.5">&#10003;</span>
                <div>
                  <p className="text-[13px] text-foreground font-bold">Authenticity Guaranteed</p>
                  <p className="text-xs text-muted">Every watch verified by experts</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="wax-seal-sm shrink-0 flex items-center justify-center text-xs mt-0.5">&#10003;</span>
                <div>
                  <p className="text-[13px] text-foreground font-bold">48h Inspection Period</p>
                  <p className="text-xs text-muted">Return if not as described</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="wax-seal-sm shrink-0 flex items-center justify-center text-xs mt-0.5">&#10003;</span>
                <div>
                  <p className="text-[13px] text-foreground font-bold">Secure Escrow</p>
                  <p className="text-xs text-muted">Funds released only after approval</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="wax-seal-sm shrink-0 flex items-center justify-center text-xs mt-0.5">&#10003;</span>
                <div>
                  <p className="text-[13px] text-foreground font-bold">24/7 Concierge Support</p>
                  <p className="text-xs text-muted">Dedicated assistance for every deal</p>
                </div>
              </li>
            </ul>

            {/* Gold Foil Stamp */}
            <div className="mt-6 border border-gold/20 p-4 text-center bg-gold/5 rounded-xl">
              <p className="text-[10px] text-gold-dark uppercase tracking-[0.3em] font-black">Authenticity Seal</p>
              <p className="text-xs text-gold font-serif italic mt-1">Verified & Certified</p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted font-bold uppercase tracking-widest">
            &copy; {year} Aera Inc. All Rights Reserved.
          </p>
          <div className="flex gap-6 text-[11px] font-bold uppercase tracking-widest text-muted">
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <Link href="/cookies" className="hover:text-foreground transition-colors">Cookies</Link>
            <Link href="/shipping" className="hover:text-foreground transition-colors">Shipping</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
