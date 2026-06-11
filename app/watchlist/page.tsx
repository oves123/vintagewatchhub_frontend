"use client";

import { useEffect, useState } from "react";
import Breadcrumbs from "../../components/Breadcrumbs";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import Link from "next/link";
import { API_URL, API_BASE_URL, getFolders, createFolder, renameFolder, deleteFolder, extractList, getUserId, getHeaders } from "../../services/api";
import EmptyState from "../../components/EmptyState";
import OptimizedImage from "../../components/OptimizedImage";
import ConfirmDialog from "../../components/ConfirmDialog";

export default function WatchlistPage() {
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [showFolderForm, setShowFolderForm] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [editingFolder, setEditingFolder] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      const uid = getUserId(parsedUser);
      setUser(parsedUser);
      if (uid) {
        Promise.all([
          fetch(`${API_URL}/watchlist/${uid}?t=${Date.now()}`, { headers: getHeaders(), cache: 'no-store' }).then(r => r.json().then(d => extractList(d))),
          getFolders(uid)
        ]).then(([data, folderData]) => {
          setWatchlist(Array.isArray(data) ? data : []);
          setFolders(Array.isArray(folderData) ? folderData : []);
          setLoading(false);
        }).catch(() => setLoading(false));
      } else {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const handleCreateFolder = async () => {
    if (!folderName.trim() || !user) return;
    const uid = getUserId(user);
    if (!uid) return;
    const res = await createFolder({ user_id: uid, name: folderName.trim() });
    if (res.id) {
      setFolders(prev => [...prev, res]);
      setFolderName("");
      setShowFolderForm(false);
    }
  };

  const handleRenameFolder = async (id, name) => {
    const res = await renameFolder(id, name);
    if (res.id) setFolders(prev => prev.map(f => f.id === id ? res : f));
    setEditingFolder(null);
  };

  const handleDeleteFolder = async (id) => {
    setConfirmDialog({
      title: "Delete folder?",
      message: "Items will be kept in watchlist.",
      confirmText: "Delete",
      variant: "danger",
      onConfirm: async () => {
        await deleteFolder(id);
        setFolders(prev => prev.filter(f => f.id !== id));
        if (selectedFolder === id) setSelectedFolder(null);
      }
    });
  };

  const filteredWatchlist = selectedFolder
    ? watchlist.filter(item => item.folder_id === selectedFolder)
    : watchlist;

  const removeFromWatchlist = async (productId) => {
    setConfirmDialog({
      title: "Remove item?",
      message: "Are you sure you want to remove this item?",
      confirmText: "Remove",
      variant: "danger",
      onConfirm: async () => {
        const uid = getUserId(user);
        if (!uid) return;
        try {
          await fetch(`${API_URL}/watchlist/remove`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify({ user_id: uid, product_id: productId }),
          });
          setWatchlist(watchlist.filter((item) => item.product_id !== productId));
          window.dispatchEvent(new Event("watchlistUpdated"));
        } catch (err) {
          alert("Failed to remove item");
        }
      }
    });
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
        <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Watchlist' }]} />
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-serif font-bold tracking-wide text-foreground">My Watchlist</h1>
          <button onClick={() => setShowFolderForm(!showFolderForm)} className="text-sm font-bold text-primary uppercase tracking-widest border-b border-primary/20 hover:border-primary">
            {showFolderForm ? 'Cancel' : '+ New Folder'}
          </button>
        </div>

        {showFolderForm && (
          <div className="flex gap-3 mb-8 p-4 bg-surface border border-border">
            <input value={folderName} onChange={e => setFolderName(e.target.value)} placeholder="Folder name..." className="flex-1 px-4 py-2 bg-background border border-border text-sm font-bold outline-none" onKeyDown={e => e.key === 'Enter' && handleCreateFolder()} />
            <button onClick={handleCreateFolder} disabled={!folderName.trim()} className="px-6 py-2 bg-black text-white rounded-lg text-xs font-bold uppercase tracking-widest disabled:opacity-50">Create</button>
          </div>
        )}

        {folders.length > 0 && (
          <div className="flex gap-2 mb-8 flex-wrap">
            <button onClick={() => setSelectedFolder(null)} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${!selectedFolder ? 'bg-primary text-white' : 'bg-surface text-muted border border-border hover:bg-background'}`}>All Items ({watchlist.length})</button>
            {folders.map(f => (
              <div key={f.id} className="flex items-center gap-1">
                <button onClick={() => setSelectedFolder(f.id)} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${selectedFolder === f.id ? 'bg-primary text-white' : 'bg-surface text-muted border border-border hover:bg-background'}`}>{f.name}</button>
                {editingFolder === f.id ? (
                  <input defaultValue={f.name} onBlur={e => handleRenameFolder(f.id, e.target.value)} onKeyDown={e => e.key === 'Enter' && handleRenameFolder(f.id, e.target.value)} className="w-24 px-2 py-1 bg-background border border-border text-xs font-bold" autoFocus />
                ) : (
                  <button onClick={() => setEditingFolder(f.id)} className="text-xs text-muted hover:text-primary p-1">✎</button>
                )}
                <button onClick={() => handleDeleteFolder(f.id)} className="text-xs text-muted hover:text-red-500 p-1">✕</button>
              </div>
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-64">
             <div className="animate-spin rounded-lg h-12 w-12 border-2 border-gold border-t-transparent"></div>
          </div>
        ) : filteredWatchlist.length === 0 ? (
          <EmptyState
            icon={
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            }
            title={selectedFolder ? "This folder is empty" : "Your watchlist is empty"}
            description={selectedFolder ? "Add items to this folder from the watchlist page." : "Items you're interested in will appear here. Start browsing and click the heart icon to save items."}
            actionLabel="Browse Marketplace"
            actionHref="/"
          />
        ) : (
          <div>
            {selectedFolder && <p className="text-xs font-bold text-muted uppercase tracking-widest mb-4">{folders.find(f => f.id === selectedFolder)?.name} — {filteredWatchlist.length} items</p>}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {filteredWatchlist.map((item, idx) => (
              <div key={`${item.product_id}-${idx}`} className="bg-surface rounded-xl border border-border overflow-hidden hover:shadow-none hover:border-gold/60 transition-colors group relative">
                <button 
                  onClick={() => removeFromWatchlist(item.product_id)}
                  className="absolute top-2 right-2 z-10 p-2 bg-surface rounded-lg shadow-sm text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition"
                  title="Remove from watchlist"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>
                
                <Link href={`/products/${item.product_id}`}>
                  <div className="aspect-[4/3] bg-background flex items-center justify-center relative overflow-hidden">
                    <OptimizedImage
                      src={getThumbnail(item)}
                      alt={item.title}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                      size="small"
                    />
                    {item.product_type === 'auction' && (
                      <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md text-white px-2 py-0.5 rounded-lg text-xs font-bold uppercase tracking-wider">
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
                     <span className="text-xs text-muted font-bold uppercase tracking-wider">
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
          </div>
        )}
      </main>

      <Footer />

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
