"use client";
import { useState } from "react";
import { Search, RefreshCw, Eye, CheckCircle, XCircle, Image, Gavel, TrendingUp, PieChart, Download, Filter, ArrowRight, ArrowDownLeft, ArrowUpRight } from "lucide-react";

export function FinancialAuditTab({ ledger, summary, loading, onFilter, onDownload, filters, setFilters, API_BASE_URL }) {
  return (
    <div className="space-y-8">
      {/* Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "GMV (Gross Volume)", value: summary?.gross_merchandise_value, icon: TrendingUp, color: "bg-black text-white" },
          { label: "Platform Revenue", value: summary?.platform_revenue, icon: PieChart, color: "bg-primary text-white" },
          { label: "GST Collected", value: summary?.gst_collected, icon: CheckCircle, color: "bg-emerald-600 text-white" },
          { label: "Shipping Volume", value: summary?.shipping_handled, icon: Image, color: "bg-amber-500 text-white" }
        ].map((item, idx) => (
          <div key={idx} className={`${item.color} p-5 rounded-[2rem] shadow-xl relative overflow-hidden group`}>
            <div className="absolute top-0 right-0 w-20 h-20 bg-surface/10 rounded-full -mr-10 -mt-10 blur-xl group-hover:scale-150 transition-transform"></div>
            <div className="flex justify-between items-start mb-4">
              <div className="w-8 h-8 bg-surface/20 rounded-lg flex items-center justify-center">
                <item.icon size={16} />
              </div>
              <span className="text-[7px] font-black uppercase tracking-widest bg-surface/20 px-2 py-0.5 rounded-full">Global Audit</span>
            </div>
            <p className="text-xs font-bold opacity-70 uppercase tracking-widest">{item.label}</p>
            <h3 className="text-xl font-black mt-1">₹{parseFloat(item.value || 0).toLocaleString()}</h3>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="bg-surface p-6 rounded-[2.5rem] border border-border shadow-sm space-y-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[250px] relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input 
              type="text" 
              placeholder="Search by Product, Buyer, Seller, or Deal ID..."
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
              onKeyDown={(e) => e.key === 'Enter' && onFilter()}
              className="w-full pl-12 pr-4 py-3 bg-background border border-transparent rounded-lg text-sm font-bold outline-none focus:bg-surface focus:ring-2 ring-blue-50 transition-all"
            />
          </div>
          
          <div className="flex items-center gap-3 bg-background px-4 py-2 rounded-xl">
            <Filter className="w-3.5 h-3.5 text-muted" />
            <select 
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
              className="bg-transparent text-xs font-black uppercase tracking-widest outline-none cursor-pointer"
            >
              <option value="ALL">All States</option>
              <option value="PAID">Paid</option>
              <option value="SHIPPED">Shipped</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-gray-50">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-muted uppercase tracking-widest">Start</span>
              <input 
                type="date" 
                value={filters.startDate}
                onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                className="bg-background border-none text-xs font-bold px-3 py-2 rounded-lg outline-none focus:ring-2 ring-blue-50"
              />
            </div>
            <ArrowRight className="w-3 h-3 text-muted" />
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-muted uppercase tracking-widest">End</span>
              <input 
                type="date" 
                value={filters.endDate}
                onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                className="bg-background border-none text-xs font-bold px-3 py-2 rounded-lg outline-none focus:ring-2 ring-blue-50"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={onDownload}
              className="flex items-center gap-2 bg-emerald-50 text-emerald-600 border border-emerald-100 px-5 py-3 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-emerald-100 transition-all"
            >
              <Download className="w-4 h-4" />
              Export Audit CSV
            </button>
            <button 
              onClick={onFilter}
              className="bg-black text-white px-8 py-3 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-foreground transition-all shadow-lg shadow-gray-200"
            >
              Apply Audit Filters
            </button>
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-surface rounded-[2.5rem] border border-border shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-20"><RefreshCw className="animate-spin text-black" size={24}/></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-background/50 border-b border-border">
                  {["Deal/Product", "Buyer/Seller", "Breakdown", "Net Flows", "Status", "Timestamp"].map(h => (
                    <th key={h} className="text-left px-6 py-4 text-xs font-black text-muted uppercase tracking-[0.2em]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {ledger.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-20 text-sm font-bold text-muted uppercase tracking-[0.3em]">No Audit Logs Matched</td></tr>
                )}
                {ledger.map(row => (
                  <tr key={row.id} className="hover:bg-background/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-background shrink-0 border border-border">
                          <img src={(() => { const img = row.product_image; if (!img) return null; if (typeof img === 'string' && img.startsWith('http')) return img; if (typeof img === 'string') { try { const p = JSON.parse(img); if (Array.isArray(p) && p.length > 0) { const s = p[0]; return s.startsWith('http') ? s : `${API_BASE_URL}/uploads/${s}`; } } catch {} return `${API_BASE_URL}/uploads/${img}`; } return null; })()} className="w-full h-full object-cover" alt="Product" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-foreground group-hover:text-primary transition-colors line-clamp-1">{row.product_title}</p>
                          <p className="text-xs font-bold text-muted uppercase tracking-widest mt-0.5">#D-{row.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                         <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-blue-50 rounded-full flex items-center justify-center"><ArrowDownLeft size={8} className="text-primary"/></div>
                            <div className="flex flex-col">
                               <span className="text-xs font-bold text-muted leading-none">{row.buyer_name}</span>
                               <span className="text-[7px] text-muted font-medium uppercase mt-0.5">Buyer</span>
                            </div>
                         </div>
                         <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-emerald-50 rounded-full flex items-center justify-center"><ArrowUpRight size={8} className="text-emerald-600"/></div>
                            <div className="flex flex-col">
                               <span className="text-xs font-bold text-muted leading-none">{row.seller_name}</span>
                               <span className="text-[7px] text-muted font-medium uppercase mt-0.5">Seller</span>
                            </div>
                         </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex justify-between gap-4">
                          <span className="text-xs font-bold text-muted uppercase">Base Price</span>
                          <span className="text-xs font-black text-foreground">₹{parseFloat(row.amount).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-xs font-bold text-muted uppercase">Comm (Excl GST)</span>
                          <span className="text-xs font-black text-rose-500">₹{parseFloat(row.commission_amount || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-xs font-bold text-muted uppercase">Platform GST</span>
                          <span className="text-xs font-black text-rose-400">₹{parseFloat(row.platform_gst_amount || 0).toLocaleString()}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                           <span className="text-xs font-black bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded uppercase">Paid</span>
                           <span className="text-sm font-black text-foreground">₹{parseFloat(row.total_buyer_cost).toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                           <span className="text-xs font-black bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded uppercase">Payout</span>
                           <span className="text-sm font-black text-emerald-600">₹{parseFloat(row.seller_payout).toLocaleString()}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest ${
                        row.status === 'CONFIRMED' ? 'bg-black text-white' :
                        row.status === 'CANCELLED' ? 'bg-background text-muted' :
                        'bg-blue-50 text-primary border border-blue-100'
                      }`}>
                        {row.status === 'CONFIRMED' ? 'AUDITED' : row.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs font-bold text-foreground leading-none">{new Date(row.created_at).toLocaleDateString()}</p>
                      <p className="text-xs font-black text-muted uppercase tracking-widest mt-1">{new Date(row.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
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
      <div className="flex flex-col sm:flex-row gap-4 bg-surface p-5 rounded-xl border border-border shadow-sm">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search orders..." className="w-full pl-9 pr-4 py-3 bg-background rounded-lg text-[13px] font-semibold outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 placeholder:text-muted"/>
        </div>
        <div className="flex gap-1 bg-background p-1 rounded-xl overflow-x-auto">
          {["all","ACCEPTED","SHIPPED","DELIVERED","CONFIRMED","CANCELLED","DISPUTED","RETURNED","EXPIRED"].map(f=>(
            <button key={f} onClick={()=>setFilter(f)} className={`px-3 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${filter===f?"bg-surface text-primary shadow":"text-muted"}`}>{f}</button>
          ))}
        </div>
      </div>
      <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden">
        {tabLoading ? <div className="flex justify-center py-16"><RefreshCw className="animate-spin text-primary" size={24}/></div> : (
          <div>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead><tr className="border-b border-border bg-background">
                  {["Deal ID","Product","Buyer","Seller","Amount","Payment","Status","Audit","Actions"].map(h=>(
                    <th key={h} className="text-left px-4 py-3 text-xs font-black text-muted uppercase tracking-widest whitespace-nowrap">{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {filtered.length===0&&<tr><td colSpan={8} className="text-center py-14 text-sm text-muted font-bold uppercase">No records found</td></tr>}
                  {filtered.map(o=>(
                    <tr key={o.id} className="border-b border-gray-50 hover:bg-background transition-colors">
                      <td className="px-4 py-3 text-sm font-black text-foreground">#D-{o.id}</td>
                      <td className="px-4 py-3 text-sm font-bold text-muted max-w-[160px] truncate">{o.product_title||"—"}</td>
                      <td className="px-4 py-3 text-sm font-medium text-muted">{o.buyer_name||"—"}</td>
                      <td className="px-4 py-3 text-sm font-medium text-muted">{o.seller_name||"—"}</td>
                      <td className="px-4 py-3">
                         <div className="flex flex-col gap-0.5">
                            <p className="text-[12px] font-black text-foreground leading-none">₹{parseFloat(o.amount || 0).toLocaleString()}</p>
                            {parseFloat(o.shipping_fee || 0) > 0 && (
                               <p className="text-xs font-bold text-primary uppercase tracking-tight">+ ₹{parseFloat(o.shipping_fee).toLocaleString()} SHP</p>
                            )}
                            <div className="h-[1px] w-8 bg-background my-0.5"></div>
                            <p className="text-xs font-black text-foreground">₹{(parseFloat(o.amount || 0) + parseFloat(o.shipping_fee || 0)).toLocaleString()}</p>
                         </div>
                      </td>
                      <td className="px-4 py-3">
                         <div className="flex flex-col gap-1">
                            <span className={`px-2 py-0.5 rounded text-[7px] font-black uppercase tracking-tighter ${o.payment_status==='PAID'?'bg-emerald-50 text-emerald-600 border border-emerald-100':'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                               {o.payment_status||'PENDING'}
                            </span>
                            {o.payment_method && <span className="text-[7px] font-bold text-muted uppercase truncate">via {o.payment_method}</span>}
                            {o.razorpay_payment_id && <span className="text-[7px] font-black text-primary truncate" title={o.razorpay_payment_id}>RPAY: {o.razorpay_payment_id}</span>}
                            {o.razorpay_order_id && <span className="text-[7px] font-bold text-muted truncate" title={o.razorpay_order_id}>ORD: {o.razorpay_order_id}</span>}
                         </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-lg text-xs font-black uppercase tracking-widest ${
                          o.status==="CONFIRMED"?"bg-black text-white":
                          o.status==="SHIPPED"?"bg-amber-500 text-white":
                          o.status==="DELIVERED"?"bg-emerald-500 text-white":
                          o.status==="DISPUTED"?"bg-rose-500 text-white":
                          o.status==="RETURNED"?"bg-gray-400 text-white":
                          o.status==="CANCELLED" || o.status==="EXPIRED"?"bg-background text-muted":
                          "bg-primary text-white"
                        }`}>{
                          o.status === 'DELIVERED' ? 'IN 48H INSPECTION' :
                          o.status === 'CONFIRMED' ? 'COMPLETED' :
                          o.status || "—"
                        }</span>
                      </td>
                      <td className="px-4 py-3 max-w-[150px]">
                         {(o.status === 'CANCELLED' || o.status === 'DISPUTED') && (
                            <p className="text-xs italic text-rose-500 font-medium truncate" title={o.cancel_reason || o.dispute_reason}>
                               {o.cancel_reason || o.dispute_reason}
                            </p>
                         )}
                         {o.tracking_number && (
                            <p className="text-xs font-bold text-muted tracking-tight">TRK: {o.tracking_number}</p>
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
               {filtered.length===0&&<div className="text-center py-14 text-sm text-muted font-bold uppercase">No records found</div>}
               {filtered.map(o=>(
                 <div key={o.id} className="p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-[12px] font-black text-foreground leading-tight mb-1">{o.product_title||"—"}</p>
                        <p className="text-xs text-muted font-bold uppercase tracking-tight">#D-{o.id}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-lg text-xs font-black uppercase tracking-widest ${
                        o.status==="CONFIRMED"?"bg-black text-white":
                        o.status==="SHIPPED"?"bg-amber-500 text-white":
                        o.status==="DELIVERED"?"bg-emerald-500 text-white":
                        o.status==="DISPUTED"?"bg-rose-500 text-white":
                        o.status==="RETURNED"?"bg-gray-400 text-white":
                        o.status==="CANCELLED" || o.status==="EXPIRED"?"bg-background text-muted":
                        "bg-primary text-white"
                      }`}>{o.status||"—"}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 bg-background/50 p-3 rounded-xl border border-border/50">
                       <div>
                         <p className="text-xs font-black text-muted uppercase tracking-widest mb-0.5">Buyer</p>
                         <p className="text-xs font-bold text-muted">{o.buyer_name||"—"}</p>
                       </div>
                       <div>
                         <p className="text-xs font-black text-muted uppercase tracking-widest mb-0.5">Seller</p>
                         <p className="text-xs font-bold text-muted">{o.seller_name||"—"}</p>
                       </div>
                        <div className="col-span-2 pt-1 mt-1 border-t border-border">
                          <div className="flex justify-between items-center">
                            <div className="flex flex-col">
                               <p className="text-[14px] font-black text-foreground leading-none">₹{(parseFloat(o.amount || 0) + parseFloat(o.shipping_fee || 0)).toLocaleString()}</p>
                               {parseFloat(o.shipping_fee || 0) > 0 && (
                                  <p className="text-xs font-bold text-primary uppercase mt-1">Incl. ₹{parseFloat(o.shipping_fee).toLocaleString()} Shipping</p>
                               )}
                            </div>
                            {o.tracking_number && <p className="text-xs font-bold text-primary tracking-tight px-2 py-0.5 bg-blue-50 rounded-full">TRK: {o.tracking_number}</p>}
                          </div>
                        </div>
                    </div>

                    { (o.status === 'CANCELLED' || o.status === 'DISPUTED') && o.cancel_reason && (
                       <p className="text-xs italic text-rose-500 font-medium bg-rose-50/50 p-2 rounded-xl">{o.cancel_reason || o.dispute_reason}</p>
                    )}

                    <div className="flex gap-2">
                        {(o.status === 'DISPUTED' || o.status === 'SHIPPED' || o.status === 'DELIVERED') && (
                          <button 
                             onClick={() => onResolve(o.id, 'CONFIRMED')}
                             className="flex-1 py-2 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-black uppercase tracking-widest border border-emerald-100"
                          >
                             Confirm Sale
                          </button>
                       )}
                       {(o.status === 'DISPUTED' || o.status === 'ACCEPTED') && (
                          <button 
                             onClick={() => onResolve(o.id, 'CANCELLED')}
                             className="flex-1 py-2 bg-rose-50 text-rose-600 rounded-lg text-xs font-black uppercase tracking-widest border border-rose-100"
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
            <button onClick={() => setReceiptPreview(null)} className="absolute -top-8 right-0 text-white/60 hover:text-white text-xs font-black uppercase tracking-widest">Close</button>
            <div className="bg-surface rounded-xl overflow-hidden shadow-2xl">
              <div className="px-5 py-4 border-b border-border flex items-center gap-3 bg-background">
                <CheckCircle size={16} className="text-emerald-500"/>
                <p className="text-sm font-black uppercase tracking-widest text-foreground">Payment Receipt — Submitted by Buyer</p>
              </div>
              <div className="p-4">
                <img src={receiptPreview} alt="Payment Receipt" className="w-full rounded-lg object-contain max-h-[60vh]"/>
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
    <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden">
      {tabLoading ? <div className="flex justify-center py-16"><RefreshCw className="animate-spin text-primary" size={24}/></div> : (
        <div>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-border bg-background">
                {["Chat ID","Product","Buyer","Seller","Messages","Last Message","Action"].map(h=>(
                  <th key={h} className="text-left px-4 py-3 text-xs font-black text-muted uppercase tracking-widest whitespace-nowrap">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {filtered.length===0&&<tr><td colSpan={7} className="text-center py-14 text-sm text-muted font-bold uppercase">No chats found</td></tr>}
                {filtered.map(c=>(
                  <tr key={c.id} className="border-b border-gray-50 hover:bg-background transition-colors">
                    <td className="px-4 py-3 text-sm font-black text-foreground">#{c.id}</td>
                    <td className="px-4 py-3 text-sm font-bold text-muted max-w-[160px] truncate">{c.product_title||"—"}</td>
                    <td className="px-4 py-3 text-sm font-medium text-muted">{c.buyer_name||"—"}</td>
                    <td className="px-4 py-3 text-sm font-medium text-muted">{c.seller_name||"—"}</td>
                    <td className="px-4 py-3 text-[12px] font-black text-primary text-center">{c.message_count||0}</td>
                    <td className="px-4 py-3 text-xs text-muted font-medium max-w-[200px] truncate">{c.last_message||"—"}</td>
                    <td className="px-4 py-3">
                      <button 
                         onClick={() => onOpenHistory(c)}
                         className="p-2 bg-background text-muted rounded-lg hover:bg-primary hover:text-white transition-all"
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
             {filtered.length===0&&<div className="text-center py-14 text-sm text-muted font-bold uppercase">No chats found</div>}
             {filtered.map(c=>(
               <div key={c.id} className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[12px] font-black text-foreground leading-tight mb-1">{c.product_title||"—"}</p>
                      <p className="text-xs text-muted font-bold uppercase tracking-tight">#{c.id} · {c.message_count||0} Msgs</p>
                    </div>
                    <button 
                       onClick={() => onOpenHistory(c)}
                       className="p-2.5 bg-primary text-white rounded-lg shadow-lg shadow-blue-100"
                    >
                      <Eye size={16}/>
                    </button>
                  </div>
                  <div className="bg-background p-3 rounded-xl border border-border">
                    <div className="flex justify-between text-xs mb-2">
                       <span className="text-muted font-bold uppercase tracking-widest">Buyer: <span className="text-muted">{c.buyer_name||"—"}</span></span>
                       <span className="text-muted font-bold uppercase tracking-widest">Seller: <span className="text-muted">{c.seller_name||"—"}</span></span>
                    </div>
                    <p className="text-sm text-muted font-medium italic truncate">&ldquo;{c.last_message||"—"}&rdquo;</p>
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
    <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden">
      {tabLoading ? <div className="flex justify-center py-16"><RefreshCw className="animate-spin text-primary" size={24}/></div> : (
        <div>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-border bg-background">
                {["Report ID", "Reporter", "Reported User", "Product", "Reason", "Status", "Date", "Action"].map(h=>(
                  <th key={h} className="text-left px-4 py-3 text-xs font-black text-muted uppercase tracking-widest whitespace-nowrap">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {reports.length===0&&<tr><td colSpan={8} className="text-center py-14 text-sm text-muted font-bold uppercase">No reports found</td></tr>}
                {reports.map(r=>(
                  <tr key={r.id} className="border-b border-gray-50 hover:bg-background transition-colors">
                    <td className="px-4 py-3 text-sm font-black text-foreground">#{r.id}</td>
                    <td className="px-4 py-3 text-sm font-bold text-muted">{r.reporter_name||"—"}</td>
                    <td className="px-4 py-3 text-sm font-medium text-rose-600">{r.reported_name||"—"}</td>
                    <td className="px-4 py-3 text-sm font-medium text-primary truncate max-w-[120px]">{r.product_title||"—"}</td>
                    <td className="px-4 py-3 text-sm font-medium text-muted max-w-[150px] truncate" title={r.description}>{r.reason}</td>
                    <td className="px-4 py-3">
                       <span className={`px-2 py-1 rounded-full text-xs font-black uppercase ${r.status==='resolved'?'bg-emerald-50 text-emerald-700':'bg-rose-50 text-rose-700'}`}>
                          {r.status}
                       </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted font-medium whitespace-nowrap">{new Date(r.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right">
                      {r.status === 'pending' ? (
                         <button onClick={()=>onResolve(r.id)} className="px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-black uppercase tracking-widest hover:bg-[#2e538a] transition-all">
                           Resolve
                         </button>
                      ) : (
                         <span className="text-xs font-bold text-emerald-500 flex items-center gap-1"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg> Done</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-gray-100">
             {reports.length===0&&<div className="text-center py-14 text-sm text-muted font-bold uppercase">No reports found</div>}
             {reports.map(r=>(
               <div key={r.id} className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-black text-rose-600 leading-tight mb-1">Reported: {r.reported_name||"—"}</p>
                      <p className="text-xs text-muted font-bold uppercase tracking-tight">#{r.id} · {new Date(r.created_at).toLocaleDateString()}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-black uppercase whitespace-nowrap ${r.status==='resolved'?'bg-emerald-50 text-emerald-700':'bg-rose-50 text-rose-700'}`}>
                        {r.status}
                    </span>
                  </div>
                  
                  <div className="bg-background p-3 rounded-xl border border-border">
                    <p className="text-xs font-black text-muted uppercase tracking-widest mb-1.5 line-clamp-1">Product: <span className="text-primary">{r.product_title||"—"}</span></p>
                    <p className="text-[12px] font-bold text-muted mb-1">{r.reason}</p>
                    <p className="text-sm text-muted font-medium italic line-clamp-2">&ldquo;{r.description}&rdquo;</p>
                  </div>

                  <div className="flex items-center justify-between">
                     <p className="text-xs font-bold text-muted uppercase tracking-widest px-2 py-0.5 bg-background rounded-full">By: {r.reporter_name||"—"}</p>
                     {r.status === 'pending' ? (
                       <button onClick={()=>onResolve(r.id)} className="px-4 py-2 bg-primary text-white rounded-lg text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-100">
                         Resolve Report
                       </button>
                    ) : (
                       <span className="text-xs font-bold text-emerald-500 flex items-center gap-1"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg> Closed</span>
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
      <div className="bg-surface p-5 rounded-xl border border-border shadow-sm">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"/>
          <input 
            value={search} 
            onChange={e=>setSearch(e.target.value)} 
            placeholder="Search confirmed deals..." 
            className="w-full pl-9 pr-4 py-3 bg-background rounded-lg text-[13px] font-semibold outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 placeholder:text-muted"
          />
        </div>
      </div>

      <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden">
        {tabLoading ? (
          <div className="flex justify-center py-16"><RefreshCw className="animate-spin text-primary" size={24}/></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-background">
                  {["Deal Info", "Buyer", "Seller Info", "Financials", "Payout Status", "Action"].map(h=>(
                    <th key={h} className="text-left px-4 py-3 text-xs font-black text-muted uppercase tracking-widest whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-14 text-sm text-muted font-bold uppercase">No escrow records found</td></tr>
                )}
                {filtered.map(d => (
                  <tr key={d.id} className="border-b border-gray-50 hover:bg-background transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm font-black text-foreground">#D-{d.id}</p>
                      <p className="text-xs font-bold text-muted truncate max-w-[150px]">{d.product_title}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-bold text-muted">{d.buyer_name}</p>
                      <p className="text-xs text-muted font-medium">{new Date(d.buyer_confirmed_at).toLocaleDateString()}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-bold text-muted">{d.seller_name}</p>
                      {d.seller_payment_info && (
                        <p className="text-xs text-primary font-bold truncate max-w-[120px]">
                          {typeof d.seller_payment_info === 'string' ? d.seller_payment_info : JSON.stringify(d.seller_payment_info)}
                        </p>
                      )}
                    </td>
                     <td className="px-4 py-3">
                       <div className="flex flex-col gap-0.5">
                         <p className="text-[12px] font-black text-foreground">₹{(parseFloat(d.amount || 0) + parseFloat(d.shipping_fee || 0)).toLocaleString()}</p>
                         <div className="flex flex-wrap gap-x-2">
                           <span className="text-xs font-bold text-blue-500 uppercase">Item: ₹{parseFloat(d.amount).toLocaleString()}</span>
                           {parseFloat(d.shipping_fee || 0) > 0 && (
                             <span className="text-xs font-bold text-primary uppercase">Ship: ₹{parseFloat(d.shipping_fee).toLocaleString()}</span>
                           )}
                         </div>
                         <p className="text-xs font-bold text-rose-500 uppercase">Comm: ₹{parseFloat(d.total_platform_fee || 0).toLocaleString()}</p>
                         <p className="text-xs font-black text-emerald-600 uppercase">Seller Payout: ₹{parseFloat(d.seller_payout || 0).toLocaleString()}</p>
                       </div>
                     </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-lg text-xs font-black uppercase tracking-widest ${
                        d.payout_status === 'RELEASED' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
                      }`}>
                        {d.payout_status}
                      </span>
                      {d.payout_released_at && (
                        <p className="text-[7px] text-muted mt-1 font-bold uppercase tracking-tight">Released: {new Date(d.payout_released_at).toLocaleDateString()}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {d.payout_status === 'PENDING' && (
                        <button 
                          onClick={() => onRelease(d.id)}
                          className="px-3 py-2 bg-primary text-white rounded-lg text-xs font-black uppercase tracking-widest hover:bg-[#2e538a] transition-all shadow-lg shadow-blue-100"
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

export function AuctionsTab({ auctions, tabLoading, onOpenBids, API_BASE_URL }) {
  const [search, setSearch] = useState("");
  const filtered = auctions.filter(a => a.title?.toLowerCase().includes(search.toLowerCase()) || a.seller_name?.toLowerCase().includes(search.toLowerCase()));

  const getRemainingTime = (endTime) => {
    if (!endTime) return "N/A";
    const diff = new Date(endTime).getTime() - new Date().getTime();
    if (diff <= 0) return "EXPIRED";
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / 1000 / 60) % 60);
    
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="space-y-5">
      <div className="bg-surface p-5 rounded-xl border border-border shadow-sm">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search auctions..." className="w-full pl-9 pr-4 py-3 bg-background rounded-lg text-[13px] font-semibold outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 placeholder:text-muted"/>
        </div>
      </div>
      <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden">
        {tabLoading ? <div className="flex justify-center py-16"><RefreshCw className="animate-spin text-primary" size={24}/></div> : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-border bg-background">
                {["Auction ID","Product","Seller","Starting Bid","Reserve","Current Bid","Bids","Ends In", "Audit"].map(h=>(
                  <th key={h} className="text-left px-4 py-3 text-xs font-black text-muted uppercase tracking-widest whitespace-nowrap">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {filtered.length===0&&<tr><td colSpan={9} className="text-center py-14 text-sm text-muted font-bold uppercase">No auctions found</td></tr>}
                {filtered.map(a=>(
                  <tr key={a.id} className="border-b border-gray-50 hover:bg-background transition-colors">
                    <td className="px-4 py-3 text-sm font-black text-foreground">#A-{a.id}</td>
                    <td className="px-4 py-3 text-sm font-bold text-muted max-w-[200px] truncate">{a.title}</td>
                    <td className="px-4 py-3 text-sm font-medium text-muted">{a.seller_name}</td>
                    <td className="px-4 py-3 text-sm font-bold text-foreground">₹{parseFloat(a.starting_bid).toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm font-bold text-amber-600">₹{parseFloat(a.reserve_price || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-[12px] font-black text-primary">₹{parseFloat(a.current_bid || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm font-black text-foreground">{a.bid_count}</td>
                    <td className="px-4 py-3">
                       <span className={`px-2 py-1 rounded-lg text-xs font-black uppercase tracking-widest ${getRemainingTime(a.auction_end) === 'EXPIRED' ? 'bg-background text-muted' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                          {getRemainingTime(a.auction_end)}
                       </span>
                    </td>
                    <td className="px-4 py-3">
                       <button 
                          onClick={() => onOpenBids(a.id)}
                          className="p-2 bg-background text-primary rounded-lg hover:bg-primary hover:text-white transition-all"
                          title="Audit Bids"
                       >
                          <Gavel size={14}/>
                       </button>
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

export function BidsTab({ bids, tabLoading }) {
  const [search, setSearch] = useState("");
  const filtered = bids.filter(b => 
    b.product_title?.toLowerCase().includes(search.toLowerCase()) || 
    b.bidder_name?.toLowerCase().includes(search.toLowerCase()) ||
    b.bidder_email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <div className="bg-surface p-5 rounded-xl border border-border shadow-sm">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search global bid history..." className="w-full pl-9 pr-4 py-3 bg-background rounded-lg text-[13px] font-semibold outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 placeholder:text-muted"/>
        </div>
      </div>
      <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden">
        {tabLoading ? <div className="flex justify-center py-16"><RefreshCw className="animate-spin text-primary" size={24}/></div> : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-border bg-background">
                {["Bid ID","Product","Bidder","Amount","Time"].map(h=>(
                  <th key={h} className="text-left px-4 py-3 text-xs font-black text-muted uppercase tracking-widest whitespace-nowrap">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {filtered.length===0&&<tr><td colSpan={5} className="text-center py-14 text-sm text-muted font-bold uppercase">No bidding activity logged</td></tr>}
                {filtered.map(b=>(
                  <tr key={b.id} className="border-b border-gray-50 hover:bg-background transition-colors">
                    <td className="px-4 py-3 text-sm font-black text-foreground">#B-{b.id}</td>
                    <td className="px-4 py-3 text-sm font-bold text-muted max-w-[250px] truncate">{b.product_title}</td>
                    <td className="px-4 py-3">
                       <p className="text-sm font-bold text-foreground">{b.bidder_name}</p>
                       <p className="text-xs text-muted font-medium">{b.bidder_email}</p>
                    </td>
                    <td className="px-4 py-3 text-[12px] font-black text-emerald-600">₹{parseFloat(b.bid_amount).toLocaleString()}</td>
                    <td className="px-4 py-3 text-xs text-muted font-medium">
                       {new Date(b.created_at).toLocaleString()}
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
