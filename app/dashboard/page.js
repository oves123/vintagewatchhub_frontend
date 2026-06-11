"use client";

import { useEffect, useState, useMemo } from "react";
import Breadcrumbs from "../../components/Breadcrumbs";
import Navbar from "../../components/Navbar";
import { getUserDeals, getUserReports, getUserActivity, API_URL } from "../../services/api";
import { TrendingUp, Package, DollarSign, Clock, AlertTriangle, BarChart3, Eye, Heart, MessageSquare } from "lucide-react";
import { useRouter } from "next/navigation";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from "recharts";
import Link from "next/link";
import EmptyState from "../../components/EmptyState";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [deals, setDeals] = useState([]);
  const [reports, setReports] = useState([]);
  const [activity, setActivity] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) { setLoading(false); return; }
    let parsed;
    try { parsed = JSON.parse(storedUser); } catch { setLoading(false); return; }
    setUser(parsed);

    const token = localStorage.getItem("token");

    Promise.allSettled([
      getUserDeals(parsed.id),
      getUserReports(parsed.id, new Date().getFullYear()),
      getUserActivity(parsed.id),
      fetch(`${API_URL}/products?seller_id=${parsed.id}`, {
        headers: { ...(token ? { "Authorization": `Bearer ${token}` } : {}) }
      }).then(r => r.json())
    ]).then(([d, r, a, p]) => {
      if (d.status === "fulfilled") setDeals(Array.isArray(d.value) ? d.value : []);
      if (r.status === "fulfilled") setReports(Array.isArray(r.value) ? r.value : []);
      if (a.status === "fulfilled") setActivity(Array.isArray(a.value) ? a.value : []);
      if (p.status === "fulfilled") {
        const data = p.value;
        setProducts(Array.isArray(data) ? data : (data.products || []));
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const analytics = useMemo(() => {
    const activeListings = products.filter(p => p.status !== 'sold' && p.status !== 'rejected').length;
    const soldCount = deals.filter(d => d.status === 'CONFIRMED').length;
    const pendingShipments = deals.filter(d => d.status === 'PAID' && !d.shipped_at).length;
    const pendingOffers = deals.filter(d => d.status === 'OFFER_PENDING').length;
    const totalPayout = deals.filter(d => d.status === 'CONFIRMED').reduce((sum, d) => sum + parseFloat(d.seller_payout || d.total_amount || 0), 0);
    const totalViews = products.reduce((sum, p) => sum + (p.view_count || 0), 0);
    const totalWatchlisted = products.reduce((sum, p) => sum + (p.watchlist_count || 0), 0);
    const thisMonth = new Date().getMonth();
    const monthlyRevenue = deals
      .filter(d => d.status === 'CONFIRMED' && new Date(d.updated_at).getMonth() === thisMonth)
      .reduce((sum, d) => sum + parseFloat(d.seller_payout || d.total_amount || 0), 0);
    return { activeListings, soldCount, pendingShipments, pendingOffers, totalPayout, totalViews, totalWatchlisted, monthlyRevenue, totalDeals: deals.length };
  }, [products, deals]);

  const chartData = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return months.map((m, i) => {
      const monthDeals = deals.filter(d => {
        if (d.status !== 'CONFIRMED') return false;
        const dDate = new Date(d.updated_at);
        return dDate.getMonth() === i && dDate.getFullYear() === new Date().getFullYear();
      });
      return {
        name: m,
        revenue: monthDeals.reduce((sum, d) => sum + parseFloat(d.seller_payout || d.total_amount || 0), 0),
        sales: monthDeals.length
      };
    });
  }, [deals]);

  const topProducts = useMemo(() => {
    return [...products]
      .sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
      .slice(0, 5);
  }, [products]);

  const recentNotifications = useMemo(() => {
    const items = [];
    deals.filter(d => d.status === 'PAID' && !d.shipped_at).forEach(d => {
      items.push({ type: 'ship', text: `Ship "${d.product_title || 'Watch'}" to buyer`, time: 'Action needed', priority: 'high' });
    });
    deals.filter(d => d.status === 'OFFER_PENDING').forEach(d => {
      items.push({ type: 'offer', text: `New offer on "${d.product_title || 'Watch'}"`, time: 'Review needed', priority: 'medium' });
    });
    products.filter(p => p.status === 'pending').forEach(p => {
      items.push({ type: 'pending', text: `"${p.title}" pending admin approval`, time: 'Awaiting review', priority: 'low' });
    });
    return items.sort((a, b) => a.priority === 'high' ? -1 : 1).slice(0, 5);
  }, [deals, products]);

  if (loading) {
    return (
      <div className="bg-background min-h-screen flex flex-col">
        <Navbar />
        <div className="max-w-[1300px] mx-auto px-4 py-20">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
            {[1,2,3,4].map(i => <div key={i} className="h-28 bg-surface border border-border shimmer" />)}
          </div>
          <div className="h-80 bg-surface border border-border shimmer mb-10" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-64 bg-surface border border-border shimmer" />
            <div className="h-64 bg-surface border border-border shimmer" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen flex flex-col">
      <Navbar />

      <main className="max-w-[1300px] mx-auto px-4 py-8 w-full">
        <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Dashboard' }]} />
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="section-title text-3xl">Seller Dashboard</h1>
            <p className="label-engraved mt-1">Track your sales, inventory, and performance</p>
          </div>
          <div className="flex gap-3">
            <Link href="/profile?tab=analytics" className="gold-sweep-outline px-5 py-2.5 text-xs font-bold uppercase tracking-widest">
              <BarChart3 className="w-3.5 h-3.5 mr-1.5 inline-block" />
              Financial Reports
            </Link>
            <Link href="/sell" className="gold-sweep px-5 py-2.5 text-xs font-bold uppercase tracking-widest">
              <Package className="w-3.5 h-3.5 mr-1.5 inline-block" />
              New Listing
            </Link>
          </div>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <div className="bg-background border border-border p-6 card-glow">
            <div className="flex items-center gap-2 text-gold mb-1">
              <Package className="w-4 h-4" />
              <span className="label-engraved">Active Listings</span>
            </div>
            <p className="price-serif text-3xl">{analytics.activeListings}</p>
          </div>
          <div className="bg-background border border-border p-6 card-glow">
            <div className="flex items-center gap-2 text-emerald-600 mb-1">
              <TrendingUp className="w-4 h-4" />
              <span className="label-engraved">Total Sold</span>
            </div>
            <p className="price-serif text-3xl">{analytics.soldCount}</p>
          </div>
          <div className="bg-background border border-border p-6 card-glow">
            <div className="flex items-center gap-2 text-gold-dark mb-1">
              <DollarSign className="w-4 h-4" />
              <span className="label-engraved">Gross Payout</span>
            </div>
            <p className="price-serif text-3xl">₹{analytics.totalPayout.toLocaleString()}</p>
          </div>
          <div className="bg-background border border-border p-6 card-glow">
            <div className="flex items-center gap-2 text-amber-600 mb-1">
              <BarChart3 className="w-4 h-4" />
              <span className="label-engraved">This Month</span>
            </div>
            <p className="price-serif text-3xl">₹{analytics.monthlyRevenue.toLocaleString()}</p>
          </div>
        </div>

        {/* Secondary KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <div className="bg-background border border-border p-4">
            <div className="flex items-center gap-2 text-muted mb-1">
              <Eye className="w-3.5 h-3.5" />
              <span className="text-xs font-bold uppercase tracking-widest">Total Views</span>
            </div>
            <p className="text-lg font-bold text-foreground">{analytics.totalViews}</p>
          </div>
          <div className="bg-background border border-border p-4">
            <div className="flex items-center gap-2 text-muted mb-1">
              <Heart className="w-3.5 h-3.5" />
              <span className="text-xs font-bold uppercase tracking-widest">Watchlist Adds</span>
            </div>
            <p className="text-lg font-bold text-foreground">{analytics.totalWatchlisted}</p>
          </div>
          <div className="bg-background border border-border p-4">
            <div className="flex items-center gap-2 text-muted mb-1">
              <Clock className="w-3.5 h-3.5" />
              <span className="text-xs font-bold uppercase tracking-widest">Pending Ship</span>
            </div>
            <p className="text-lg font-bold text-foreground">{analytics.pendingShipments}</p>
          </div>
          <div className="bg-background border border-border p-4">
            <div className="flex items-center gap-2 text-muted mb-1">
              <MessageSquare className="w-3.5 h-3.5" />
              <span className="text-xs font-bold uppercase tracking-widest">Pending Offers</span>
            </div>
            <p className="text-lg font-bold text-foreground">{analytics.pendingOffers}</p>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
          {/* Revenue Chart */}
          <div className="bg-background border border-border p-6">
            <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-gold rounded-full"></span>
              Revenue Trend
            </h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#d4a853" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#d4a853" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#7c7365' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#7c7365' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#faf8f5', border: '1px solid #e6ddd0', borderRadius: 0, fontSize: 12 }}
                    formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#C2A878" strokeWidth={2} fill="#C2A878" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Sales Chart */}
          <div className="bg-background border border-border p-6">
            <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-gold rounded-full"></span>
              Monthly Sales
            </h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e6ddd0" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#7c7365' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#7c7365' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ background: '#faf8f5', border: '1px solid #e6ddd0', borderRadius: 0, fontSize: 12 }}
                    formatter={(value) => [value, 'Sales']}
                  />
                  <Bar dataKey="sales" fill="#C2A878" stroke="#C2A878" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Products */}
          <div className="bg-background border border-border p-6">
            <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-gold rounded-full"></span>
              Top Performing Listings
            </h3>
            {topProducts.length === 0 ? (
              <EmptyState
                icon={<Package className="w-8 h-8" />}
                title="No listings yet"
                description="Create your first listing to start tracking performance."
                actionLabel="Create Listing"
                actionHref="/sell"
              />
            ) : (
              <div className="space-y-3">
                {topProducts.map((p, i) => (
                  <Link
                    key={p.id}
                    href={`/products/${p.id}`}
                    className="flex items-center gap-3 p-3 hover:bg-surface transition-colors group"
                  >
                    <span className="text-xs font-black text-muted w-5">#{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate group-hover:text-gold transition-colors">{p.title || 'Untitled'}</p>
                      <div className="flex gap-3 mt-1">
                        <span className="text-xs text-muted flex items-center gap-1"><Eye className="w-3 h-3" />{p.view_count || 0}</span>
                        <span className="text-xs text-muted flex items-center gap-1"><Heart className="w-3 h-3" />{p.watchlist_count || 0}</span>
                        <span className="text-xs text-muted">₹{parseFloat(p.price || 0).toLocaleString()}</span>
                      </div>
                    </div>
                    <span className={`text-xs font-bold uppercase px-2 py-0.5 ${
                      p.status === 'approved' ? 'text-emerald-600 bg-emerald-50 border border-emerald-200' :
                      p.status === 'pending' ? 'text-amber-600 bg-amber-50 border border-amber-200' :
                      p.status === 'sold' ? 'text-gold-dark bg-gold/5 border border-gold/20' :
                      'text-muted bg-background border border-border'
                    }`}>{p.status}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Pending Actions */}
          <div className="bg-background border border-border p-6">
            <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
              Pending Actions
            </h3>
            {recentNotifications.length === 0 ? (
              <EmptyState
                icon={
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
                title="All caught up!"
                description="No pending actions require your attention."
              />
            ) : (
              <div className="space-y-2">
                {recentNotifications.map((n, i) => (
                  <div key={i} className={`flex items-start gap-3 p-3 border-l-2 ${
                    n.priority === 'high' ? 'border-l-rose-500 bg-rose-50/30' :
                    n.priority === 'medium' ? 'border-l-amber-500 bg-amber-50/30' :
                    'border-l-muted bg-background'
                  }`}>
                    {n.priority === 'high' ? <AlertTriangle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" /> :
                     n.priority === 'medium' ? <Clock className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" /> :
                     <Package className="w-4 h-4 text-muted mt-0.5 shrink-0" />}
                    <div className="flex-1">
                      <p className="text-sm text-foreground">{n.text}</p>
                      <p className="text-xs text-muted mt-0.5">{n.time}</p>
                    </div>
                    <Link
                      href={n.type === 'ship' ? '/profile?tab=selling' : n.type === 'offer' ? '/profile?tab=selling&sub=negotiations' : '/profile?tab=selling'}
                      className="text-xs text-gold font-bold uppercase tracking-widest hover:underline shrink-0"
                    >
                      View
                    </Link>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4 pt-4 border-t border-border">
              <Link href="/profile?tab=selling" className="text-xs text-gold font-bold uppercase tracking-widest gold-underline">
                Go to Seller Hub →
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
