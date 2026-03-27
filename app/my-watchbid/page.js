"use client";

import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import Link from "next/link";
import { API_URL, API_BASE_URL, getMyListings, deleteProduct } from "../../services/api";

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("watchlist");
  const [watchlist, setWatchlist] = useState([]);
  const [orders, setOrders] = useState([]);
  const [myListings, setMyListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      window.location.href = "/login";
      return;
    }
    setUser(JSON.parse(storedUser));
  }, []);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const headers = { "Authorization": `Bearer ${localStorage.getItem("token")}` };
      const [watchlistRes, ordersRes, listingsRes] = await Promise.all([
        fetch(`${API_URL}/watchlist/${user.id}`, { headers }).then(res => res.json()),
        fetch(`${API_URL}/orders/buyer/${user.id}`, { headers }).then(res => res.json()),
        getMyListings(user.id)
      ]);
      
      setWatchlist(Array.isArray(watchlistRes) ? watchlistRes : []);
      setOrders(Array.isArray(ordersRes) ? ordersRes : []);
      setMyListings(Array.isArray(listingsRes) ? listingsRes : []);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this listing?")) return;
    try {
      const res = await deleteProduct(id);
      if (res.message) {
        alert("Listing deleted successfully");
        fetchData();
      }
    } catch (err) {
      alert("Error deleting listing");
    }
  };

  return (
    <div className="bg-[#f7f7f7] min-h-screen pb-20">
      <Navbar />

      <main className="max-w-[1300px] mx-auto px-4 py-12">
        <header className="mb-12">
           <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tighter italic">Collector <span className="text-blue-600">HUB.</span></h1>
           <p className="text-gray-400 mt-2 font-black uppercase text-[10px] tracking-widest leading-loose">The world's most advanced watch collector dashboard.</p>
        </header>

        {/* Tab Navigation */}
        <div className="flex bg-white p-2 rounded-2xl shadow-sm border border-gray-100 mb-10 overflow-x-auto no-scrollbar">
          {[
            { id: "watchlist", label: "Vault Watchlist", count: watchlist.length },
            { id: "purchases", label: "Acquisitions", count: orders.length },
            { id: "selling", label: "Selling Hub", count: myListings.length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-8 py-4 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-3 whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-blue-600 text-white shadow-xl shadow-blue-100"
                  : "text-gray-400 hover:text-gray-900"
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`px-2 py-0.5 rounded-md text-[8px] ${activeTab === tab.id ? "bg-white text-blue-600" : "bg-gray-100 text-gray-400"}`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="bg-white rounded-[3rem] p-32 text-center border border-gray-100 shadow-sm flex flex-col items-center gap-6">
             <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent shadow-xl"></div>
             <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.5em]">Syncing Hub Data...</p>
          </div>
        ) : (
          <section className="bg-white rounded-[3rem] border border-gray-100 shadow-2xl shadow-gray-200/50 overflow-hidden">

            {activeTab === "watchlist" && (
              <div className="divide-y divide-gray-50">
                {watchlist.length === 0 ? (
                  <EmptyState message="Vault watchlist currently vacant." />
                ) : (
                  watchlist.map((item) => (
                    <DashboardItem 
                      key={item.id}
                      title={item.title}
                      image={item.image}
                      price={item.price}
                      status="Monitoring"
                      id={item.product_id}
                      statusColor="text-blue-500"
                      label="Market Valuation"
                    />
                  ))
                )}
              </div>
            )}

            {activeTab === "purchases" && (
              <div className="divide-y divide-gray-50">
                {orders.length === 0 ? (
                  <EmptyState message="No acquisitions tracked in your history." />
                ) : (
                  orders.map((order) => (
                    <DashboardItem 
                      key={order.id}
                      title={`Batch Order #${order.id}`}
                      image={null}
                      price={order.total_amount}
                      status="Acquired"
                      id={null}
                      statusColor="text-purple-500"
                      label="Final Settlement"
                    />
                  ))
                )}
              </div>
            )}

            {activeTab === "selling" && (
               <div className="divide-y divide-gray-50">
                {myListings.length === 0 ? (
                  <EmptyState message="Your Hub inventory is currently at zero." />
                ) : (
                  myListings.map((p) => (
                    <DashboardItem 
                      key={p.id}
                      title={p.title}
                      image={p.images?.[0] || p.image}
                      price={p.price}
                      status={p.status || "Active"}
                      id={p.id}
                      statusColor={p.status === 'draft' ? "text-gray-400" : "text-emerald-500"}
                      label="Current Price"
                      isSelling={true}
                      onDelete={() => handleDelete(p.id)}
                    />
                  ))
                )}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

function DashboardItem({ title, image, price, status, id, statusColor, label, isSelling, onDelete }) {
  const imageUrl = image 
    ? (image.startsWith('http') ? image : `${API_BASE_URL}/uploads/${image}`)
    : "https://www.omegawatches.com/chronicle/img/template/mobile/1952/1952-the-first-model-in-the-omega-constellation-collection.jpg";
  
  return (
    <div className="p-8 flex items-center gap-10 hover:bg-gray-50/50 transition-all border-b border-gray-50 last:border-0">
      <div className="w-24 h-24 md:w-32 md:h-32 bg-white rounded-[2rem] flex-shrink-0 flex items-center justify-center p-4 border border-gray-100 shadow-sm overflow-hidden">
        <img src={imageUrl} alt={title} className="w-full h-full object-contain mix-blend-multiply transition-transform hover:scale-110 duration-500" />
      </div>
      
      <div className="flex-grow flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="max-w-md">
          <p className={`text-[9px] font-black uppercase tracking-widest ${statusColor} mb-2`}>{status}</p>
          <h3 className="text-xl font-black text-gray-900 tracking-tighter leading-tight hover:text-blue-600 transition-colors uppercase italic">
            {id ? <Link href={`/products/${id}`}>{title}</Link> : title}
          </h3>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-2">{id ? `HUB-${id}` : "ORDER-BATCH"}</p>
        </div>

        <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-6">
          <div className="text-right">
            <p className="text-[9px] text-gray-400 font-black uppercase tracking-[0.2em] mb-1">{label}</p>
            <p className="text-2xl font-black text-gray-900 tracking-tighter">₹{parseFloat(price).toLocaleString()}</p>
          </div>
          
          <div className="flex gap-2">
            {isSelling ? (
              <>
                 <Link href={`/sell?edit=${id}`} className="bg-gray-900 text-white px-6 py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-blue-600 transition shadow-lg shadow-gray-200">Edit Asset</Link>
                 <button onClick={onDelete} className="bg-white border-2 border-gray-100 text-rose-500 px-4 py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest hover:border-rose-200 transition">Purge</button>
              </>
            ) : (
              id && (
                <Link href={`/products/${id}`} className="bg-gray-900 text-white px-8 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-blue-600 transition shadow-xl shadow-gray-200">Enter Vault</Link>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div className="p-32 text-center space-y-6">
      <div className="w-20 h-20 bg-gray-50 border border-gray-100 rounded-[2rem] flex items-center justify-center mx-auto shadow-inner grayscale opacity-30">🧊</div>
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{message}</p>
      <Link href="/" className="inline-block bg-blue-600 text-white px-8 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-blue-700 transition shadow-xl shadow-blue-50">Start Exploration</Link>
    </div>
  );
}
