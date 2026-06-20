"use client";

import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import Link from "next/link";
import { API_URL, API_BASE_URL, getMyListings, deleteProduct, extractList, getUserOffers, respondToOffer } from "../../services/api";
import ConfirmDialog from "../../components/ConfirmDialog";
import EmptyState from "../../components/EmptyState";

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("watchlist");
  const [watchlist, setWatchlist] = useState([]);
  const [orders, setOrders] = useState([]);
  const [myListings, setMyListings] = useState([]);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [counterModal, setCounterModal] = useState({ isOpen: false, offer: null, amount: '' });

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
      const [watchlistRes, ordersRes, listingsRes, offersRes] = await Promise.all([
        fetch(`${API_URL}/watchlist/${user.id}`, { headers }).then(res => res.json()),
        fetch(`${API_URL}/orders/buyer/${user.id}`, { headers }).then(res => res.json()),
        getMyListings(user.id),
        getUserOffers(user.id)
      ]);
      
      setWatchlist(Array.isArray(watchlistRes) ? watchlistRes : extractList(watchlistRes));
      setOrders(Array.isArray(ordersRes) ? ordersRes : []);
      setMyListings(Array.isArray(listingsRes) ? listingsRes : []);
      setOffers(Array.isArray(offersRes) ? offersRes : []);
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

  const handleOfferAction = async (offer, action) => {
    if (action === 'accept') {
      if (confirm("Are you sure you want to accept this offer? This will lock the deal.")) {
        try {
          const res = await respondToOffer(offer.id, 'accepted');
          if (res.offer) {
            alert("Offer Accepted! The deal is now locked.");
            fetchData();
          } else {
            alert(res.message || "Failed to accept offer.");
          }
        } catch (e) {
          alert("Error accepting offer.");
        }
      }
    } else if (action === 'decline') {
      if (confirm("Are you sure you want to decline this offer?")) {
        try {
          const res = await respondToOffer(offer.id, 'rejected');
          if (res.offer) {
            alert("Offer Declined.");
            fetchData();
          }
        } catch (e) {
          alert("Error declining offer.");
        }
      }
    } else if (action === 'counter') {
      setCounterModal({ isOpen: true, offer, amount: '' });
    }
  };

  const submitCounterOffer = async () => {
    if (!counterModal.amount || isNaN(counterModal.amount) || Number(counterModal.amount) <= 0) {
      alert("Please enter a valid counter offer amount.");
      return;
    }
    try {
      const status = user.id === counterModal.offer.buyer_id ? 'buyer_countered' : 'countered';
      const res = await respondToOffer(counterModal.offer.id, status, counterModal.amount);
      if (res.offer) {
        alert("Counter offer sent!");
        setCounterModal({ isOpen: false, offer: null, amount: '' });
        fetchData();
      } else {
        alert(res.message || "Failed to send counter offer.");
      }
    } catch (e) {
      alert("Error sending counter offer.");
    }
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
            { id: "negotiations", label: "Offers & Negotiations", count: offers.filter(o => o.status === 'pending' || o.status === 'countered' || o.status === 'buyer_countered').length },
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

            {activeTab === "negotiations" && (
              <div className="divide-y divide-gray-50">
                {offers.length === 0 ? (
                  <EmptyState title="No Active Offers" description="You have no active negotiations." actionLabel="Browse Watches" actionHref="/" />
                ) : (
                  offers.map((offer) => (
                    <OfferItem 
                      key={offer.id}
                      offer={offer}
                      currentUser={user}
                      onAction={handleOfferAction}
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

      {/* Counter Offer Modal */}
      {counterModal.isOpen && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-300">
           <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setCounterModal({ isOpen: false, offer: null, amount: '' })} />
           <div className="relative w-full max-w-lg bg-surface rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="p-8 border-b border-border flex items-center justify-between">
                 <h3 className="text-2xl font-black text-foreground uppercase tracking-tight">Counter Offer</h3>
                 <button onClick={() => setCounterModal({ isOpen: false, offer: null, amount: '' })} className="w-10 h-10 rounded-full bg-background flex items-center justify-center text-muted hover:text-foreground transition-all">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                 </button>
              </div>
              <div className="p-8 space-y-6">
                 <div>
                    <label className="block text-[10px] font-black text-muted uppercase tracking-widest mb-2">Counter Amount (₹)</label>
                    <input 
                      type="number" 
                      value={counterModal.amount}
                      onChange={e => setCounterModal({ ...counterModal, amount: e.target.value })}
                      placeholder={`Previous offer: ₹${parseFloat(counterModal.offer?.counter_amount || counterModal.offer?.amount).toLocaleString()}`}
                      className="w-full px-5 py-4 bg-background border border-border rounded-none text-lg font-black outline-none focus:ring-2 focus:ring-amber-500/20 focus:bg-surface transition-all"
                    />
                 </div>
                 <button 
                   onClick={submitCounterOffer}
                   className="w-full py-5 bg-amber-600 text-white rounded-none font-black text-xs uppercase tracking-[0.2em] hover:bg-amber-700 transition-all shadow-xl shadow-amber-100"
                 >
                   Send Counter Offer
                 </button>
              </div>
           </div>
        </div>
      )}
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

function OfferItem({ offer, currentUser, onAction }: any) {
  const isSeller = currentUser.id === offer.seller_id;
  const isBuyer = currentUser.id === offer.buyer_id;
  
  const imageUrl = offer.images?.[0] 
    ? (offer.images[0].startsWith('http') ? offer.images[0] : `${API_BASE_URL}/uploads/${offer.images[0]}`)
    : "https://www.omegawatches.com/chronicle/img/template/mobile/1952/1952-the-first-model-in-the-omega-constellation-collection.jpg";

  // Determine whose turn it is to respond
  let canAction = false;
  if (offer.status === 'pending' && isSeller) canAction = true;
  if (offer.status === 'countered' && isBuyer) canAction = true;
  if (offer.status === 'buyer_countered' && isSeller) canAction = true;

  const currentAmount = offer.status === 'countered' || offer.status === 'buyer_countered' ? offer.counter_amount : offer.amount;

  return (
    <div className="p-8 flex flex-col lg:flex-row gap-6 hover:bg-background/50 transition-all border-b border-gray-50 last:border-0">
      <div className="w-24 h-24 md:w-32 md:h-32 bg-surface rounded-xl flex-shrink-0 flex items-center justify-center p-4 border border-border overflow-hidden">
        <img src={imageUrl} alt={offer.title} className="w-full h-full object-contain mix-blend-multiply" />
      </div>
      
      <div className="flex-grow flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="max-w-md">
          <p className={`text-xs font-black uppercase tracking-widest ${offer.status === 'accepted' ? 'text-emerald-500' : offer.status === 'rejected' ? 'text-rose-500' : 'text-amber-500'} mb-2`}>
            {offer.status.replace('_', ' ')}
          </p>
          <h3 className="text-xl font-black text-foreground tracking-tighter leading-tight uppercase italic mb-1">
            <Link href={`/products/${offer.product_id}`}>{offer.title}</Link>
          </h3>
          <p className="text-[10px] text-muted font-bold uppercase tracking-widest">
            {isSeller ? `Offer from: ${offer.buyer_name}` : `Offer to: ${offer.seller_name}`}
          </p>
        </div>
 
        <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-6">
          <div className="text-right">
            <p className="text-xs text-muted font-black uppercase tracking-[0.2em] mb-1">Offer Amount</p>
            <p className="text-2xl font-black text-foreground tracking-tighter">₹{parseFloat(currentAmount).toLocaleString()}</p>
            <p className="text-[9px] text-muted font-bold uppercase tracking-widest mt-1">Listed: ₹{parseFloat(offer.listed_price).toLocaleString()}</p>
          </div>
          
          <div className="flex flex-wrap gap-2 justify-end">
            {canAction && (
              <>
                 <button onClick={() => onAction(offer, 'accept')} className="bg-emerald-600 text-white px-5 py-2.5 font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 transition">Accept</button>
                 <button onClick={() => onAction(offer, 'counter')} className="bg-amber-600 text-white px-5 py-2.5 font-black text-[10px] uppercase tracking-widest shadow-lg shadow-amber-500/20 hover:bg-amber-700 transition">Counter</button>
                 <button onClick={() => onAction(offer, 'decline')} className="bg-surface border border-border text-rose-500 px-5 py-2.5 font-black text-[10px] uppercase tracking-widest hover:bg-rose-500/10 transition">Decline</button>
              </>
            )}
            {offer.status === 'accepted' && isBuyer && (
                 <Link href={`/products/${offer.product_id}/checkout?deal=${offer.deal_id}`} className="bg-black text-white px-6 py-2.5 font-black text-xs uppercase tracking-widest hover:bg-primary transition shadow-xl">Complete Payment</Link>
            )}
            {!canAction && offer.status !== 'accepted' && offer.status !== 'rejected' && (
              <span className="text-[10px] font-black text-muted uppercase tracking-widest px-4 py-2 bg-surface rounded-full border border-border">Waiting for Response</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
