"use client";
import { AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, ArrowUpRight, Users, Package, ShoppingCart, Eye, RefreshCw } from "lucide-react";

function Stat({ label, value, sub, color = "#1e3a5f" }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-2xl font-black text-gray-900">{value ?? "—"}</p>
      {sub && <p className="text-[10px] font-bold text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function Overview({ stats, analytics, analyticsRange, setAnalyticsRange, setActiveTab, fetchStats, fetchAnalytics, showToast }) {
  const chartData = (() => {
    const m = {};
    (analytics.products || []).forEach(p => { m[p.date] = { ...m[p.date], products: +p.count }; });
    (analytics.users || []).forEach(u => { m[u.date] = { ...m[u.date], users: +u.count }; });
    (analytics.orders || []).forEach(o => { m[o.date] = { ...m[o.date], orders: +o.count }; });
    return Object.keys(m).sort().map(d => ({ name: d, products: m[d].products || 0, users: m[d].users || 0, orders: m[d].orders || 0 }));
  })();

  const kpis = [
    { label: "Total Users", value: stats?.totalUsers?.toLocaleString() },
    { label: "Active Sellers", value: stats?.activeSellers?.toLocaleString() },
    { label: "Total Buyers", value: stats?.totalBuyers?.toLocaleString() },
    { label: "Live Listings", value: stats?.liveProducts?.toLocaleString() },
    { label: "Pending Review", value: stats?.pendingVerifications?.toLocaleString() },
    { label: "Total Orders", value: stats?.totalOrders?.toLocaleString() },
    { label: "Gross Turnover", value: `₹${(stats?.grossTurnover || 0).toLocaleString()}` },
    { label: "Market Value", value: `₹${(stats?.totalValue || 0).toLocaleString()}` },
    { label: "Watchlists", value: stats?.totalWatchlists?.toLocaleString() },
    { label: "Site Visitors", value: stats?.totalVisitors?.toLocaleString() },
    { label: "Highest Bid", value: `₹${(stats?.highestBid || 0).toLocaleString()}` },
    { label: "Active Auctions", value: stats?.activeAuctions?.toLocaleString() },
  ];

  return (
    <div className="space-y-8">
      {/* KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
        {kpis.map(k => <Stat key={k.label} label={k.label} value={k.value} />)}
      </div>

      {/* Chart */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-black text-gray-900">Platform Activity</h3>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Users · Listings · Orders over time</p>
          </div>
          <div className="flex gap-1 bg-gray-50 p-1 rounded-xl">
            {["7","30","90"].map(d => (
              <button key={d} onClick={() => setAnalyticsRange(d)}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${analyticsRange === d ? "bg-white text-[#1e3a5f] shadow" : "text-gray-400 hover:text-gray-600"}`}>
                {d}D
              </button>
            ))}
          </div>
        </div>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="cNav" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#1e3a5f" stopOpacity={0.15}/><stop offset="95%" stopColor="#1e3a5f" stopOpacity={0}/></linearGradient>
                <linearGradient id="cGold" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#b8860b" stopOpacity={0.2}/><stop offset="95%" stopColor="#b8860b" stopOpacity={0}/></linearGradient>
                <linearGradient id="cGreen" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
              <XAxis dataKey="name" hide /><YAxis hide />
              <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 40px rgba(0,0,0,0.1)", fontSize: "11px", fontWeight: "700" }}/>
              <Area type="monotone" dataKey="users" stroke="#1e3a5f" strokeWidth={2.5} fill="url(#cNav)"/>
              <Area type="monotone" dataKey="products" stroke="#b8860b" strokeWidth={2.5} fill="url(#cGold)"/>
              <Area type="monotone" dataKey="orders" stroke="#10b981" strokeWidth={2.5} fill="url(#cGreen)"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex gap-6 pt-4 border-t border-gray-50 mt-2">
          {[["#1e3a5f","Users"],["#b8860b","Listings"],["#10b981","Orders"]].map(([c,l]) => (
            <div key={l} className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full" style={{background: c}}/>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{l}</span>
            </div>
          ))}
        </div>
      </div>



      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Review Pending", desc: `${stats?.pendingVerifications || 0} listings waiting`, tab: "products", icon: Package, color: "bg-amber-50 text-amber-700 border-amber-100" },
          { label: "Manage Users", desc: `${stats?.totalUsers || 0} registered accounts`, tab: "users", icon: Users, color: "bg-blue-50 text-[#1e3a5f] border-blue-100" },
          { label: "View Orders", desc: `${stats?.totalOrders || 0} total transactions`, tab: "orders", icon: ShoppingCart, color: "bg-emerald-50 text-emerald-700 border-emerald-100" },
        ].map(q => (
          <button key={q.tab} onClick={() => setActiveTab(q.tab)} className={`flex items-center gap-4 p-5 rounded-2xl border text-left hover:shadow-md transition-all ${q.color}`}>
            <q.icon size={22} />
            <div><p className="font-black text-[13px]">{q.label}</p><p className="text-[10px] font-bold opacity-70 mt-0.5">{q.desc}</p></div>
          </button>
        ))}
      </div>
    </div>
  );
}
