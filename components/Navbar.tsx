"use client";

import Link from "next/link";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { API_URL, getTotalUnreadCount, getNotifications, markNotificationAsRead, markAllNotificationsAsRead, getHeaders, getUserId } from "../services/api";
import socket from "../services/socket";
import { ChevronDown } from "lucide-react";
import OptimizedImage from "./OptimizedImage";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

// Inline SVG Logo Component
function WCHLogo({ className = "", onClick = undefined }: { className?: string; onClick?: any }) {
  return (
    <Link href="/" onClick={onClick} className={`flex items-center gap-2 flex-shrink-0 ${className}`}>
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="18" r="12" stroke="#1e3a5f" strokeWidth="2"/>
        <circle cx="16" cy="18" r="8" stroke="#b8860b" strokeWidth="1.5"/>
        <line x1="16" y1="10" x2="16" y2="18" stroke="#1e3a5f" strokeWidth="2" strokeLinecap="round"/>
        <line x1="16" y1="18" x2="21" y2="18" stroke="#b8860b" strokeWidth="2" strokeLinecap="round"/>
        <path d="M10 6 L12 3 L14 5 L16 2 L18 5 L20 3 L22 6 Z" fill="#b8860b"/>
        <circle cx="16" cy="18" r="1.5" fill="#1e3a5f"/>
      </svg>
      <span className="font-serif font-black tracking-[0.2em] uppercase text-foreground text-[18px] sm:text-[22px] leading-none">
        AERAVINTAGE
      </span>
    </Link>
  );
}

// Desktop dropdown item for a super-category with children
function NavCategoryItem({ cat, pathname }: { cat: any; pathname: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const hasChildren = cat.children && cat.children.length > 0;
  const superHref = `/?category=${encodeURIComponent(cat.name)}`;
  const isActive = pathname.includes(`category=${encodeURIComponent(cat.name)}`);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (!hasChildren) {
    return (
      <Link
        href={superHref}
        className={`text-[12px] font-serif uppercase tracking-[0.15em] transition-colors hover:text-gold whitespace-nowrap ${isActive ? "text-gold" : "text-foreground"}`}
      >
        {cat.name}
      </Link>
    );
  }

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <Link
        href={superHref}
        className={`flex items-center gap-1 text-[12px] font-serif uppercase tracking-[0.15em] transition-colors hover:text-gold whitespace-nowrap ${isActive ? "text-gold" : "text-foreground"}`}
      >
        {cat.name}
        <ChevronDown
          className={`w-3 h-3 transition-transform duration-200 ${open ? "rotate-180 text-gold" : ""}`}
        />
      </Link>

      {/* Dropdown panel */}
      <div
        className={`absolute left-0 top-full pt-2 z-[200] transition-all duration-200 ${open ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 -translate-y-1 pointer-events-none"}`}
        style={{ minWidth: "220px" }}
      >
        <div className="bg-background/95 backdrop-blur-xl border border-border shadow-2xl overflow-hidden">
          {/* Header link — browse all in super-category */}
          <Link
            href={superHref}
            className="block px-5 py-3 border-b border-border bg-surface/60 text-[10px] font-black uppercase tracking-[0.2em] text-muted hover:text-gold hover:bg-surface transition-colors"
          >
            All {cat.name}
          </Link>
          {cat.children.map((sub: any) => {
            const subHref = `/?category=${encodeURIComponent(sub.name)}`;
            const subActive = pathname.includes(`category=${encodeURIComponent(sub.name)}`);
            return (
              <Link
                key={sub.id}
                href={subHref}
                className={`flex items-center justify-between px-5 py-3 text-[12px] font-medium transition-colors hover:bg-surface hover:text-gold border-b border-border/40 last:border-0 ${subActive ? "text-gold bg-surface/50" : "text-foreground"}`}
              >
                <span className="font-serif tracking-wide">{sub.name}</span>
                <span className="text-muted text-[10px]">›</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function Navbar() {
  const [search, setSearch] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const { cartItems } = useCart();
  const [watchlistCount, setWatchlistCount] = useState(0);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  // categories = hierarchical tree from API: [{id, name, children:[{id, name}]}]
  const [categories, setCategories] = useState<any[]>([]);
  const [notifications, setNotifications] = useState([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [lastNotification, setLastNotification] = useState(null);
  // Mobile accordion state: which super-category is expanded
  const [mobileExpanded, setMobileExpanded] = useState<number | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const searchRef = useRef(null);

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); setMobileExpanded(null); }, [pathname]);

  // Lock body scroll when mobile menu open
  useEffect(() => {
    if (mobileOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const fetchWatchlistCount = async (userId) => {
    if (!userId) return;
    try {
      const res = await fetch(`${API_URL}/watchlist/${userId}?t=${Date.now()}`, {
        headers: getHeaders(),
        cache: "no-store"
      });
      if (res.ok) {
        const data = await res.json();
        setWatchlistCount(data.length);
      }
    } catch (err) { console.error("Watchlist fetch error:", err); }
  };

  const fetchUnreadCount = async (userId) => {
    if (!userId) return;
    try {
      const res = await getTotalUnreadCount(userId);
      setUnreadMessagesCount(res.total || 0);
    } catch (err) { console.error("Unread fetch error:", err); }
  };

  const fetchNotifications = async () => {
    try {
      const data = await getNotifications();
      if (Array.isArray(data)) {
        setNotifications(data);
        setUnreadNotificationsCount(data.filter((n) => !n.is_read).length);
      }
    } catch (err) { console.error("Notifications fetch error:", err); }
  };

  useEffect(() => {
    if (user) {
      const uid = getUserId(user);
      fetchWatchlistCount(uid);
      fetchUnreadCount(uid);
      fetchNotifications();
      if (uid) {
        if (!socket.connected) socket.connect();
        socket.emit("joinUser", uid);
      }
    } else {
      setWatchlistCount(0);
      setUnreadNotificationsCount(0);
      setUnreadMessagesCount(0);
    }
  }, [pathname, user]);

  useEffect(() => {
    const handleWatchlistUpdate = () => {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try { fetchWatchlistCount(getUserId(JSON.parse(storedUser))); } catch (e) {}
      }
    };
    window.addEventListener("watchlistUpdated", handleWatchlistUpdate);

    const handleNewMessage = (msg) => {
      if (pathname !== "/messages") {
        setUnreadMessagesCount((prev) => prev + 1);
        setLastNotification({ text: msg.message, sender: msg.sender_name || "New Message" });
        setTimeout(() => setLastNotification(null), 5000);
      }
    };
    socket.on("newMessage", handleNewMessage);

    const handleNewNotification = (notification) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadNotificationsCount((prev) => prev + 1);
      setLastNotification({
        text: notification.message,
        sender: notification.title || "System Notification",
        type: notification.type
      });
      setTimeout(() => setLastNotification(null), 6000);
    };
    socket.on("newNotification", handleNewNotification);

    return () => {
      window.removeEventListener("watchlistUpdated", handleWatchlistUpdate);
      socket.off("newMessage", handleNewMessage);
      socket.off("newNotification", handleNewNotification);
    };
  }, [pathname]);

  // Fetch hierarchical categories from API
  useEffect(() => {
    fetch(`${API_URL}/products/categories`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setCategories(data);
        }
      })
      .catch((err) => console.error("Failed to fetch categories for Navbar:", err));
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const q = search.trim();
    router.push(q ? `/?search=${encodeURIComponent(q)}` : "/");
    setMobileOpen(false);
  };

  const handleLogout = () => {
    logout();
    setMobileOpen(false);
  };

  const handleMarkRead = async (id, e?: any) => {
    if (e) e.stopPropagation();
    try {
      await markNotificationAsRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
      setUnreadNotificationsCount((prev) => Math.max(0, prev - 1));
    } catch (err) { console.error(err); }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadNotificationsCount(0);
    } catch (err) { console.error(err); }
  };

  const requireAuth = (e, path) => {
    if (!user) {
      e.preventDefault();
      router.push(`/login?redirect=${encodeURIComponent(path)}`);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-[100] bg-background/80 backdrop-blur-lg border-b border-border/50">
        {/* Concierge Top Bar */}
        <div className="hidden md:flex bg-primary text-white text-[10px] font-bold tracking-widest uppercase z-[110]">
          <div className="max-w-[1400px] w-full mx-auto px-6 py-2 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <span className="text-white">AeraVintage Concierge</span>
              <span className="opacity-40">|</span>
              {user ? (
                <span>Welcome, <span className="text-white">{user.name}</span></span>
              ) : (
                <span className="opacity-80">Authentic · Verified · Trusted</span>
              )}
            </div>
            <div className="flex items-center gap-6">
              {user ? (
                <>
                  <Link href="/profile" className="hover:opacity-70 transition-opacity">My Collection</Link>
                  <Link href="/messages" className="hover:opacity-70 transition-opacity">
                    Messages {unreadMessagesCount > 0 && <span className="text-white">({unreadMessagesCount})</span>}
                  </Link>
                  <div className="relative">
                    <button onClick={() => setNotificationsOpen(!notificationsOpen)} className="hover:opacity-70 transition-opacity flex items-center gap-1">
                      Alerts {unreadNotificationsCount > 0 && <span className="w-1.5 h-1.5 bg-rose-500 rounded-full inline-block ml-1"></span>}
                    </button>
                    {notificationsOpen && (
                      <>
                        <div className="fixed inset-0 z-[110]" onClick={() => setNotificationsOpen(false)}></div>
                        <div className="absolute right-0 mt-3 w-80 bg-background text-foreground shadow-2xl border border-border z-[120] overflow-hidden normal-case tracking-normal">
                          <div className="p-4 border-b border-border flex justify-between items-center">
                            <h3 className="font-serif font-bold text-sm tracking-wide">Notifications</h3>
                            {unreadNotificationsCount > 0 && (
                              <button onClick={handleMarkAllRead} className="text-[10px] text-gold uppercase tracking-widest font-bold">Mark Read</button>
                            )}
                          </div>
                          <div className="max-h-[300px] overflow-y-auto">
                            {notifications.length === 0 ? (
                              <div className="p-8 text-center text-muted text-xs">No alerts found.</div>
                            ) : (
                              notifications.map((n) => (
                                <div
                                  key={n.id}
                                  onClick={() => { handleMarkRead(n.id); if (n.link) router.push(n.link); setNotificationsOpen(false); }}
                                  className={`p-4 border-b border-gray-50 hover:bg-surface cursor-pointer transition-colors ${!n.is_read ? "bg-blue-50/10" : ""}`}
                                >
                                  <p className="font-serif text-[13px] mb-1 text-foreground">{n.title}</p>
                                  <p className="text-muted text-[11px] leading-relaxed">{n.message}</p>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                  {user.role === "admin" && <Link href="/admin" className="text-white hover:opacity-70 transition-opacity">Admin Panel</Link>}
                  <button onClick={handleLogout} className="hover:opacity-70 transition-opacity">Logout</button>
                </>
              ) : (
                <>
                  <Link href="/login" className="hover:opacity-70 transition-opacity">Sign In</Link>
                  <Link href="/register" className="hover:opacity-70 transition-opacity">Register</Link>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Main Header */}
        <div className="max-w-[1400px] mx-auto px-6 py-5 flex items-center justify-between">
          <WCHLogo />

          {/* Search */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-lg mx-10 items-center border-b border-border hover:border-gold focus-within:border-gold transition-colors h-10 group">
            <input
              ref={searchRef}
              type="text"
              placeholder="Search timepieces, brands, references..."
              style={{ border: "none", outline: "none", boxShadow: "none", backgroundColor: "transparent" }}
              className="w-full px-2 outline-none text-[13px] font-medium text-foreground placeholder:text-muted ring-0 focus:ring-0 focus:outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button type="submit" className="text-muted group-hover:text-gold focus:text-gold transition-colors p-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </button>
          </form>

          {/* Right Actions */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/cart" className="relative text-muted hover:text-gold transition-colors flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em]">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              Cart
              {cartItems.length > 0 && <span className="absolute -top-1.5 -right-2 bg-gold text-white text-[8px] px-1.5 py-0.5 rounded-full font-black">{cartItems.length}</span>}
            </Link>
            <Link href="/watchlist" onClick={(e) => requireAuth(e, "/watchlist")} className="relative text-muted hover:text-gold transition-colors flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em]">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
              Watchlist
              {watchlistCount > 0 && <span className="absolute -top-1.5 -right-2 bg-gold text-white text-[8px] px-1 rounded-full">{watchlistCount}</span>}
            </Link>
            <Link href="/sell" onClick={(e) => requireAuth(e, "/sell")} className="bg-primary text-white border border-primary hover:bg-transparent hover:text-primary transition-colors px-6 py-2.5 text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-2 shadow-sm hover:shadow-none">
              Sell
            </Link>
          </div>

          {/* Mobile Hamburger & Actions */}
          <div className="flex md:hidden items-center gap-4">
            <Link href="/cart" className="relative text-foreground p-1">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              {cartItems.length > 0 && <span className="absolute -top-1 -right-1 bg-gold text-white text-[8px] px-1.5 py-0.5 rounded-full font-black">{cartItems.length}</span>}
            </Link>
            <button onClick={() => setMobileOpen(true)} className="p-1 text-foreground">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
          </div>
        </div>

        {/* ── Desktop Categories Bar with Dropdowns ── */}
        <div className="hidden md:block border-t border-border relative z-50">
          <div className="max-w-[1400px] mx-auto px-6 flex flex-wrap items-center justify-center gap-8 py-4">
            {/* Home link is always first */}
            <Link
              href="/"
              className={`text-[12px] font-serif uppercase tracking-[0.15em] transition-colors hover:text-gold whitespace-nowrap ${pathname === "/" && !window?.location?.search.includes("category") ? "text-gold" : "text-foreground"}`}
            >
              Home
            </Link>
            {categories.map((cat) => (
              <NavCategoryItem key={cat.id} cat={cat} pathname={pathname} />
            ))}
          </div>
        </div>
      </header>

      {/* ── Mobile Slide-In Menu ── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[200] md:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm touch-none" onClick={() => setMobileOpen(false)} />
          <div className="absolute right-0 top-0 w-4/5 max-w-xs bg-surface shadow-2xl flex flex-col slide-in-right h-[100dvh]">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-border">
              <WCHLogo onClick={() => setMobileOpen(false)} />
              <button onClick={() => setMobileOpen(false)} className="p-2 text-muted hover:text-foreground hover:bg-background rounded-full">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Auth Header (Moved from Footer) */}
            <div className="p-4 border-b border-border bg-gray-50/50">
              {user ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 px-3 py-2">
                    <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-black text-sm shadow-inner">
                      {(user.name || "U")[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="text-[14px] font-bold text-foreground">{user.name || "User"}</p>
                      <p className="text-[11px] text-muted">{user.email}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-full transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-3">
                  <Link href="/login" onClick={() => setMobileOpen(false)} className="flex-1 py-2.5 text-center text-sm font-bold text-primary border border-[#1e3a5f] hover:bg-blue-50 transition-colors">
                    Sign In
                  </Link>
                  <Link href="/register" onClick={() => setMobileOpen(false)} className="flex-1 py-2.5 text-center text-sm font-bold text-white bg-primary hover:bg-[#2e538a] transition-colors">
                    Register
                  </Link>
                </div>
              )}
            </div>

            {/* Search */}
            <div className="p-4 border-b border-border">
              <form onSubmit={handleSearch} className="flex items-center border border-border overflow-hidden bg-background">
                <div className="flex-1 flex items-center px-3">
                  <svg className="w-4 h-4 text-muted shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search watches..."
                    className="w-full px-3 py-3 bg-transparent outline-none text-sm font-medium"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <button type="submit" className="bg-primary text-white px-4 py-3">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </form>
            </div>

            {/* Nav Links with accordion sub-categories */}
            <nav className="flex-1 overflow-y-auto p-4 space-y-1 pb-20">
              <Link
                href="/"
                onClick={() => setMobileOpen(false)}
                className="flex items-center px-4 py-3 text-[13px] font-semibold text-muted hover:text-primary hover:bg-blue-50 transition-all"
              >
                Home
              </Link>
              {categories.map((cat) => {
                const hasChildren = cat.children && cat.children.length > 0;
                const isExpanded = mobileExpanded === cat.id;
                return (
                  <div key={cat.id}>
                    <div className="flex items-center">
                      <Link
                        href={`/?category=${encodeURIComponent(cat.name)}`}
                        onClick={() => { if (!hasChildren) setMobileOpen(false); }}
                        className="flex-1 px-4 py-3 text-[13px] font-semibold text-muted hover:text-primary hover:bg-blue-50 transition-all"
                      >
                        {cat.name}
                      </Link>
                      {hasChildren && (
                        <button
                          onClick={() => setMobileExpanded(isExpanded ? null : cat.id)}
                          className="px-3 py-3 text-muted hover:text-primary"
                        >
                          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
                        </button>
                      )}
                    </div>
                    {hasChildren && isExpanded && (
                      <div className="ml-4 border-l border-border/50 pl-2 space-y-0.5 pb-1">
                        {cat.children.map((sub) => (
                          <Link
                            key={sub.id}
                            href={`/?category=${encodeURIComponent(sub.name)}`}
                            onClick={() => setMobileOpen(false)}
                            className="flex items-center px-4 py-2.5 text-[12px] font-medium text-muted hover:text-primary hover:bg-blue-50 transition-all"
                          >
                            <span className="text-gold mr-2 text-[10px]">›</span>
                            {sub.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              <div className="border-t border-border my-3 pt-3 space-y-1">
                <Link href="/sell" onClick={(e) => { setMobileOpen(false); requireAuth(e, "/sell"); }} className="flex items-center px-4 py-3 text-[13px] font-semibold text-muted hover:text-primary hover:bg-blue-50 transition-all">
                  Sell a Watch
                </Link>
                <Link href="/messages" onClick={() => setMobileOpen(false)} className="flex items-center justify-between px-4 py-3 text-[13px] font-semibold text-muted hover:text-primary hover:bg-blue-50 transition-all">
                  <span>Messages</span>
                  {unreadMessagesCount > 0 && (
                    <span className="bg-primary text-white text-[10px] font-black px-2 py-0.5 rounded-full">{unreadMessagesCount}</span>
                  )}
                </Link>
                <Link href="/watchlist" onClick={(e) => { setMobileOpen(false); requireAuth(e, "/watchlist"); }} className="flex items-center px-4 py-3 text-[13px] font-semibold text-muted hover:text-primary hover:bg-blue-50 transition-all">
                  Watchlist
                </Link>
                <Link href="/profile" onClick={() => setMobileOpen(false)} className="flex items-center px-4 py-3 text-[13px] font-semibold text-muted hover:text-primary hover:bg-blue-50 transition-all">
                  My Profile
                </Link>
                {user?.role === "admin" && (
                  <Link href="/admin" onClick={() => setMobileOpen(false)} className="flex items-center px-4 py-3 text-[13px] font-semibold text-rose-600 hover:bg-rose-50 transition-all">
                    Admin Panel
                  </Link>
                )}
              </div>
            </nav>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {lastNotification && (
        <div
          onClick={() => { router.push("/messages"); setLastNotification(null); }}
          className="fixed bottom-6 right-4 sm:right-6 bg-foreground text-white p-4 shadow-2xl z-[300] cursor-pointer slide-in-right flex items-center gap-3 max-w-[320px] border border-gray-800"
        >
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center font-black text-sm shrink-0">
            {lastNotification.sender[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black uppercase tracking-widest text-gold mb-0.5">New Message</p>
            <p className="text-sm font-bold truncate">{lastNotification.sender}</p>
            <p className="text-xs text-muted truncate">{lastNotification.text}</p>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); setLastNotification(null); }}
            className="text-muted hover:text-white shrink-0 p-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </>
  );
}