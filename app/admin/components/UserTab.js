"use client";
import { useState } from "react";
import { Search, Eye, CheckCircle2, XCircle, RefreshCw, Package, ShoppingCart, TrendingUp, ShieldCheck, Printer } from "lucide-react";

export default function UserTab({ users, tabLoading, API_BASE_URL, toggleUserStatus, deleteUser, showToast, getHeaders, API_URL }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const getImg = (p) => {
    if (p?.image) return p.image.startsWith('http') ? p.image : `${API_BASE_URL}/uploads/${p.image}`;
    try {
      const imgs = Array.isArray(p?.images) ? p.images : JSON.parse(p?.images || "[]");
      if (imgs[0]) return imgs[0].startsWith('http') ? imgs[0] : `${API_BASE_URL}/uploads/${imgs[0]}`;
    } catch {}
    return "https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?q=80&w=400&auto=format&fit=crop";
  };

  const fetchDetails = async (u) => {
    setSelectedUser(u);
    setUserDetails(null);
    setLoadingDetail(true);
    try {
      const res = await fetch(`${API_URL}/admin/users/${u.id}`, { headers: getHeaders() });
      const d = await res.json();
      setUserDetails(d);
    } catch { showToast("Failed to load user details", "error"); }
    finally { setLoadingDetail(false); }
  };

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const match = u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
    if (!match) return false;
    if (filter === "active") return u.is_active !== false;
    if (filter === "suspended") return u.is_active === false;
    if (filter === "admin") return u.role === "admin";
    if (filter === "verified") return u.is_verified;
    return true;
  });

  const closeModal = () => { setSelectedUser(null); setUserDetails(null); };

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users by name or email..."
            className="w-full pl-9 pr-4 py-3 bg-gray-50 rounded-xl text-[13px] font-semibold outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:bg-white transition-all placeholder:text-gray-400"/>
        </div>
        <div className="flex gap-1 bg-gray-50 p-1 rounded-xl flex-shrink-0">
          {["all","active","suspended","admin","verified"].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${filter === f ? "bg-white text-[#1e3a5f] shadow" : "text-gray-400 hover:text-gray-600"}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {tabLoading ? (
          <div className="flex items-center justify-center py-20"><RefreshCw className="animate-spin text-[#1e3a5f]" size={24}/></div>
        ) : (
          <div className="">
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    {["User","Email","Role","Phone","Verified","Listed","Bought","Joined","Status","Actions"].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-[9px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 && (
                    <tr><td colSpan={10} className="text-center py-16 text-[11px] text-gray-300 font-bold uppercase tracking-widest">No users found</td></tr>
                  )}
                  {filtered.map(u => (
                    <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors group">
                      <td className="px-4 py-4">
                        <button onClick={() => fetchDetails(u)} className="flex items-center gap-3 text-left">
                          <div className="w-9 h-9 rounded-xl bg-[#1e3a5f] text-white font-black text-sm flex items-center justify-center flex-shrink-0">
                            {u.name?.[0]?.toUpperCase()}
                          </div>
                          <div>
                            <p className="text-[12px] font-black text-gray-900 group-hover:text-[#1e3a5f] transition-colors">{u.name}</p>
                            <p className="text-[9px] text-gray-400 font-bold">UID-{String(u.id).padStart(4,"0")}</p>
                          </div>
                        </button>
                      </td>
                      <td className="px-4 py-4 text-[11px] text-gray-600 font-medium">{u.email}</td>
                      <td className="px-4 py-4">
                        <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase ${u.role === "admin" ? "bg-purple-50 text-purple-700" : "bg-blue-50 text-[#1e3a5f]"}`}>{u.role || "user"}</span>
                      </td>
                      <td className="px-4 py-4 text-[11px] text-gray-500 font-medium">{u.phone || "—"}</td>
                      <td className="px-4 py-4 text-center">
                        <CheckCircle2 size={15} className={u.is_verified ? "text-emerald-500 mx-auto" : "text-gray-200 mx-auto"}/>
                      </td>
                      <td className="px-4 py-4 text-[12px] font-black text-gray-900 text-center">{u.items_listed || 0}</td>
                      <td className="px-4 py-4 text-[12px] font-black text-gray-900 text-center">{u.items_bought || 0}</td>
                      <td className="px-4 py-4 text-[10px] text-gray-400 font-medium whitespace-nowrap">
                        {u.joined_date ? new Date(u.joined_date).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase ${u.is_active !== false ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                          {u.is_active !== false ? "Active" : "Suspended"}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <button onClick={() => fetchDetails(u)} className="p-2 bg-gray-50 hover:bg-[#1e3a5f] hover:text-white text-gray-500 rounded-lg transition-all" title="View Profile">
                            <Eye size={14}/>
                          </button>
                          <button onClick={() => toggleUserStatus(u.id, u.is_active !== false)}
                            className={`p-2 rounded-lg transition-all ${u.is_active !== false ? "bg-rose-50 text-rose-600 hover:bg-rose-100" : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"}`}
                            title={u.is_active !== false ? "Suspend" : "Activate"}>
                            {u.is_active !== false ? <XCircle size={14}/> : <CheckCircle2 size={14}/>}
                          </button>
                          <button onClick={() => { if(confirm(`Delete user ${u.name}?`)) deleteUser(u.id); }}
                            className="p-2 bg-gray-50 hover:bg-rose-50 hover:text-rose-600 text-gray-400 rounded-lg transition-all" title="Delete">
                            <span className="text-[11px] font-black">✕</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-gray-100">
              {filtered.length === 0 && (
                <div className="text-center py-16 text-[11px] text-gray-300 font-bold uppercase tracking-widest">No users found</div>
              )}
              {filtered.map(u => (
                <div key={u.id} className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <button onClick={() => fetchDetails(u)} className="flex items-center gap-3 text-left">
                      <div className="w-10 h-10 rounded-xl bg-[#1e3a5f] text-white font-black text-sm flex items-center justify-center">
                        {u.name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="text-[13px] font-black text-gray-900">{u.name}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">UID-{String(u.id).padStart(4,"0")}</p>
                      </div>
                    </button>
                    <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase ${u.is_active !== false ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                      {u.is_active !== false ? "Active" : "Suspended"}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 p-2 rounded-lg">
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Role</p>
                      <p className="text-[10px] font-bold text-gray-700 uppercase">{u.role || "user"}</p>
                    </div>
                    <div className="bg-gray-50 p-2 rounded-lg">
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Verified</p>
                      <CheckCircle2 size={12} className={u.is_verified ? "text-emerald-500" : "text-gray-200"}/>
                    </div>
                    <div className="bg-gray-50 p-2 rounded-lg">
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Listed</p>
                      <p className="text-[12px] font-black text-gray-900">{u.items_listed || 0}</p>
                    </div>
                    <div className="bg-gray-50 p-2 rounded-lg">
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Bought</p>
                      <p className="text-[12px] font-black text-gray-900">{u.items_bought || 0}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <p className="text-[10px] text-gray-400 font-bold uppercase">{u.email}</p>
                    <div className="flex items-center gap-2">
                      <button onClick={() => fetchDetails(u)} className="p-2.5 bg-gray-50 text-gray-500 rounded-xl">
                        <Eye size={16}/>
                      </button>
                      <button onClick={() => toggleUserStatus(u.id, u.is_active !== false)}
                        className={`p-2.5 rounded-xl ${u.is_active !== false ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"}`}>
                        {u.is_active !== false ? <XCircle size={16}/> : <CheckCircle2 size={16}/>}
                      </button>
                      <button onClick={() => { if(confirm(`Delete user ${u.name}?`)) deleteUser(u.id); }}
                        className="p-2.5 bg-gray-50 text-gray-400 rounded-xl">
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

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-8">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal}/>
          <div className="bg-white w-full max-w-5xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden relative z-10 flex flex-col md:flex-row">
            {/* Left */}
            <div className="w-full md:w-72 bg-gray-50 border-r border-gray-100 p-8 flex flex-col items-center flex-shrink-0">
              <div className="w-24 h-24 bg-[#1e3a5f] rounded-2xl flex items-center justify-center text-4xl font-black text-white mb-5 uppercase">
                {selectedUser.name?.[0]}
              </div>
              <h2 className="text-xl font-black text-gray-900 text-center">{selectedUser.name}</h2>
              <p className="text-[10px] font-bold text-gray-400 mt-1 text-center">{selectedUser.email}</p>
              <div className="mt-6 w-full space-y-2">
                {[
                  ["Role", selectedUser.role || "user"],
                  ["Phone", selectedUser.phone || "—"],
                  ["City", selectedUser.city || "—"],
                  ["State", selectedUser.state || "—"],
                  ["Pincode", selectedUser.pincode || "—"],
                  ["Verified", selectedUser.is_verified ? "Yes" : "No"],
                  ["Joined", selectedUser.joined_date ? new Date(selectedUser.joined_date).toLocaleDateString() : "—"],
                  ["Status", selectedUser.is_active !== false ? "Active" : "Suspended"],
                ].map(([k,v]) => (
                  <div key={k} className="flex items-center justify-between bg-white rounded-xl px-3 py-2 border border-gray-100">
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{k}</span>
                    <span className="text-[10px] font-black text-gray-900 uppercase">{v}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => { toggleUserStatus(selectedUser.id, selectedUser.is_active !== false); closeModal(); }}
                className={`mt-6 w-full py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${selectedUser.is_active !== false ? "bg-rose-50 text-rose-600 border border-rose-100" : "bg-emerald-600 text-white"}`}>
                {selectedUser.is_active !== false ? "Suspend User" : "Activate User"}
              </button>
            </div>

            {/* Right */}
            <div className="flex-grow p-8 overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest">User Intelligence Report</h3>
                <div className="flex gap-2">
                  <button onClick={() => window.print()} title="Print" className="p-2 bg-gray-50 hover:bg-[#1e3a5f] hover:text-white text-gray-500 rounded-lg transition-all"><Printer size={16}/></button>
                  <button onClick={closeModal} className="p-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-all"><XCircle size={18} className="text-gray-400"/></button>
                </div>
              </div>

              {loadingDetail && <div className="flex justify-center py-12"><RefreshCw className="animate-spin text-[#1e3a5f]" size={24}/></div>}

              {!loadingDetail && userDetails && (
                <div className="space-y-6">
                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-[#1e3a5f] rounded-2xl p-4 text-white text-center">
                      <p className="text-2xl font-black">{userDetails.products?.length || 0}</p>
                      <p className="text-[9px] font-bold text-blue-300 uppercase tracking-widest mt-1">Listings</p>
                    </div>
                    <div className="bg-amber-50 rounded-2xl p-4 text-center border border-amber-100">
                      <p className="text-2xl font-black text-gray-900">{userDetails.buyOrders?.length || 0}</p>
                      <p className="text-[9px] font-bold text-amber-600 uppercase tracking-widest mt-1">Purchases</p>
                    </div>
                    <div className="bg-emerald-50 rounded-2xl p-4 text-center border border-emerald-100">
                      <p className="text-2xl font-black text-gray-900">{userDetails.sellOrders?.length || 0}</p>
                      <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest mt-1">Sales</p>
                    </div>
                  </div>

                  {/* Listings */}
                  <div>
                    <h4 className="text-[11px] font-black text-gray-900 uppercase tracking-widest mb-3 flex items-center gap-2"><Package size={13}/> Their Listings</h4>
                    <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                      {(!userDetails.products || userDetails.products.length === 0) && <p className="text-[10px] text-gray-300 text-center py-4 font-bold">No listings</p>}
                      {userDetails.products?.map(p => (
                        <div key={p.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                          <div className="w-10 h-10 bg-white rounded-xl border border-gray-200 overflow-hidden flex-shrink-0">
                            <img src={getImg(p)} className="w-full h-full object-contain" alt={p.title}/>
                          </div>
                          <div className="flex-grow min-w-0">
                            <p className="text-[11px] font-black text-gray-900 truncate">{p.title}</p>
                            <p className="text-[9px] text-gray-400 font-bold mt-0.5">₹{parseFloat(p.price||0).toLocaleString()}</p>
                          </div>
                          <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase ${p.status === "approved" ? "bg-emerald-50 text-emerald-600" : p.status === "pending" ? "bg-amber-50 text-amber-600" : "bg-rose-50 text-rose-600"}`}>{p.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Payment Information */}
                  <div>
                    <h4 className="text-[11px] font-black text-gray-900 uppercase tracking-widest mb-3 flex items-center gap-2 text-blue-600"><ShieldCheck size={13}/> Financial Identity</h4>
                    <div className="bg-blue-50/30 rounded-2xl border border-blue-100/50 p-5">
                       {(() => {
                         const pm = typeof userDetails.user?.payment_methods === 'string' ? JSON.parse(userDetails.user?.payment_methods || "{}") : (userDetails.user?.payment_methods || {});
                         const hasData = pm && (pm.upi || pm.bank_name || pm.account_number || pm.ifsc);
                         
                         if (!hasData) return <p className="text-[10px] text-gray-400 text-center py-4 font-bold italic">No payment methods configured by user.</p>;
                         
                         return (
                           <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                              <div>
                                 <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">UPI ID</p>
                                 <p className="text-[11px] font-bold text-gray-900">{pm.upi || "—"}</p>
                              </div>
                              <div>
                                 <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Bank Name</p>
                                 <p className="text-[11px] font-bold text-gray-900">{pm.bank_name || "—"}</p>
                              </div>
                              <div>
                                 <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Account Number</p>
                                 <p className="text-[11px] font-bold text-gray-900 font-mono tracking-tighter">{pm.account_number || "—"}</p>
                              </div>
                              <div>
                                 <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">IFSC Code</p>
                                 <p className="text-[11px] font-bold text-gray-900 font-mono uppercase">{pm.ifsc || "—"}</p>
                              </div>
                           </div>
                         );
                       })()}
                    </div>
                  </div>

                  {/* Buy Orders */}
                  <div>
                    <h4 className="text-[11px] font-black text-gray-900 uppercase tracking-widest mb-3 flex items-center gap-2 text-[#1e3a5f]"><ShoppingCart size={13}/> Purchase History</h4>
                    <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                      {(!userDetails.buyOrders || userDetails.buyOrders.length === 0) && <p className="text-[10px] text-gray-300 text-center py-4 font-bold">No purchases</p>}
                      {userDetails.buyOrders?.map(o => (
                        <div key={o.id} className="flex items-center justify-between p-3 bg-blue-50/40 rounded-xl border border-blue-100/50">
                          <div>
                            <p className="text-[11px] font-black text-gray-900 truncate max-w-[200px]">{o.title}</p>
                            <p className="text-[9px] text-gray-400 font-bold mt-0.5">{new Date(o.created_at).toLocaleDateString()}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[11px] font-black text-[#1e3a5f]">₹{parseFloat(o.total_amount||0).toLocaleString()}</p>
                            <span className="text-[8px] font-bold text-gray-400 uppercase">{o.payment_status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Sell Orders */}
                  <div>
                    <h4 className="text-[11px] font-black text-gray-900 uppercase tracking-widest mb-3 flex items-center gap-2 text-emerald-700"><TrendingUp size={13}/> Sales History</h4>
                    <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                      {(!userDetails.sellOrders || userDetails.sellOrders.length === 0) && <p className="text-[10px] text-gray-300 text-center py-4 font-bold">No sales</p>}
                      {userDetails.sellOrders?.map(o => (
                        <div key={o.id} className="flex items-center justify-between p-3 bg-emerald-50/40 rounded-xl border border-emerald-100/50">
                          <div>
                            <p className="text-[11px] font-black text-gray-900 truncate max-w-[200px]">{o.title}</p>
                            <p className="text-[9px] text-gray-400 font-bold mt-0.5">{new Date(o.created_at).toLocaleDateString()}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[11px] font-black text-emerald-600">₹{parseFloat(o.total_amount||0).toLocaleString()}</p>
                            <span className="text-[8px] font-bold text-gray-400 uppercase">{o.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
