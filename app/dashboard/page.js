"use client";

import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import { API_URL } from "../../services/api";

export default function Dashboard() {
  const [stats, setStats] = useState({ listings: 0, orders: 0, revenue: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userString = localStorage.getItem("user");
    if (!userString) {
      setLoading(false);
      return;
    }
    
    let user;
    try {
      user = JSON.parse(userString);
    } catch (e) {
      setLoading(false);
      return;
    }

    if (!user.id) {
      setLoading(false);
      return;
    }

    // Attempt to fetch actual stats from backend
    fetch(`${API_URL}/admin/stats`)
      .then(res => res.json())
      .then(data => {
        if (data && !data.error) {
          setStats({
            listings: data.totalProducts || 0,
            orders: data.totalOrders || 0,
            revenue: data.totalRevenue || 0
          });
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Dashboard stats fetch error:", err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="bg-[#fafafa] min-h-screen flex flex-col">
      <Navbar />
      
      <main className="max-w-[1300px] mx-auto px-4 py-8 w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Seller Dashboard</h1>
            <p className="text-gray-500 font-medium text-sm mt-1">Manage your inventory and track performance.</p>
          </div>
          <div className="flex gap-3">
            <button className="px-5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 transition">Export Report</button>
            <button 
              onClick={() => window.location.href = '/sell'}
              className="px-5 py-2.5 bg-[#1e3a5f] text-white rounded-xl text-xs font-bold hover:bg-blue-800 transition shadow-lg shadow-blue-900/10"
            >
              Add New Listing
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-white rounded-2xl border border-gray-100 animate-pulse shadow-sm" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-8 bg-white rounded-2xl border border-gray-100 shadow-sm border-b-4 border-b-[#1e3a5f]">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] block mb-2">My Active Listings</span>
              <div className="flex items-baseline gap-2">
                <h2 className="text-4xl font-black text-[#1e3a5f]">{stats.listings}</h2>
                <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">+12%</span>
              </div>
            </div>

            <div className="p-8 bg-white rounded-2xl border border-gray-100 shadow-sm border-b-4 border-b-[#b8860b]">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] block mb-2">Total Sales Orders</span>
              <div className="flex items-baseline gap-2">
                <h2 className="text-4xl font-black text-[#b8860b]">{stats.orders}</h2>
                <span className="text-xs font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">Stable</span>
              </div>
            </div>

            <div className="p-8 bg-white rounded-2xl border border-gray-100 shadow-sm border-b-4 border-b-green-600">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] block mb-2">Gross Revenue</span>
              <div className="flex items-baseline gap-2">
                <h2 className="text-4xl font-black text-green-600">₹{Number(stats.revenue).toLocaleString()}</h2>
                <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">+₹4,500</span>
              </div>
            </div>
          </div>
        )}

        <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                    Recent Activity
                </h3>
                <div className="space-y-6">
                    {[1,2,3].map(i => (
                        <div key={i} className="flex gap-4 pb-4 border-b border-gray-50 last:border-0">
                            <div className="w-10 h-10 rounded-full bg-blue-50 flex-shrink-0 flex items-center justify-center text-blue-600 font-bold text-xs">#{i}</div>
                            <div>
                                <p className="text-xs font-bold text-gray-900 leading-tight">New offer received for Omega Speedmaster</p>
                                <p className="text-[10px] font-medium text-gray-400 mt-1 uppercase tracking-wider">2 hours ago</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            
            <div className="bg-[#1e3a5f] p-10 rounded-2xl shadow-xl relative overflow-hidden group">
                <div className="relative z-10">
                    <h3 className="text-white font-black text-2xl mb-4 leading-tight">Professional Seller<br/>Tools & Verification</h3>
                    <p className="text-blue-100/60 text-sm font-medium mb-8 max-w-[240px] leading-relaxed">Upgrade your account to access bulk listings and lower transaction fees.</p>
                    <button className="px-6 py-3 bg-white text-[#1e3a5f] rounded-xl font-bold text-xs hover:bg-blue-50 transition shadow-lg">Verify Account</button>
                </div>
                <div className="absolute -right-8 -bottom-8 opacity-20 transform rotate-12 transition-transform duration-700 group-hover:rotate-6">
                    <svg className="w-48 h-48 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/></svg>
                </div>
            </div>
        </div>
      </main>
    </div>
  );
}