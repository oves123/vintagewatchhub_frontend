"use client";
import { useState } from "react";
import { Search, Eye, CheckCircle2, XCircle, RefreshCw, MessageSquare, Send } from "lucide-react";

export default function ProductTab({ products, tabLoading, API_BASE_URL, API_URL, updateProductStatus, deleteProduct, showToast, getHeaders }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [notifyMsg, setNotifyMsg] = useState("");
  const [sending, setSending] = useState(false);

  const getImg = (p) => {
    if (!p) return "https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?q=80&w=400&auto=format&fit=crop";
    if (p.image) return `${API_BASE_URL}/uploads/${p.image}`;
    try {
      const imgs = Array.isArray(p.images) ? p.images : JSON.parse(p.images || "[]");
      const firstImg = imgs.find(f => !isVideo(f)) || imgs[0];
      if (firstImg) return `${API_BASE_URL}/uploads/${firstImg}`;
    } catch {}
    return "https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?q=80&w=400&auto=format&fit=crop";
  };

  const isVideo = (filename) => {
    if (typeof filename !== 'string') return false;
    const ext = filename.split('.').pop().toLowerCase();
    return ['mp4', 'mov', 'avi', 'webm', 'mkv'].includes(ext);
  };

  const getMediaList = (p) => {
    if (!p) return [];
    try {
      return Array.isArray(p.images) ? p.images : JSON.parse(p.images || "[]");
    } catch { return []; }
  };

  const filtered = products.filter(p => {
    const q = search.toLowerCase();
    const match = p.title?.toLowerCase().includes(q) || p.seller_name?.toLowerCase().includes(q);
    if (!match) return false;
    if (filter !== "all") return p.status === filter;
    return true;
  });

  const sendNotification = async () => {
    if (!notifyMsg.trim() || !selectedProduct) return;
    setSending(true);
    try {
      const res = await fetch(`${API_URL}/admin/notify-seller`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ product_id: selectedProduct.id, seller_id: selectedProduct.seller_id, message: notifyMsg })
      });
      if (!res.ok) throw new Error("Failed to send");
      showToast("Message sent to seller successfully");
      setNotifyMsg("");
    } catch { showToast("Failed to send message", "error"); }
    finally { setSending(false); }
  };

  const statusColor = (s) => s === "approved" ? "bg-emerald-50 text-emerald-700" : s === "pending" ? "bg-amber-50 text-amber-700" : "bg-rose-50 text-rose-700";

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search listings by title or seller..."
            className="w-full pl-9 pr-4 py-3 bg-gray-50 rounded-xl text-[13px] font-semibold outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:bg-white transition-all placeholder:text-gray-400"/>
        </div>
        <div className="flex gap-1 bg-gray-50 p-1 rounded-xl">
          {["all","pending","approved","rejected"].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${filter === f ? "bg-white text-[#1e3a5f] shadow" : "text-gray-400 hover:text-gray-600"}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Pending banner */}
      {products.filter(p => p.status === "pending").length > 0 && filter === "all" && (
        <div className="flex items-center gap-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl px-6 py-4">
          <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"/>
          <p className="text-[12px] font-black">
            {products.filter(p => p.status === "pending").length} listings pending your review — approve or reject below
          </p>
          <button onClick={() => setFilter("pending")} className="ml-auto text-[10px] font-black underline whitespace-nowrap">Show Pending</button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {tabLoading ? (
          <div className="flex items-center justify-center py-20"><RefreshCw className="animate-spin text-[#1e3a5f]" size={24}/></div>
        ) : (
          <div className="">
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    {["Product","Seller","Category","Type","Price","Shipping","Views","Status","Actions"].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-[9px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 && (
                    <tr><td colSpan={8} className="text-center py-16 text-[11px] text-gray-300 font-bold uppercase tracking-widest">No listings found</td></tr>
                  )}
                  {filtered.map(p => (
                    <tr key={p.id} className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${p.status === "pending" ? "border-l-4 border-l-amber-400" : ""}`}>
                      <td className="px-4 py-4">
                        <button onClick={() => setSelectedProduct(p)} className="flex items-center gap-3 text-left group">
                          <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden flex-shrink-0 relative">
                            <img src={getImg(p)} className="w-full h-full object-contain group-hover:scale-105 transition-transform" alt={p.title}/>
                            {getMediaList(p).some(m => isVideo(m)) && (
                              <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                <div className="w-5 h-5 rounded-full bg-white/90 flex items-center justify-center shadow-sm">
                                  <div className="w-0 h-0 border-t-[4px] border-t-transparent border-l-[6px] border-l-[#1e3a5f] border-b-[4px] border-b-transparent ml-0.5" />
                                </div>
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-[12px] font-black text-gray-900 group-hover:text-[#1e3a5f] transition-colors max-w-[160px] truncate">{p.title}</p>
                            <p className="text-[9px] text-gray-400 font-bold mt-0.5">{new Date(p.created_at).toLocaleDateString()}</p>
                          </div>
                        </button>
                      </td>
                      <td className="px-4 py-4 text-[11px] font-bold text-gray-600">{p.seller_name || "—"}</td>
                      <td className="px-4 py-4"><span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-lg text-[9px] font-black uppercase">{p.category_name || "General"}</span></td>
                      <td className="px-4 py-4"><span className="px-2 py-1 bg-blue-50 text-[#1e3a5f] rounded-lg text-[9px] font-black uppercase">{p.product_type || "fixed"}</span></td>
                      <td className="px-4 py-4 text-[12px] font-black text-gray-900">₹{parseFloat(p.price||0).toLocaleString()}</td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-gray-900">
                             {p.shipping_type === 'free' ? 'FREE' : p.shipping_type === 'contact' ? 'TBD' : `₹${parseFloat(p.shipping_fee||0).toLocaleString()}`}
                          </span>
                          <span className="text-[8px] font-bold text-gray-400 uppercase">{p.shipping_type}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-[11px] font-bold text-gray-500">{p.views || 0}</td>
                      <td className="px-4 py-4"><span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase ${statusColor(p.status)}`}>{p.status}</span></td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => setSelectedProduct(p)} className="p-2 bg-gray-50 hover:bg-[#1e3a5f] hover:text-white text-gray-500 rounded-lg transition-all" title="Details"><Eye size={13}/></button>
                          {p.status !== "approved" && (
                            <button onClick={() => updateProductStatus(p.id,"approved")} className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-all" title="Approve"><CheckCircle2 size={13}/></button>
                          )}
                          <button onClick={() => {
                            const reason = window.prompt("Enter rejection reason:", notifyMsg);
                            if (reason !== null) updateProductStatus(p.id, "rejected", reason);
                          }} className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg transition-all" title="Reject"><XCircle size={13}/></button>
                          <button onClick={() => { if(confirm("Delete this product?")) deleteProduct(p.id); }} className="p-2 bg-gray-50 hover:bg-rose-50 hover:text-rose-600 text-gray-400 rounded-lg transition-all" title="Delete">
                            <span className="text-[11px] font-black">✕</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-gray-100">
               {filtered.length === 0 && (
                <div className="text-center py-16 text-[11px] text-gray-300 font-bold uppercase tracking-widest">No listings found</div>
              )}
              {filtered.map(p => (
                <div key={p.id} className={`p-4 space-y-4 ${p.status === "pending" ? "bg-amber-50/30" : ""}`}>
                  <div className="flex gap-4">
                    <button onClick={() => setSelectedProduct(p)} className="w-16 h-16 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden flex-shrink-0">
                      <img src={getImg(p)} className="w-full h-full object-contain" alt={p.title}/>
                    </button>
                    <div className="flex-grow min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="text-[13px] font-black text-gray-900 truncate pr-2">{p.title}</h4>
                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase whitespace-nowrap ${statusColor(p.status)}`}>{p.status}</span>
                      </div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{p.seller_name || "—"} · {p.category_name || "General"}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-sm font-black text-[#1e3a5f]">₹{parseFloat(p.price||0).toLocaleString()}</p>
                        <span className="text-[9px] font-bold text-gray-400 uppercase">
                           + {p.shipping_type === 'free' ? 'Free' : p.shipping_type === 'contact' ? 'TBD' : `₹${parseFloat(p.shipping_fee||0).toLocaleString()}`} Ship
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-4 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                      <span>{p.views || 0} Views</span>
                      <span>{new Date(p.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => setSelectedProduct(p)} className="p-2.5 bg-gray-50 text-gray-500 rounded-xl">
                        <Eye size={16}/>
                      </button>
                      {p.status !== "approved" && (
                        <button onClick={() => updateProductStatus(p.id,"approved")} className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                          <CheckCircle2 size={16}/>
                        </button>
                      )}
                      <button onClick={() => {
                        const reason = window.prompt("Enter rejection reason:");
                        if (reason !== null) updateProductStatus(p.id, "rejected", reason);
                      }} className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
                        <XCircle size={16}/>
                      </button>
                      <button onClick={() => { if(confirm("Delete this product?")) deleteProduct(p.id); }} className="p-2.5 bg-gray-50 text-gray-400 rounded-xl">
                        <span className="text-[11px] font-black">✕</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        )}
      </div>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-8">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setSelectedProduct(null); setSelectedMedia(null); }}/>
          <div className="bg-white w-full max-w-5xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden relative z-10 flex flex-col md:flex-row">
            {/* Image/Media side */}
            <div className="w-full md:w-[380px] bg-gray-50 p-6 flex flex-col items-center border-r border-gray-100 flex-shrink-0 overflow-y-auto">
              <div className="w-full aspect-[4/5] rounded-2xl bg-white border border-gray-100 overflow-hidden shadow-sm mb-4 relative group">
                {isVideo(selectedMedia || getMediaList(selectedProduct)[0]) ? (
                  <video 
                    key={selectedMedia || getMediaList(selectedProduct)[0]}
                    controls 
                    className="w-full h-full object-contain bg-black"
                  >
                    <source src={`${API_BASE_URL}/uploads/${selectedMedia || getMediaList(selectedProduct)[0]}`} />
                  </video>
                ) : (
                  <img 
                    src={selectedMedia ? `${API_BASE_URL}/uploads/${selectedMedia}` : getImg(selectedProduct)} 
                    className="w-full h-full object-contain" 
                    alt={selectedProduct.title}
                  />
                )}
                
                {/* Media Label Overlay */}
                <div className="absolute top-3 left-3 px-2 py-1 bg-black/60 backdrop-blur-md rounded-lg text-[8px] font-black text-white uppercase tracking-widest">
                  {isVideo(selectedMedia || getMediaList(selectedProduct)[0]) ? 'VIDEO' : 'IMAGE'}
                </div>
              </div>

              {/* Media Gallery Thumbnails */}
              <div className="grid grid-cols-4 gap-2 w-full mb-6">
                {getMediaList(selectedProduct).map((m, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => setSelectedMedia(m)}
                    className={`aspect-square rounded-lg border-2 overflow-hidden bg-white transition-all relative ${
                      (selectedMedia === m || (!selectedMedia && idx === 0)) 
                      ? "border-[#1e3a5f] scale-95 shadow-inner" 
                      : "border-transparent hover:border-gray-200 grayscale-[0.5] hover:grayscale-0"
                    }`}
                  >
                    {isVideo(m) ? (
                      <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                        <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                           <div className="w-0 h-0 border-t-[4px] border-t-transparent border-l-[6px] border-l-white border-b-[4px] border-b-transparent ml-0.5" />
                        </div>
                      </div>
                    ) : (
                      <img src={`${API_BASE_URL}/uploads/${m}`} className="w-full h-full object-cover" />
                    )}
                  </button>
                ))}
              </div>

              <span className={`w-full text-center py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${statusColor(selectedProduct.status)}`}>{selectedProduct.status}</span>
              <p className="text-2xl font-black text-gray-900 mt-3">₹{parseFloat(selectedProduct.price||0).toLocaleString()}</p>
              <div className="mt-4 w-full space-y-2">
                {[
                  ["Seller", selectedProduct.seller_name || "—"],
                  ["Category", selectedProduct.category_name || "—"],
                  ["Type", selectedProduct.product_type || "fixed"],
                  ["Views", selectedProduct.views || 0],
                  ["Condition", selectedProduct.condition_code || "—"],
                  ["Shipping Fee", selectedProduct.shipping_type === 'free' ? "Free" : selectedProduct.shipping_type === 'contact' ? "TBD" : `₹${parseFloat(selectedProduct.shipping_fee||0).toLocaleString()}`],
                  ["Shipping Type", selectedProduct.shipping_type || "fixed"],
                  ["Offers Allowed", selectedProduct.allow_offers ? "Yes" : "No"],
                ].map(([k,v]) => (
                  <div key={k} className="flex justify-between bg-white rounded-xl px-3 py-2 border border-gray-100">
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{k}</span>
                    <span className="text-[10px] font-black text-gray-900">{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Content side */}
            <div className="flex-grow p-8 overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black text-gray-900 pr-4">{selectedProduct.title}</h2>
                <button onClick={() => setSelectedProduct(null)} className="p-2 bg-gray-50 hover:bg-gray-100 rounded-xl flex-shrink-0"><XCircle size={20} className="text-gray-400"/></button>
              </div>

              {selectedProduct.description && (
                <div className="mb-6 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Description</p>
                  <p className="text-[13px] text-gray-600 font-medium leading-relaxed">{selectedProduct.description}</p>
                </div>
              )}

              {/* Item Specifics */}
              {selectedProduct.item_specifics && Object.keys(selectedProduct.item_specifics).length > 0 && (
                <div className="mb-6">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Item Specifics</p>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(selectedProduct.item_specifics).filter(([k]) => !k.endsWith("_mode")).map(([k,v]) => (
                      <div key={k} className="flex justify-between bg-gray-50 rounded-xl px-3 py-2 border border-gray-100">
                        <span className="text-[9px] font-bold text-gray-400 uppercase">{k.replace(/_/g," ")}</span>
                        <span className="text-[10px] font-black text-gray-900">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Condition Details */}
              {selectedProduct.condition_details && Object.keys(selectedProduct.condition_details).length > 0 && (
                <div className="mb-6">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Condition Details</p>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(selectedProduct.condition_details).filter(([k]) => !k.endsWith("_mode")).map(([k,v]) => (
                      <div key={k} className="flex justify-between bg-gray-50 rounded-xl px-3 py-2 border border-gray-100">
                        <span className="text-[9px] font-bold text-gray-400 uppercase">{k.replace(/_/g," ")}</span>
                        <span className="text-[10px] font-black text-gray-900">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Approve/Reject Actions */}
              <div className="flex gap-3 mb-6">
                {selectedProduct.status !== "approved" && (
                  <button onClick={() => { updateProductStatus(selectedProduct.id,"approved"); setSelectedProduct(null); }}
                    className="flex-1 py-3 bg-emerald-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all">
                    ✓ Approve Listing
                  </button>
                )}
                <button onClick={() => {
                  const reason = window.prompt("Enter rejection reason:", notifyMsg);
                  if (reason !== null) {
                    updateProductStatus(selectedProduct.id, "rejected", reason);
                    setSelectedProduct(null);
                  }
                }}
                  className="flex-1 py-3 bg-rose-50 text-rose-600 border border-rose-100 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-rose-100 transition-all">
                  ✕ Reject Listing
                </button>
              </div>

              {/* Notify Seller */}
              <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100">
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquare size={14} className="text-[#1e3a5f]"/>
                  <p className="text-[11px] font-black text-[#1e3a5f] uppercase tracking-widest">Message Seller</p>
                </div>
                <p className="text-[10px] text-gray-500 font-medium mb-3">
                  Send a message to <strong>{selectedProduct.seller_name}</strong> about this listing — they&apos;ll receive it in their Messages inbox.
                </p>
                <div className="flex gap-2">
                  <textarea
                    value={notifyMsg}
                    onChange={e => setNotifyMsg(e.target.value)}
                    placeholder="e.g. Your listing was rejected because the images are unclear. Please re-upload with better quality photos."
                    rows={3}
                    className="flex-1 p-3 bg-white rounded-xl border border-blue-200 text-[12px] font-medium outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 resize-none placeholder:text-gray-300"
                  />
                  <button onClick={sendNotification} disabled={sending || !notifyMsg.trim()}
                    className="flex-shrink-0 w-12 flex items-center justify-center bg-[#1e3a5f] text-white rounded-xl hover:bg-[#2e538a] transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                    {sending ? <RefreshCw size={16} className="animate-spin"/> : <Send size={16}/>}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
