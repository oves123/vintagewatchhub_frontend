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
    <div className="bg-[#fafafa] min-h-screen flex flex-col">
      <Navbar />

      <main className="max-w-[1300px] mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Watchlist</h1>

        {loading ? (
          <div className="flex justify-center items-center h-64">
             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : watchlist.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
            <div className="max-w-md mx-auto">
               <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
               </div>
               <h2 className="text-xl font-bold text-gray-900 mb-2">Your watchlist is empty</h2>
               <p className="text-gray-400 mt-2 font-black uppercase text-[10px] tracking-widest leading-loose">The world's most advanced watch collector dashboard.</p>
               <p className="text-gray-600 mb-8">Items you're interested in will appear here. Start browsing and click the heart icon to save items.</p>
               <Link href="/" className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700 transition">
                  Browse Marketplace
               </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {watchlist.map((item) => (
              <div key={item.product_id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow group relative">
                <button 
                  onClick={() => removeFromWatchlist(item.product_id)}
                  className="absolute top-2 right-2 z-10 p-2 bg-white rounded-full shadow-sm text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition"
                  title="Remove from watchlist"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>
                
                <Link href={`/products/${item.product_id}`}>
                  <div className="aspect-[4/3] bg-gray-50 flex items-center justify-center relative overflow-hidden">
                    <img
                      src={getThumbnail(item)}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                    {item.product_type === 'auction' && (
                      <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md text-white px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                        Auction
                      </div>
                    )}
                  </div>
                </Link>

                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <Link href={`/products/${item.product_id}`} className="flex-grow">
                      <h3 className="font-bold text-gray-900 line-clamp-2 hover:text-blue-600 leading-tight">
                        {item.title}
                      </h3>
                    </Link>
                  </div>
                  
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-lg font-black text-gray-900">₹{item.price.toLocaleString()}</span>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                     <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                        {item.product_type === 'auction' ? formatTimeLeft(item.auction_end) : "Fixed Price"}
                     </span>
                     <Link href={`/products/${item.product_id}`} className="text-xs font-bold text-blue-600 hover:underline">
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
