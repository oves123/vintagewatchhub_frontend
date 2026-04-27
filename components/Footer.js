"use client";

import Link from "next/link";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[#1e3a5f] text-white mt-auto">
      <div className="max-w-[1300px] mx-auto px-5 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <svg width="30" height="30" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="16" cy="18" r="12" stroke="white" strokeWidth="2"/>
                <circle cx="16" cy="18" r="8" stroke="#b8860b" strokeWidth="1.5"/>
                <line x1="16" y1="10" x2="16" y2="18" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                <line x1="16" y1="18" x2="21" y2="18" stroke="#b8860b" strokeWidth="2" strokeLinecap="round"/>
                <path d="M10 6 L12 3 L14 5 L16 2 L18 5 L20 3 L22 6 Z" fill="#b8860b"/>
                <circle cx="16" cy="18" r="1.5" fill="white"/>
              </svg>
              <span className="font-bold text-[17px]">
                WatchCollector<span className="text-[#b8860b]">HUB</span>
              </span>
            </div>
            <p className="text-[13px] text-white/70 leading-relaxed">
              The premium marketplace for pre-owned, authentic timepieces. Buy, sell, and trade watches with verified collectors worldwide.
            </p>
          </div>

          {/* Marketplace */}
          <div>
            <h4 className="text-[11px] font-black uppercase tracking-widest text-[#b8860b] mb-4">Marketplace</h4>
            <ul className="space-y-2.5">
              {[
                { label: "Browse Watches", href: "/" },
                { label: "Pre-Owned Watches", href: "/?category=Pre-Owned Watches" },
                { label: "New Watches", href: "/?category=New Watches" },
                { label: "Watch Lots", href: "/?category=Watch Lots" },
                { label: "Accessories", href: "/?category=Accessories" },
                { label: "Tools & Parts", href: "/?category=Tools & Parts" },
              ].map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="text-[13px] text-white/70 hover:text-white hover:text-[#b8860b] transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account */}
          <div>
            <h4 className="text-[11px] font-black uppercase tracking-widest text-[#b8860b] mb-4">Account</h4>
            <ul className="space-y-2.5">
              {[
                { label: "My Profile", href: "/profile" },
                { label: "Watchlist", href: "/watchlist" },
                { label: "Messages", href: "/messages" },
                { label: "Sell a Watch", href: "/sell" },
                { label: "Sign In", href: "/login" },
              ].map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="text-[13px] text-white/70 hover:text-[#b8860b] transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Trust & Info */}
          <div>
            <h4 className="text-[11px] font-black uppercase tracking-widest text-[#b8860b] mb-4">Security</h4>
            <ul className="space-y-3">
              {[
                { icon: "🔒", text: "Buyer Protection" },
                { icon: "✅", text: "Verified Sellers" },
                { icon: "🛡️", text: "Secure Transactions" },
                { icon: "🕒", text: "24/7 Support" },
              ].map(item => (
                <li key={item.text} className="flex items-center gap-2 text-[13px] text-white/70">
                  <span>{item.icon}</span>
                  {item.text}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[11px] text-white/50">
            &copy; {year} WatchCollectorHub Inc. All Rights Reserved.
          </p>
          <div className="flex gap-5 text-[11px] text-white/50">
            <Link href="#" className="hover:text-white/80 transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-white/80 transition-colors">Terms</Link>
            <Link href="#" className="hover:text-white/80 transition-colors">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
