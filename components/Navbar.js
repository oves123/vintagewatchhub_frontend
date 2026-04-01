"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { API_URL, getTotalUnreadCount, getNotifications, markNotificationAsRead, markAllNotificationsAsRead } from "../services/api";
import socket from "../services/socket";

// Inline SVG Logo Component
function WCHLogo({ className = "", onClick }) {
  return (
    <Link href="/" onClick={onClick} className={`flex items-center gap-2 flex-shrink-0 ${className}`}>
      {/* Crown + Watch Icon */}
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="18" r="12" stroke="#1e3a5f" strokeWidth="2"/>
        <circle cx="16" cy="18" r="8" stroke="#b8860b" strokeWidth="1.5"/>
        <line x1="16" y1="10" x2="16" y2="18" stroke="#1e3a5f" strokeWidth="2" strokeLinecap="round"/>
        <line x1="16" y1="18" x2="21" y2="18" stroke="#b8860b" strokeWidth="2" strokeLinecap="round"/>
        <path d="M10 6 L12 3 L14 5 L16 2 L18 5 L20 3 L22 6 Z" fill="#b8860b"/>
        <circle cx="16" cy="18" r="1.5" fill="#1e3a5f"/>
      </svg>
      <span className="font-bold tracking-tight text-gray-950 text-[16px] sm:text-[18px] leading-none">
        Watch<span className="text-[#1e3a5f]">Collector</span><span className="text-[#b8860b] font-black">HUB</span>
      </span>
    </Link>
  );
}

export default function Navbar() {
  const [search, setSearch] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [watchlistCount, setWatchlistCount] = useState(0);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [lastNotification, setLastNotification] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchRef = useRef(null);

  // Scroll shadow effect
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  // Trap focus in mobile menu
  useEffect(() => {
    if (mobileOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const fetchWatchlistCount = async (userId) => {
    try {
      const res = await fetch(`${API_URL}/watchlist/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setWatchlistCount(data.length);
      }
    } catch (err) { console.error("Watchlist fetch error:", err); }
  };

  const fetchUnreadCount = async (userId) => {
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
        const unread = data.filter(n => !n.is_read).length;
        setUnreadNotificationsCount(unread);
      }
    } catch (err) { console.error("Notifications fetch error:", err); }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        fetchWatchlistCount(parsedUser.id);
        fetchUnreadCount(parsedUser.id);
        fetchNotifications();
        
        // Join user room for private notifications
        socket.emit("joinUser", parsedUser.id);
      } catch (err) { console.error("Failed to parse user session"); }
    } else {
      setUser(null);
      setWatchlistCount(0);
      setUnreadNotificationsCount(0);
      setUnreadMessagesCount(0);
    }
  }, [pathname]);

  useEffect(() => {
    const handleWatchlistUpdate = () => {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          fetchWatchlistCount(parsedUser.id);
        } catch (e) {}
      }
    };
    window.addEventListener("watchlistUpdated", handleWatchlistUpdate);

    const handleNewMessage = (msg) => {
      if (pathname !== '/messages') {
        setUnreadMessagesCount(prev => prev + 1);
        setLastNotification({ text: msg.message, sender: msg.sender_name || 'New Message' });
        setTimeout(() => setLastNotification(null), 5000);
      }
    };
    socket.on("newMessage", handleNewMessage);

    const handleNewNotification = (notification) => {
      setNotifications(prev => [notification, ...prev]);
      setUnreadNotificationsCount(prev => prev + 1);
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

  const handleSearch = (e) => {
    e.preventDefault();
    const q = search.trim();
    router.push(q ? `/?search=${encodeURIComponent(q)}` : "/");
    setMobileOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setMobileOpen(false);
    router.push("/login");
  };

  const handleMarkRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await markNotificationAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadNotificationsCount(prev => Math.max(0, prev - 1));
    } catch (err) { console.error(err); }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadNotificationsCount(0);
    } catch (err) { console.error(err); }
  };

  const requireAuth = (e, path) => {
    if (!user) {
      e.preventDefault();
      router.push(`/login?redirect=${encodeURIComponent(path)}`);
    }
  };

  const categories = [
    { label: "Home", href: "/" },
    { label: "Pre-Owned Watches", href: "/?category=Pre-Owned Watches" },
    { label: "New Watches", href: "/?category=New Watches" },
    { label: "Watch Lots", href: "/?category=Watch Lots" },
    { label: "Accessories", href: "/?category=Accessories" },
    { label: "Tools & Parts", href: "/?category=Tools & Parts" },
  ];

  return (
    <>
      <header className={`bg-white sticky top-0 z-[100] border-b border-gray-100 transition-shadow duration-300 ${scrolled ? 'shadow-md' : ''}`}>
        {/* Top Utility Bar */}
        <div className="hidden md:flex bg-[#1e3a5f] text-white text-[11px] font-medium">
          <div className="max-w-[1300px] w-full mx-auto px-4 py-1.5 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-[#b8860b] rounded-full animate-pulse"></span>
              {user ? (
                <span>Welcome back, <strong>{user.name}</strong></span>
              ) : (
                <span>
                  <Link href="/login" className="underline hover:text-[#b8860b]">Sign in</Link>
                  {" "}or{" "}
                  <Link href="/register" className="underline hover:text-[#b8860b]">Register</Link>
                </span>
              )}
            </div>
            <div className="flex items-center gap-5">
              <span className="opacity-60">Authentic · Verified · Trusted</span>
              {user && (
                <button onClick={handleLogout} className="hover:text-[#b8860b] transition-colors">Logout</button>
              )}
              {user?.role === "admin" && (
                <Link href="/admin" className="text-[#b8860b] font-bold">Admin Panel</Link>
              )}
            </div>
          </div>
        </div>

        {/* Main Header */}
        <div className="max-w-[1300px] mx-auto px-4 py-3 md:py-4 flex items-center gap-3 md:gap-6">
          <WCHLogo />

          {/* Desktop Search */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 items-center border border-gray-200 rounded-xl overflow-hidden h-11 focus-within:border-[#1e3a5f] focus-within:ring-2 focus-within:ring-blue-50 bg-gray-50 max-w-2xl">
            <div className="flex-1 flex items-center px-4">
              <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={searchRef}
                type="text"
                placeholder="Search watches, brands, models..."
                className="w-full px-3 bg-transparent outline-none text-[13px] font-medium text-gray-700 placeholder:text-gray-400"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button type="submit" className="bg-[#1e3a5f] hover:bg-[#2e538a] text-white px-6 h-full font-bold text-xs uppercase tracking-wider transition-colors">
              Search
            </button>
          </form>

          {/* Desktop Right Nav */}
          <nav className="hidden md:flex items-center gap-1">
            <Link href="/sell" onClick={(e) => requireAuth(e, '/sell')} className="px-3 py-2 text-[12px] font-semibold text-gray-600 hover:text-[#1e3a5f] hover:bg-gray-50 rounded-lg transition-all whitespace-nowrap">
              Sell
            </Link>
            <Link href="/profile" className="px-3 py-2 text-[12px] font-semibold text-gray-600 hover:text-[#1e3a5f] hover:bg-gray-50 rounded-lg transition-all">
              Profile
            </Link>
            {user && (
              <div className="relative">
                <button 
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className={`p-2 rounded-lg transition-all relative ${notificationsOpen ? 'bg-gray-100 text-[#1e3a5f]' : 'text-gray-600 hover:text-[#1e3a5f] hover:bg-gray-50'}`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unreadNotificationsCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full"></span>
                  )}
                </button>

                {notificationsOpen && (
                  <>
                    <div className="fixed inset-0 z-[110]" onClick={() => setNotificationsOpen(false)}></div>
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-[120] overflow-hidden slide-in-top">
                      <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                        <h3 className="font-bold text-gray-900 text-sm">Notifications</h3>
                        {unreadNotificationsCount > 0 && (
                          <button onClick={handleMarkAllRead} className="text-[11px] font-bold text-[#1e3a5f] hover:underline">Mark all read</button>
                        )}
                      </div>
                      <div className="max-h-[400px] overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-8 text-center">
                            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                              <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                              </svg>
                            </div>
                            <p className="text-gray-400 text-xs font-medium">No notifications yet</p>
                          </div>
                        ) : (
                          notifications.map((n) => (
                            <div 
                              key={n.id} 
                              onClick={() => {
                                handleMarkRead(n.id);
                                if (n.link) router.push(n.link);
                                setNotificationsOpen(false);
                              }}
                              className={`p-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors relative ${!n.is_read ? 'bg-blue-50/30' : ''}`}
                            >
                              <div className="flex gap-3">
                                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${!n.is_read ? 'bg-[#1e3a5f]' : 'bg-transparent'}`}></div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-bold text-gray-900 text-xs mb-0.5">{n.title}</p>
                                  <p className="text-gray-500 text-[11px] leading-relaxed line-clamp-2">{n.message}</p>
                                  <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold tracking-wider">
                                    {new Date(n.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      <Link href="/profile" onClick={() => setNotificationsOpen(false)} className="block p-3 text-center text-[11px] font-bold text-gray-500 hover:text-[#1e3a5f] bg-gray-50/30 border-t border-gray-50">
                        View All Activity
                      </Link>
                    </div>
                  </>
                )}
              </div>
            )}
            {user && (
              <Link href="/messages" className="px-3 py-2 text-[12px] font-semibold text-gray-600 hover:text-[#1e3a5f] hover:bg-gray-50 rounded-lg transition-all flex items-center gap-1.5">
                Messages
                {unreadMessagesCount > 0 && (
                  <span className="bg-[#1e3a5f] text-white text-[9px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center">{unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}</span>
                )}
              </Link>
            )}
            {/* Watchlist Icon */}
            <Link href="/watchlist" onClick={(e) => requireAuth(e, '/watchlist')} className="relative p-2 text-gray-600 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {watchlistCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full min-w-[16px] text-center">
                  {watchlistCount > 9 ? '9+' : watchlistCount}
                </span>
              )}
            </Link>
          </nav>

          {/* Mobile Right: Watchlist + Hamburger */}
          <div className="flex md:hidden items-center gap-1.5 sm:gap-2 ml-auto">
            <Link href="/watchlist" className="relative p-1.5 sm:p-2 text-gray-700">
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {watchlistCount > 0 && (
                <span className="absolute top-0.5 right-0.5 bg-rose-500 text-white text-[8px] font-black px-1 py-0.5 rounded-full min-w-[14px] text-center">{watchlistCount}</span>
              )}
            </Link>
            {user && (
              <Link href="/messages" className="relative p-1.5 sm:p-2 text-gray-700">
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                {unreadMessagesCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 bg-[#1e3a5f] text-white text-[8px] font-black px-1 py-0.5 rounded-full min-w-[14px] text-center">{unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}</span>
                )}
              </Link>
            )}
            <button
              onClick={() => setMobileOpen(true)}
              className="p-1.5 sm:p-2 text-gray-700 hover:bg-gray-100 rounded-lg ml-1"
              aria-label="Open menu"
            >
              <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

        </div>

        {/* Categories Bar (Desktop) */}
        <div className="hidden md:flex border-t border-gray-100 bg-white">
          <div className="max-w-[1300px] w-full mx-auto px-4 flex items-center gap-1 overflow-x-auto scrollbar-hide py-1">
            {categories.map((cat) => (
              <Link
                key={cat.href}
                href={cat.href}
                className={`whitespace-nowrap px-4 py-2 text-[11px] font-semibold uppercase tracking-wider rounded-lg transition-all ${
                  pathname === cat.href || (cat.href !== "/" && pathname.startsWith(cat.href.split("?")[0]))
                    ? 'text-[#1e3a5f] bg-blue-50'
                    : 'text-gray-500 hover:text-[#1e3a5f] hover:bg-gray-50'
                }`}
              >
                {cat.label}
              </Link>
            ))}
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[200] md:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-4/5 max-w-xs bg-white shadow-2xl flex flex-col slide-in-right">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <WCHLogo onClick={() => setMobileOpen(false)} />
              <button onClick={() => setMobileOpen(false)} className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Search */}
            <div className="p-4 border-b border-gray-100">
              <form onSubmit={handleSearch} className="flex items-center border border-gray-200 rounded-xl overflow-hidden bg-gray-50">
                <div className="flex-1 flex items-center px-3">
                  <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                <button type="submit" className="bg-[#1e3a5f] text-white px-4 py-3">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </form>
            </div>

            {/* Nav Links */}
            <nav className="flex-1 overflow-y-auto p-4 space-y-1">
              {categories.map((cat) => (
                <Link
                  key={cat.href}
                  href={cat.href}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center px-4 py-3 text-[13px] font-semibold text-gray-700 hover:text-[#1e3a5f] hover:bg-blue-50 rounded-xl transition-all"
                >
                  {cat.label}
                </Link>
              ))}

              <div className="border-t border-gray-100 my-3 pt-3 space-y-1">
                <Link href="/sell" onClick={(e) => { setMobileOpen(false); requireAuth(e, '/sell'); }} className="flex items-center px-4 py-3 text-[13px] font-semibold text-gray-700 hover:text-[#1e3a5f] hover:bg-blue-50 rounded-xl transition-all">
                  🏷️ Sell a Watch
                </Link>
                <Link href="/messages" onClick={() => setMobileOpen(false)} className="flex items-center justify-between px-4 py-3 text-[13px] font-semibold text-gray-700 hover:text-[#1e3a5f] hover:bg-blue-50 rounded-xl transition-all">
                  <span>💬 Messages</span>
                  {unreadMessagesCount > 0 && (
                    <span className="bg-[#1e3a5f] text-white text-[10px] font-black px-2 py-0.5 rounded-full">{unreadMessagesCount}</span>
                  )}
                </Link>
                <Link href="/watchlist" onClick={(e) => { setMobileOpen(false); requireAuth(e, '/watchlist'); }} className="flex items-center px-4 py-3 text-[13px] font-semibold text-gray-700 hover:text-[#1e3a5f] hover:bg-blue-50 rounded-xl transition-all">
                  ❤️ Watchlist
                </Link>
                <Link href="/profile" onClick={() => setMobileOpen(false)} className="flex items-center px-4 py-3 text-[13px] font-semibold text-gray-700 hover:text-[#1e3a5f] hover:bg-blue-50 rounded-xl transition-all">
                  👤 My Profile
                </Link>
                {user?.role === "admin" && (
                  <Link href="/admin" onClick={() => setMobileOpen(false)} className="flex items-center px-4 py-3 text-[13px] font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-all">
                    🔧 Admin Panel
                  </Link>
                )}
              </div>
            </nav>

            {/* Auth Footer */}
            <div className="p-4 border-t border-gray-100 safe-bottom">
              {user ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 px-4 py-3 bg-blue-50 rounded-xl">
                    <div className="w-9 h-9 bg-[#1e3a5f] text-white rounded-full flex items-center justify-center font-black text-sm">
                      {user.name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="text-[13px] font-bold text-gray-900">{user.name}</p>
                      <p className="text-[11px] text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full py-3 text-center text-sm font-bold text-rose-600 border border-rose-200 rounded-xl hover:bg-rose-50 transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="flex gap-3">
                  <Link href="/login" onClick={() => setMobileOpen(false)} className="flex-1 py-3 text-center text-sm font-bold text-[#1e3a5f] border border-[#1e3a5f] rounded-xl hover:bg-blue-50">
                    Sign In
                  </Link>
                  <Link href="/register" onClick={() => setMobileOpen(false)} className="flex-1 py-3 text-center text-sm font-bold text-white bg-[#1e3a5f] rounded-xl hover:bg-[#2e538a]">
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {lastNotification && (
        <div
          onClick={() => { router.push('/messages'); setLastNotification(null); }}
          className="fixed bottom-6 right-4 sm:right-6 bg-gray-900 text-white p-4 rounded-2xl shadow-2xl z-[300] cursor-pointer slide-in-right flex items-center gap-3 max-w-[320px] border border-gray-800"
        >
          <div className="w-10 h-10 bg-[#1e3a5f] rounded-full flex items-center justify-center font-black text-sm shrink-0">
            {lastNotification.sender[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#b8860b] mb-0.5">New Message</p>
            <p className="text-sm font-bold truncate">{lastNotification.sender}</p>
            <p className="text-xs text-gray-400 truncate">{lastNotification.text}</p>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); setLastNotification(null); }}
            className="text-gray-500 hover:text-white shrink-0 p-1"
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