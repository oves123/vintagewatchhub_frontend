"use client";
import { useMemo } from "react";
import { AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, Users, Package, ShoppingCart } from "lucide-react";

function StatCard({ label, value, sub }: any) {
  return (
    <div className="bg-white rounded border border-gray-300 p-4 shadow-sm">
      <p className="text-sm font-medium text-gray-600 mb-1">{label}</p>
      <p className="text-2xl font-semibold text-gray-900">{value ?? "—"}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}

export default function Overview({ stats, analytics, analyticsRange, setAnalyticsRange, setActiveTab }: any) {
  const chartData = useMemo(() => {
    const m: any = {};
    (analytics.products || []).forEach((p: any) => { m[p.date] = { ...m[p.date], products: +p.count }; });
    (analytics.users || []).forEach((u: any) => { m[u.date] = { ...m[u.date], users: +u.count }; });
    (analytics.orders || []).forEach((o: any) => { m[o.date] = { ...m[o.date], orders: +o.count }; });
    return Object.keys(m).sort().map(d => ({ name: d, products: m[d].products || 0, users: m[d].users || 0, orders: m[d].orders || 0 }));
  }, [analytics]);

  const kpis = [
    { label: "Total Users", value: stats?.totalUsers?.toLocaleString() },
    { label: "Total Buyers", value: stats?.totalBuyers?.toLocaleString() },
    { label: "Active Sellers", value: stats?.activeSellers?.toLocaleString() },
    { label: "Live Listings", value: stats?.liveProducts?.toLocaleString() },
    { label: "Total Orders", value: stats?.totalOrders?.toLocaleString() },
    { label: "Gross Turnover", value: `₹${(stats?.grossTurnover || 0).toLocaleString()}` },
    { label: "Commission Earned", value: `₹${(stats?.commissionEarned || 0).toLocaleString()}` },
    { label: "Pending Payouts", value: `₹${(stats?.pendingPayouts || 0).toLocaleString()}` },
    { label: "Market Value", value: `₹${(stats?.totalValue || 0).toLocaleString()}` },
    { label: "Active Auctions", value: stats?.activeAuctions?.toLocaleString() },
    { label: "Highest Bid", value: `₹${(stats?.highestBid || 0).toLocaleString()}` },
    { label: "Pending Verifications", value: stats?.pendingVerifications?.toLocaleString() },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Quick Actions (eBay style simple links) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Review Listings", desc: `${stats?.pendingVerifications || 0} waiting`, tab: "products", icon: Package },
          { label: "Manage Users", desc: `${stats?.totalUsers || 0} accounts`, tab: "users", icon: Users },
          { label: "View Orders", desc: `${stats?.totalOrders || 0} total`, tab: "orders", icon: ShoppingCart },
          { label: "Pending Payouts", desc: `₹${(stats?.pendingPayouts || 0).toLocaleString()}`, tab: "escrow", icon: TrendingUp },
        ].map(q => (
          <button 
            key={q.tab} 
            onClick={() => setActiveTab(q.tab)} 
            className="flex items-center gap-3 p-4 bg-white border border-gray-300 rounded shadow-sm text-left hover:bg-gray-50 cursor-pointer"
          >
             <div className="text-gray-600"><q.icon size={20} /></div>
             <div>
               <p className="text-sm font-semibold text-gray-900">{q.label}</p>
               <p className="text-xs text-gray-500">{q.desc}</p>
             </div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {kpis.map(k => <StatCard key={k.label} label={k.label} value={k.value} />)}
      </div>

      <div className="bg-white rounded border border-gray-300 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Platform Activity</h3>
          <div className="flex space-x-1">
            {["7","30","90"].map(d => (
              <button key={d} onClick={() => setAnalyticsRange(d)}
                className={`px-3 py-1.5 text-xs font-medium rounded ${analyticsRange === d ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
                {d} Days
              </button>
            ))}
          </div>
        </div>
        
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb"/>
              <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ borderRadius: "4px", border: "1px solid #d1d5db", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}/>
              <Area type="monotone" dataKey="users" stroke="#2563eb" strokeWidth={2} fill="#2563eb" fillOpacity={0.1} />
              <Area type="monotone" dataKey="products" stroke="#10b981" strokeWidth={2} fill="#10b981" fillOpacity={0.1} />
              <Area type="monotone" dataKey="orders" stroke="#f59e0b" strokeWidth={2} fill="#f59e0b" fillOpacity={0.1} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        
        <div className="flex gap-4 mt-4 justify-center">
          {[["#2563eb","Users"],["#10b981","Listings"],["#f59e0b","Orders"]].map(([c,l]) => (
            <div key={l} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded" style={{backgroundColor: c}}></div>
              <span className="text-xs font-medium text-gray-700">{l}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
