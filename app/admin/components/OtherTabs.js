"use client";
import { useState } from "react";
import { Search, RefreshCw, Eye, CheckCircle, XCircle, Image } from "lucide-react";

export function OrdersTab({ orders, tabLoading, onResolve, API_BASE_URL }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [receiptPreview, setReceiptPreview] = useState(null);
  const filtered = orders.filter(o => {
    const q = search.toLowerCase();
    const m = o.product_title?.toLowerCase().includes(q) || o.buyer_name?.toLowerCase().includes(q) || o.seller_name?.toLowerCase().includes(q);
    if (!m) return false;
    if (filter !== "all") return o.status === filter;
    return true;
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row gap-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search orders..." className="w-full pl-9 pr-4 py-3 bg-gray-50 rounded-xl text-[13px] font-semibold outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 placeholder:text-gray-400"/>
        </div>
        <div className="flex gap-1 bg-gray-50 p-1 rounded-xl overflow-x-auto">
          {["all","ACCEPTED","SHIPPED","DELIVERED","CONFIRMED","CANCELLED","DISPUTED","RETURNED","EXPIRED"].map(f=>(
            <button key={f} onClick={()=>setFilter(f)} className={`px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${filter===f?"bg-white text-[#1e3a5f] shadow":"text-gray-400"}`}>{f}</button>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {tabLoading ? <div className="flex justify-center py-16"><RefreshCw className="animate-spin text-[#1e3a5f]" size={24}/></div> : (
          <div>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead><tr className="border-b border-gray-100 bg-gray-50">
                  {["Deal ID","Product","Buyer","Seller","Amount","Payment","Status","Audit","Actions"].map(h=>(
                    <th key={h} className="text-left px-4 py-3 text-[9px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {filtered.length===0&&<tr><td colSpan={8} className="text-center py-14 text-[11px] text-gray-300 font-bold uppercase">No records found</td></tr>}
                  {filtered.map(o=>(
                    <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-[11px] font-black text-gray-900">#D-{o.id}</td>
                      <td className="px-4 py-3 text-[11px] font-bold text-gray-700 max-w-[160px] truncate">{o.product_title||"—"}</td>
                      <td className="px-4 py-3 text-[11px] font-medium text-gray-600">{o.buyer_name||"—"}</td>
                      <td className="px-4 py-3 text-[11px] font-medium text-gray-600">{o.seller_name||"—"}</td>
                      <td className="px-4 py-3 text-[12px] font-black text-gray-900">₹{parseFloat(o.total_amount||o.amount||0).toLocaleString()}</td>
                      <td className="px-4 py-3">
                         <div className="flex flex-col gap-1">
                            <span className={`px-2 py-0.5 rounded text-[7px] font-black uppercase tracking-tighter ${o.payment_status==='PAID'?'bg-emerald-50 text-emerald-600 border border-emerald-100':'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                               {o.payment_status||'PENDING'}
                            </span>
                            {o.payment_method && <span className="text-[7px] font-bold text-gray-400 uppercase truncate">via {o.payment_method}</span>}
                         </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${
                          o.status==="CONFIRMED"?"bg-black text-white":
                          o.status==="SHIPPED"?"bg-amber-500 text-white":
                          o.status==="DELIVERED"?"bg-emerald-500 text-white":
                          o.status==="DISPUTED"?"bg-rose-500 text-white":
                          o.status==="RETURNED"?"bg-gray-400 text-white":
                          o.status==="CANCELLED" || o.status==="EXPIRED"?"bg-gray-100 text-gray-400":
                          "bg-blue-600 text-white"
                        }`}>{o.status||"—"}</span>
                      </td>
                      <td className="px-4 py-3 max-w-[150px]">
                         {(o.status === 'CANCELLED' || o.status === 'DISPUTED') && (
                            <p className="text-[9px] italic text-rose-500 font-medium truncate" title={o.cancel_reason || o.dispute_reason}>
                               {o.cancel_reason || o.dispute_reason}
                            </p>
                         )}
                         {o.tracking_number && (
                            <p className="text-[8px] font-bold text-gray-400 tracking-tight">TRK: {o.tracking_number}</p>
                         )}
                      </td>
                      <td className="px-4 py-3">
                         <div className="flex gap-2">
                             {(o.status === 'DISPUTED' || o.status === 'SHIPPED' || o.status === 'DELIVERED') && (
                               <button 
                                  onClick={() => onResolve(o.id, 'CONFIRMED')}
                                  className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors"
                                  title="Resolve: Confirm Sale"
                               >
                                  <CheckCircle size={14}/>
                               </button>
                            )}
                            {(o.status === 'DISPUTED' || o.status === 'ACCEPTED') && (
                               <button 
                                  onClick={() => onResolve(o.id, 'CANCELLED')}
                                  className="p-1.5 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-colors"
                                  title="Resolve: Cancel Deal"
                               >
                                  <XCircle size={14}/>
                               </button>
                            )}
                         </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-gray-100">
               {filtered.length===0&&<div className="text-center py-14 text-[11px] text-gray-300 font-bold uppercase">No records found</div>}
               {filtered.map(o=>(
                 <div key={o.id} className="p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-[12px] font-black text-gray-900 leading-tight mb-1">{o.product_title||"—"}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">#D-{o.id}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${
                        o.status==="CONFIRMED"?"bg-black text-white":
                        o.status==="SHIPPED"?"bg-amber-500 text-white":
                        o.status==="DELIVERED"?"bg-emerald-500 text-white":
                        o.status==="DISPUTED"?"bg-rose-500 text-white":
                        o.status==="RETURNED"?"bg-gray-400 text-white":
                        o.status==="CANCELLED" || o.status==="EXPIRED"?"bg-gray-100 text-gray-400":
                        "bg-blue-600 text-white"
                      }`}>{o.status||"—"}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 bg-gray-50/50 p-3 rounded-xl border border-gray-100/50">
                       <div>
                         <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Buyer</p>
                         <p className="text-[10px] font-bold text-gray-700">{o.buyer_name||"—"}</p>
                       </div>
                       <div>
                         <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Seller</p>
                         <p className="text-[10px] font-bold text-gray-700">{o.seller_name||"—"}</p>
                       </div>
                       <div className="col-span-2 pt-1 mt-1 border-t border-gray-100">
                         <div className="flex justify-between items-center">
                           <p className="text-[14px] font-black text-gray-900">₹{parseFloat(o.total_amount||o.amount||0).toLocaleString()}</p>
                           {o.tracking_number && <p className="text-[8px] font-bold text-blue-600 tracking-tight px-2 py-0.5 bg-blue-50 rounded-full">TRK: {o.tracking_number}</p>}
                         </div>
                       </div>
                    </div>

                    { (o.status === 'CANCELLED' || o.status === 'DISPUTED') && o.cancel_reason && (
                       <p className="text-[9px] italic text-rose-500 font-medium bg-rose-50/50 p-2 rounded-lg">{o.cancel_reason || o.dispute_reason}</p>
                    )}

                    <div className="flex gap-2">
                        {(o.status === 'DISPUTED' || o.status === 'SHIPPED' || o.status === 'DELIVERED') && (
                          <button 
                             onClick={() => onResolve(o.id, 'CONFIRMED')}
                             className="flex-1 py-2 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-emerald-100"
                          >
                             Confirm Sale
                          </button>
                       )}
                       {(o.status === 'DISPUTED' || o.status === 'ACCEPTED') && (
                          <button 
                             onClick={() => onResolve(o.id, 'CANCELLED')}
                             className="flex-1 py-2 bg-rose-50 text-rose-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-rose-100"
                          >
                             Cancel Deal
                          </button>
                       )}
                    </div>
                 </div>
               ))}
            </div>
          </div>
        )}
      </div>
      {/* Receipt Preview Modal */}
      {receiptPreview && (
        <div className="fixed inset-0 z-[1000] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setReceiptPreview(null)}>
          <div className="relative max-w-2xl w-full" onClick={e => e.stopPropagation()}>
            <button onClick={() => setReceiptPreview(null)} className="absolute -top-8 right-0 text-white/60 hover:text-white text-[10px] font-black uppercase tracking-widest">Close ✕</button>
            <div className="bg-white rounded-2xl overflow-hidden shadow-2xl">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3 bg-gray-50">
                <CheckCircle size={16} className="text-emerald-500"/>
                <p className="text-[11px] font-black uppercase tracking-widest text-gray-900">Payment Receipt — Submitted by Buyer</p>
              </div>
              <div className="p-4">
                <img src={receiptPreview} alt="Payment Receipt" className="w-full rounded-xl object-contain max-h-[60vh]"/>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function ChatsTab({ chats, tabLoading, onOpenHistory }) {
  const filtered = chats;
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {tabLoading ? <div className="flex justify-center py-16"><RefreshCw className="animate-spin text-[#1e3a5f]" size={24}/></div> : (
        <div>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-gray-100 bg-gray-50">
                {["Chat ID","Product","Buyer","Seller","Messages","Last Message","Action"].map(h=>(
                  <th key={h} className="text-left px-4 py-3 text-[9px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {filtered.length===0&&<tr><td colSpan={7} className="text-center py-14 text-[11px] text-gray-300 font-bold uppercase">No chats found</td></tr>}
                {filtered.map(c=>(
                  <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-[11px] font-black text-gray-900">#{c.id}</td>
                    <td className="px-4 py-3 text-[11px] font-bold text-gray-700 max-w-[160px] truncate">{c.product_title||"—"}</td>
                    <td className="px-4 py-3 text-[11px] font-medium text-gray-600">{c.buyer_name||"—"}</td>
                    <td className="px-4 py-3 text-[11px] font-medium text-gray-600">{c.seller_name||"—"}</td>
                    <td className="px-4 py-3 text-[12px] font-black text-[#1e3a5f] text-center">{c.message_count||0}</td>
                    <td className="px-4 py-3 text-[10px] text-gray-500 font-medium max-w-[200px] truncate">{c.last_message||"—"}</td>
                    <td className="px-4 py-3">
                      <button 
                         onClick={() => onOpenHistory(c)}
                         className="p-2 bg-gray-50 text-gray-600 rounded-xl hover:bg-[#1e3a5f] hover:text-white transition-all"
                         title="View Full History"
                      >
                        <Eye size={14}/>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-gray-100">
             {filtered.length===0&&<div className="text-center py-14 text-[11px] text-gray-300 font-bold uppercase">No chats found</div>}
             {filtered.map(c=>(
               <div key={c.id} className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[12px] font-black text-gray-900 leading-tight mb-1">{c.product_title||"—"}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">#{c.id} · {c.message_count||0} Msgs</p>
                    </div>
                    <button 
                       onClick={() => onOpenHistory(c)}
                       className="p-2.5 bg-[#1e3a5f] text-white rounded-xl shadow-lg shadow-blue-100"
                    >
                      <Eye size={16}/>
                    </button>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <div className="flex justify-between text-[10px] mb-2">
                       <span className="text-gray-400 font-bold uppercase tracking-widest">Buyer: <span className="text-gray-700">{c.buyer_name||"—"}</span></span>
                       <span className="text-gray-400 font-bold uppercase tracking-widest">Seller: <span className="text-gray-700">{c.seller_name||"—"}</span></span>
                    </div>
                    <p className="text-[11px] text-gray-600 font-medium italic truncate">&ldquo;{c.last_message||"—"}&rdquo;</p>
                  </div>
               </div>
             ))}
          </div>
        </div>
      )}
    </div>
  );
}






export function ReportsTab({ reports, onResolve, tabLoading }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {tabLoading ? <div className="flex justify-center py-16"><RefreshCw className="animate-spin text-[#1e3a5f]" size={24}/></div> : (
        <div>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-gray-100 bg-gray-50">
                {["Report ID", "Reporter", "Reported User", "Product", "Reason", "Status", "Date", "Action"].map(h=>(
                  <th key={h} className="text-left px-4 py-3 text-[9px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {reports.length===0&&<tr><td colSpan={8} className="text-center py-14 text-[11px] text-gray-300 font-bold uppercase">No reports found</td></tr>}
                {reports.map(r=>(
                  <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-[11px] font-black text-gray-900">#{r.id}</td>
                    <td className="px-4 py-3 text-[11px] font-bold text-gray-700">{r.reporter_name||"—"}</td>
                    <td className="px-4 py-3 text-[11px] font-medium text-rose-600">{r.reported_name||"—"}</td>
                    <td className="px-4 py-3 text-[11px] font-medium text-blue-600 truncate max-w-[120px]">{r.product_title||"—"}</td>
                    <td className="px-4 py-3 text-[11px] font-medium text-gray-600 max-w-[150px] truncate" title={r.description}>{r.reason}</td>
                    <td className="px-4 py-3">
                       <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase ${r.status==='resolved'?'bg-emerald-50 text-emerald-700':'bg-rose-50 text-rose-700'}`}>
                          {r.status}
                       </span>
                    </td>
                    <td className="px-4 py-3 text-[10px] text-gray-400 font-medium whitespace-nowrap">{new Date(r.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right">
                      {r.status === 'pending' ? (
                         <button onClick={()=>onResolve(r.id)} className="px-3 py-1.5 bg-[#1e3a5f] text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-[#2e538a] transition-all">
                           Resolve
                         </button>
                      ) : (
                         <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-1"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg> Done</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-gray-100">
             {reports.length===0&&<div className="text-center py-14 text-[11px] text-gray-300 font-bold uppercase">No reports found</div>}
             {reports.map(r=>(
               <div key={r.id} className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[11px] font-black text-rose-600 leading-tight mb-1">Reported: {r.reported_name||"—"}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">#{r.id} · {new Date(r.created_at).toLocaleDateString()}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-[8px] font-black uppercase whitespace-nowrap ${r.status==='resolved'?'bg-emerald-50 text-emerald-700':'bg-rose-50 text-rose-700'}`}>
                        {r.status}
                    </span>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 line-clamp-1">Product: <span className="text-blue-600">{r.product_title||"—"}</span></p>
                    <p className="text-[12px] font-bold text-gray-700 mb-1">{r.reason}</p>
                    <p className="text-[11px] text-gray-500 font-medium italic line-clamp-2">&ldquo;{r.description}&rdquo;</p>
                  </div>

                  <div className="flex items-center justify-between">
                     <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest px-2 py-0.5 bg-gray-50 rounded-full">By: {r.reporter_name||"—"}</p>
                     {r.status === 'pending' ? (
                       <button onClick={()=>onResolve(r.id)} className="px-4 py-2 bg-[#1e3a5f] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-100">
                         Resolve Report
                       </button>
                    ) : (
                       <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-1"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg> Closed</span>
                    )}
                  </div>
               </div>
             ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function EscrowTab({ escrowDeals, tabLoading, onRelease, API_BASE_URL }) {
  const [search, setSearch] = useState("");
  const filtered = escrowDeals.filter(d => {
    const q = search.toLowerCase();
    return d.product_title?.toLowerCase().includes(q) || 
           d.buyer_name?.toLowerCase().includes(q) || 
           d.seller_name?.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-5">
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
          <input 
            value={search} 
            onChange={e=>setSearch(e.target.value)} 
            placeholder="Search confirmed deals..." 
            className="w-full pl-9 pr-4 py-3 bg-gray-50 rounded-xl text-[13px] font-semibold outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 placeholder:text-gray-400"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {tabLoading ? (
          <div className="flex justify-center py-16"><RefreshCw className="animate-spin text-[#1e3a5f]" size={24}/></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {["Deal Info", "Buyer", "Seller Info", "Financials", "Payout Status", "Action"].map(h=>(
                    <th key={h} className="text-left px-4 py-3 text-[9px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-14 text-[11px] text-gray-300 font-bold uppercase">No escrow records found</td></tr>
                )}
                {filtered.map(d => (
                  <tr key={d.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-[11px] font-black text-gray-900">#D-{d.id}</p>
                      <p className="text-[10px] font-bold text-gray-500 truncate max-w-[150px]">{d.product_title}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-[11px] font-bold text-gray-700">{d.buyer_name}</p>
                      <p className="text-[9px] text-gray-400 font-medium">{new Date(d.buyer_confirmed_at).toLocaleDateString()}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-[11px] font-bold text-gray-700">{d.seller_name}</p>
                      {d.seller_payment_info && (
                        <p className="text-[9px] text-blue-600 font-bold truncate max-w-[120px]">
                          {typeof d.seller_payment_info === 'string' ? d.seller_payment_info : JSON.stringify(d.seller_payment_info)}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5">
                        <p className="text-[12px] font-black text-gray-900">₹{parseFloat(d.amount).toLocaleString()}</p>
                        <p className="text-[8px] font-bold text-rose-500 uppercase">Comm: ₹{parseFloat(d.total_platform_fee || 0).toLocaleString()}</p>
                        <p className="text-[9px] font-black text-emerald-600 uppercase">Payout: ₹{parseFloat(d.seller_payout || 0).toLocaleString()}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${
                        d.payout_status === 'RELEASED' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
                      }`}>
                        {d.payout_status}
                      </span>
                      {d.payout_released_at && (
                        <p className="text-[7px] text-gray-400 mt-1 font-bold uppercase tracking-tight">Released: {new Date(d.payout_released_at).toLocaleDateString()}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {d.payout_status === 'PENDING' && (
                        <button 
                          onClick={() => onRelease(d.id)}
                          className="px-3 py-2 bg-[#1e3a5f] text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-[#2e538a] transition-all shadow-lg shadow-blue-100"
                        >
                          Release Payout
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
