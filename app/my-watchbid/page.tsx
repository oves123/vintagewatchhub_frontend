"use client";

import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import Link from "next/link";
import { API_URL, API_BASE_URL, getMyListings, deleteProduct, extractList } from "../../services/api";
import ConfirmDialog from "../../components/ConfirmDialog";
import EmptyState from "../../components/EmptyState";

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("watchlist");
  const [watchlist, setWatchlist] = useState([]);
  const [orders, setOrders] = useState([]);
  const [myListings, setMyListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);

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
      
      setWatchlist(Array.isArray(watchlistRes) ? watchlistRes : extractList(watchlistRes));
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
    setConfirmDialog({
      title: "Delete listing?",
      message: "Are you sure you want to delete this listing?",
      confirmText: "Delete",
      variant: "danger",
      onConfirm: async () => {
        try {
          const res = await deleteProduct(id);
          if (res.message) {
            alert("Listing deleted successfully");
            fetchData();
          }
        } catch (err) {
          alert("Error deleting listing");
        }
      }
    });
  };

  return (
    <div className="bg-background min-h-screen pb-20">
      <Navbar />

      <main className="max-w-[1300px] mx-auto px-4 py-12">
        <header className="mb-12">
           <h1 className="text-4xl font-black text-foreground uppercase tracking-tighter italic">Collector <span className="text-gold">HUB.</span></h1>
           <p className="text-muted mt-2 font-black uppercase text-xs tracking-widest leading-loose">The world's most advanced watch collector dashboard.</p>
        </header>

        {/* Tab Navigation */}
        <div className="flex bg-surface p-2 rounded-xl border border-border mb-10 overflow-x-auto no-scrollbar">
          {[
            { id: "watchlist", label: "Vault Watchlist", count: watchlist.length },
            { id: "purchases", label: "Acquisitions", count: orders.length },
            { id: "selling", label: "Selling Hub", count: myListings.length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-8 py-4 text-xs font-black uppercase tracking-widest rounded-lg transition-all flex items-center gap-3 whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-gold text-black"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`px-2 py-0.5 rounded-lg text-xs ${activeTab === tab.id ? "bg-surface text-gold" : "bg-background text-muted"}`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="bg-surface rounded-xl p-8 md:p-12 text-center border border-border shadow-sm flex flex-col items-center gap-6">
             <div className="animate-spin rounded-xl h-12 w-12 border-4 border-gold border-t-transparent"></div>
             <p className="text-xs font-black text-gold uppercase tracking-[0.5em]">Syncing Hub Data...</p>
          </div>
        ) : (
          <section className="bg-surface rounded-xl border border-border overflow-hidden">

            {activeTab === "watchlist" && (
              <div className="divide-y divide-gray-50">
                {watchlist.length === 0 ? (
                  <EmptyState title="Watchlist Empty" description="Vault watchlist currently vacant." actionLabel="Browse Watches" actionHref="/" />
                ) : (
                  watchlist.map((item) => (
                    <DashboardItem 
                      key={item.id}
                      title={item.title}
                      image={item.image}
                      price={item.price}
                      status="Monitoring"
                      id={item.product_id}
                      statusColor="text-gold"
                      label="Market Valuation"
                    />
                  ))
                )}
              </div>
            )}

            {activeTab === "purchases" && (
              <div className="divide-y divide-gray-50">
                {orders.length === 0 ? (
                  <EmptyState title="No Orders Yet" description="No acquisitions tracked in your history." actionLabel="Start Shopping" actionHref="/" />
                ) : (
                  orders.map((order) => (
                    <DashboardItem 
                      key={order.id}
                      title={`Batch Order #${order.id}`}
                      image={null}
                      price={order.total_amount}
                      status="Acquired"
                      id={null}
                      statusColor="text-gold"
                      label="Final Settlement"
                    />
                  ))
                )}
              </div>
            )}

            {activeTab === "selling" && (
               <div className="divide-y divide-gray-50">
                {myListings.length === 0 ? (
                  <EmptyState title="No Listings" description="Your Hub inventory is currently at zero." actionLabel="Sell a Watch" actionHref="/sell" />
                ) : (
                  myListings.map((p) => (
                    <DashboardItem 
                      key={p.id}
                      title={p.title}
                      image={p.images?.[0] || p.image}
                      price={p.price}
                      status={p.status || "Active"}
                      id={p.id}
                      statusColor={p.status === 'draft' ? "text-muted" : "text-emerald-500"}
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

      <ConfirmDialog
        isOpen={!!confirmDialog}
        onClose={() => setConfirmDialog(null)}
        onConfirm={confirmDialog?.onConfirm || (() => {})}
        title={confirmDialog?.title || "Confirm"}
        message={confirmDialog?.message || "Are you sure?"}
        confirmText={confirmDialog?.confirmText || "Delete"}
        cancelText="Cancel"
        variant={confirmDialog?.variant || "danger"}
      />
    </div>
  );
}

function DashboardItem({ title, image, price, status, id, statusColor, label, isSelling, onDelete }: any) {
  const imageUrl = image 
    ? (image.startsWith('http') ? image : `${API_BASE_URL}/uploads/${image}`)
    : "https://www.omegawatches.com/chronicle/img/template/mobile/1952/1952-the-first-model-in-the-omega-constellation-collection.jpg";
  
  return (
    <div className="p-8 flex items-center gap-10 hover:bg-background/50 transition-all border-b border-gray-50 last:border-0">
      <div className="w-24 h-24 md:w-32 md:h-32 bg-surface rounded-xl flex-shrink-0 flex items-center justify-center p-4 border border-border overflow-hidden">
        <img src={imageUrl} alt={title} className="w-full h-full object-contain mix-blend-multiply transition-transform hover:scale-110 duration-500" />
      </div>
      
      <div className="flex-grow flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="max-w-md">
          <p className={`text-xs font-black uppercase tracking-widest ${statusColor} mb-2`}>{status}</p>
          <h3 className="text-xl font-black text-foreground tracking-tighter leading-tight hover:text-gold transition-colors uppercase italic">
            {id ? <Link href={`/products/${id}`}>{title}</Link> : title}
          </h3>
          <p className="text-xs text-muted font-bold uppercase tracking-widest mt-2">{id ? `HUB-${id}` : "ORDER-BATCH"}</p>
        </div>
 
        <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-6">
          <div className="text-right">
            <p className="text-xs text-muted font-black uppercase tracking-[0.2em] mb-1">{label}</p>
            <p className="text-2xl font-black text-foreground tracking-tighter">₹{parseFloat(price).toLocaleString()}</p>
          </div>
          
          <div className="flex gap-2">
            {isSelling ? (
              <>
                 <Link href={`/sell?edit=${id}`} className="gold-sweep-outline px-6 py-2.5 font-black text-xs uppercase tracking-widest shadow-none">Edit Asset</Link>
                 <button onClick={onDelete} className="bg-surface border border-border text-rose-500 px-4 py-2.5 rounded-lg font-black text-xs uppercase tracking-widest hover:border-rose-200 transition">Purge</button>
              </>
            ) : (
              id && (
                <Link href={`/products/${id}`} className="gold-sweep px-8 py-3 font-black text-xs uppercase tracking-widest shadow-none">Enter Vault</Link>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
