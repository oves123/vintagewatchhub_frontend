"use client";

import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import Link from "next/link";
import { API_URL, API_BASE_URL } from "../../services/api";

export default function WatchlistPage() {
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      fetch(`${API_URL}/watchlist/${parsedUser.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setWatchlist(data);
          } else {
            console.error("Watchlist API returned non-array:", data);
            setWatchlist([]);
          }
          setLoading(false);
        })
        .catch((err) => {
          console.error("Failed to fetch watchlist:", err);
          setWatchlist([]);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const removeFromWatchlist = async (productId) => {
    if (!confirm("Are you sure you want to remove this item?")) return;
    if (!user) return;

    try {
      await fetch(`${API_URL}/watchlist/remove`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, product_id: productId }),
      });
      setWatchlist(watchlist.filter((item) => item.product_id !== productId));
      window.dispatchEvent(new Event("watchlistUpdated"));
    } catch (err) {
      alert("Failed to remove item");
    }
  };

  const getThumbnail = (item) => {
    let images = [];
    try {
      images = typeof item.images === 'string' ? JSON.parse(item.images) : (Array.isArray(item.images) ? item.images : []);
    } catch (e) { images = []; }

    const firstImage = (images.length > 0) ? images[0] : item.image;
    
    if (!firstImage) {
      return "https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?q=80&w=400&auto=format&fit=crop";
    }
    
    return firstImage.startsWith('http') ? firstImage : `${API_BASE_URL}/uploads/${firstImage}`;
  };

  const formatTimeLeft = (endTime) => {
    if (!endTime) return null;
    const now = new Date();
    const end = new Date(endTime);
    const diff = end - now;

    if (diff <= 0) return "Auction Ended";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `Ends in ${days}d ${hours}h`;
    return `Ends in ${hours}h`;
  };

  return (
    <div className="bg-background min-h-screen flex flex-col">
      <Navbar />

      <main className="max-w-[1300px] mx-auto px-4 py-8">
        <h1 className="text-3xl font-serif font-bold tracking-wide text-foreground mb-8">My Watchlist</h1>

        {loading ? (
          <div className="flex justify-center items-center h-64">
             <div className="animate-spin rounded-none h-12 w-12 border-2 border-gold border-t-transparent"></div>
          </div>
        ) : watchlist.length === 0 ? (
          <div className="bg-surface rounded-none p-12 text-center border border-border">
            <div className="max-w-md mx-auto">
               <div className="w-20 h-20 bg-background rounded-none flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
               </div>
               <h2 className="text-xl font-bold text-foreground mb-2">Your watchlist is empty</h2>
               <p className="text-muted mt-2 font-black uppercase text-[10px] tracking-widest leading-loose">The world's most advanced watch collector dashboard.</p>
               <p className="text-muted mb-8">Items you're interested in will appear here. Start browsing and click the heart icon to save items.</p>
               <Link href="/" className="bg-black text-white px-8 py-3 rounded-none font-bold hover:bg-gold hover:text-black transition">
                  Browse Marketplace
               </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {watchlist.map((item, idx) => (
              <div key={`${item.product_id}-${idx}`} className="bg-surface rounded-none border border-border overflow-hidden hover:shadow-none hover:border-gold/60 transition-colors group relative">
                <button 
                  onClick={() => removeFromWatchlist(item.product_id)}
                  className="absolute top-2 right-2 z-10 p-2 bg-surface rounded-none shadow-sm text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition"
                  title="Remove from watchlist"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>
                
                <Link href={`/products/${item.product_id}`}>
                  <div className="aspect-[4/3] bg-background flex items-center justify-center relative overflow-hidden">
                    <img
                      src={getThumbnail(item)}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                    {item.product_type === 'auction' && (
                      <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md text-white px-2 py-0.5 rounded-none text-[10px] font-bold uppercase tracking-wider">
                        Auction
                      </div>
                    )}
                  </div>
                </Link>

                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <Link href={`/products/${item.product_id}`} className="flex-grow">
                      <h3 className="font-bold text-foreground line-clamp-2 hover:text-gold leading-tight">
                        {item.title}
                      </h3>
                    </Link>
                  </div>
                  
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-lg font-black text-foreground">₹{item.price.toLocaleString()}</span>
                  </div>

                  <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                     <span className="text-[10px] text-muted font-bold uppercase tracking-wider">
                        {item.product_type === 'auction' ? formatTimeLeft(item.auction_end) : "Fixed Price"}
                     </span>
                     <Link href={`/products/${item.product_id}`} className="text-xs font-bold text-gold hover:text-gold/80 transition-colors">
                        View Item
                     </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
