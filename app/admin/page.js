"use client";

import { useState, useEffect, Suspense } from "react";
import { Menu, RefreshCw, ChevronRight, Bell, X } from "lucide-react";
import { API_URL, API_BASE_URL, getNotifications, markNotificationAsRead, markAllNotificationsAsRead } from "../../services/api";
import { useSearchParams } from "next/navigation";
import socket from "../../services/socket";

import AdminSidebar from "../../components/AdminSidebar";
import Overview from "./components/Overview";
import UserTab from "./components/UserTab";
import ProductTab from "./components/ProductTab";
import { OrdersTab, ChatsTab, ReportsTab, EscrowTab } from "./components/OtherTabs";
import SettingsTab from "./components/SettingsTab";

const TAB_LABELS = {
  overview: "Dashboard",
  users: "User Management",
  products: "Listings & Approvals",
  orders: "Orders",
  escrow: "Escrow & Payouts",
  reports: "Reports & Complaints",
  chats: "Chats & Messages",
  settings: "Platform Protocol",
};

function AdminPageContent() {
  const [activeTab, setActiveTab] = useState("overview");
  const searchParams = useSearchParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminUser, setAdminUser] = useState(null);

  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState({ users: [], products: [], orders: [] });
  const [analyticsRange, setAnalyticsRange] = useState("30");
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [escrowDeals, setEscrowDeals] = useState([]);
  const [chats, setChats] = useState([]);
  const [reports, setReports] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabLoading, setTabLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // Notification State
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  
  // Chat History Modal State
  const [selectedChat, setSelectedChat] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const getHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("token")}`,
    "Content-Type": "application/json",
  });

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Handle Tab Deep-linking
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && TAB_LABELS[tab]) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  // Init
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { window.location.href = "/login"; return; }
    
    try {
      const u = JSON.parse(localStorage.getItem("user") || "null");
      if (!u || u.role !== "admin") {
        window.location.href = "/login";
        return;
      }
      setAdminUser(u);
    } catch (e) {
      window.location.href = "/login";
      return;
    }
    
    setLoading(true);
    Promise.all([fetchStats(), fetchAnalytics(), fetchCategories(), fetchNotifications()]).then(() => {
        const u = JSON.parse(localStorage.getItem("user") || "{}");
        if (u.id) fetchUnreadMessagesCount(u.id);
    }).finally(() => setLoading(false));

    // Socket listeners
    const handleNewNotification = (notification) => {
      setNotifications(prev => [notification, ...prev]);
      setUnreadNotificationsCount(prev => prev + 1);
    };

    socket.on("newNotification", handleNewNotification);
    
    // Join private room if user available
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const u = JSON.parse(storedUser);
        socket.emit("joinUser", u.id);
      } catch (e) {}
    }

    return () => {
      socket.off("newNotification", handleNewNotification);
    };
  }, []);

  useEffect(() => { fetchAnalytics(); }, [analyticsRange]);

  useEffect(() => {
    if (activeTab === "users" && users.length === 0) fetchUsers();
    if (activeTab === "products" && products.length === 0) fetchProducts();
    if (activeTab === "orders" && orders.length === 0) fetchOrders();
    if (activeTab === "escrow" && escrowDeals.length === 0) fetchEscrowDeals();
    if (activeTab === "chats" && chats.length === 0) fetchChats();
    if (activeTab === "reports" && reports.length === 0) fetchReports();
  }, [activeTab]);

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/stats`, { headers: getHeaders() });
      const d = await res.json();
      if (!res.ok) { if (res.status === 401 || res.status === 403) handleLogout(); return; }
      setStats(d);
    } catch {}
  };

  const fetchAnalytics = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/analytics?range=${analyticsRange}`, { headers: getHeaders() });
      const d = await res.json();
      if (res.ok) setAnalytics(d);
    } catch {}
  };

  const fetchUnreadMessagesCount = async (userId) => {
    try {
      const res = await fetch(`${API_URL}/chats/unread-count/${userId}`, { headers: getHeaders() });
      if (res.ok) {
        const d = await res.json();
        setUnreadMessagesCount(d.total || 0);
      }
    } catch {}
  };

  const fetchUsers = async () => {
    setTabLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/users`, { headers: getHeaders() });
      const d = await res.json();
      setUsers(Array.isArray(d) ? d : []);
    } catch { showToast("Failed to load users", "error"); }
    finally { setTabLoading(false); }
  };

  const fetchProducts = async () => {
    setTabLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/products`, { headers: getHeaders() });
      const d = await res.json();
      setProducts(Array.isArray(d) ? d : []);
    } catch { showToast("Failed to load products", "error"); }
    finally { setTabLoading(false); }
  };

  const fetchOrders = async () => {
    setTabLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/orders`, { headers: getHeaders() });
      const d = await res.json();
      setOrders(Array.isArray(d) ? d : []);
    } catch { showToast("Failed to load orders", "error"); }
    finally { setTabLoading(false); }
  };

  const fetchEscrowDeals = async () => {
    setTabLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/escrow`, { headers: getHeaders() });
      const d = await res.json();
      setEscrowDeals(Array.isArray(d) ? d : []);
    } catch { showToast("Failed to load escrow data", "error"); }
    finally { setTabLoading(false); }
  };

  const fetchChats = async () => {
    setTabLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/chats`, { headers: getHeaders() });
      const d = await res.json();
      setChats(Array.isArray(d) ? d : []);
    } catch { showToast("Failed to load chats", "error"); }
    finally { setTabLoading(false); }
  };

  const fetchReports = async () => {
    setTabLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/reports`, { headers: getHeaders() });
      const d = await res.json();
      setReports(Array.isArray(d) ? d : []);
    } catch { showToast("Failed to load reports", "error"); }
    finally { setTabLoading(false); }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_URL}/products/categories`);
      const d = await res.json();
      setCategories(Array.isArray(d) ? d : []);
    } catch {}
  };

  const fetchNotifications = async () => {
    try {
      const data = await getNotifications();
      if (Array.isArray(data)) {
        setNotifications(data);
        setUnreadNotificationsCount(data.filter(n => !n.is_read).length);
      }
    } catch (err) { console.error("Notifications fetch error:", err); }
  };

  const handleMarkRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await markNotificationAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadNotificationsCount(prev => Math.max(0, prev - 1));
    } catch (err) { console.error(err); }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadNotificationsCount(0);
    } catch (err) { console.error(err); }
  };

  const updateProductStatus = async (id, status, reason = "") => {
    // Optimistic update
    const oldProducts = [...products];
    setProducts(prev => prev.map(p => p.id === id ? { ...p, status, rejection_reason: status === 'rejected' ? reason : p.rejection_reason } : p));
    
    try {
      const res = await fetch(`${API_URL}/admin/products/${id}`, {
        method: "PATCH", 
        headers: getHeaders(), 
        body: JSON.stringify({ status, reason }),
      });
      if (!res.ok) throw new Error("Update failed");
      showToast(`Listing ${status} successfully`);
      fetchStats();
    } catch (e) { 
      setProducts(oldProducts); // Rollback
      showToast(e.message, "error"); 
    }
  };

  const deleteProductAdmin = async (id) => {
    try {
      const res = await fetch(`${API_URL}/admin/products/${id}`, { method: "DELETE", headers: getHeaders() });
      if (!res.ok) throw new Error("Delete failed");
      showToast("Product deleted");
      fetchProducts(); fetchStats();
    } catch (e) { showToast(e.message, "error"); }
  };

  const resolveReport = async (id) => {
    try {
      const res = await fetch(`${API_URL}/admin/reports/${id}`, {
         method: "PATCH",
         headers: getHeaders(),
         body: JSON.stringify({ status: "resolved", admin_notes: "Resolved by admin" })
      });
      if (!res.ok) throw new Error("Failed to resolve report");
      showToast("Report marked as resolved");
      fetchReports();
    } catch (e) { showToast(e.message, "error"); }
  };

  const toggleUserStatus = async (id, isActive) => {
    try {
      const res = await fetch(`${API_URL}/admin/users/${id}/status`, {
        method: "PATCH", headers: getHeaders(), body: JSON.stringify({ is_active: !isActive }),
      });
      if (!res.ok) throw new Error("Status update failed");
      showToast(`User ${!isActive ? "activated" : "suspended"}`);
      fetchUsers();
    } catch (e) { showToast(e.message, "error"); }
  };

  const deleteUser = async (id) => {
    try {
      const res = await fetch(`${API_URL}/admin/users/${id}`, { method: "DELETE", headers: getHeaders() });
      if (!res.ok) throw new Error("Delete failed");
      showToast("User deleted");
      fetchUsers(); fetchStats();
    } catch (e) { showToast(e.message, "error"); }
  };
  const resolveDealAdmin = async (id, status) => {
    try {
      const res = await fetch(`${API_URL}/admin/deals/${id}/resolve`, {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify({ status, resolution_notes: "Action taken by administrator" })
      });
      if (!res.ok) throw new Error("Resolution failed");
      showToast(`Deal #${id} resolved as ${status.toUpperCase()}`);
      fetchOrders(); fetchStats();
    } catch (e) { showToast(e.message, "error"); }
  };

  const releasePayoutAdmin = async (id) => {
    if (!confirm("Are you sure you want to release this payout? This action is irreversible.")) return;
    try {
      const res = await fetch(`${API_URL}/admin/deals/${id}/release-payout`, {
        method: "PATCH",
        headers: getHeaders()
      });
      if (!res.ok) throw new Error("Payout release failed");
      showToast("Payout released successfully");
      fetchEscrowDeals(); fetchStats();
    } catch (e) { showToast(e.message, "error"); }
  };

  const openChatHistory = async (chat) => {
    setSelectedChat(chat);
    setHistoryLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/chats/${chat.id}/messages`, { headers: getHeaders() });
      const d = await res.json();
      setChatMessages(Array.isArray(d) ? d : []);
    } catch { showToast("Failed to load chat history", "error"); }
    finally { setHistoryLoading(false); }
  };

  const refreshAll = () => {
    if (activeTab === "orders") fetchOrders();
    if (activeTab === "reports") fetchReports();
    if (activeTab === "chats") fetchChats();
    showToast("Data refreshed");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="flex flex-col items-center gap-5">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-gray-100"/>
            <div className="absolute inset-0 rounded-full border-4 border-[#1e3a5f] border-t-transparent animate-spin"/>
          </div>
          <div className="text-center">
            <p className="text-[13px] font-black text-gray-900">WatchCollectorHUB</p>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Loading Admin Panel...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex bg-[#f8fafc] min-h-screen text-gray-900 font-sans antialiased">
      <AdminSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        adminUser={adminUser}
        onLogout={handleLogout}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        unreadMessagesCount={unreadMessagesCount}
      />

      <div className="flex-grow lg:ml-64 min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-100 flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 bg-gray-50 rounded-xl text-gray-700 hover:bg-gray-100 transition-all">
              <Menu size={20}/>
            </button>
            <nav className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest">
              <span className="text-gray-400">Admin</span>
              <ChevronRight size={10} className="text-gray-300"/>
              <span className="text-[#1e3a5f]">{TAB_LABELS[activeTab] || activeTab}</span>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            {stats?.pendingVerifications > 0 && (
              <button onClick={() => setActiveTab("products")} className="hidden sm:flex items-center gap-2 px-3 py-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-100 transition-all">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"/>
                {stats.pendingVerifications} Pending
              </button>
            )}

            {/* Notification Bell */}
            <div className="relative">
              <button 
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className={`p-2.5 rounded-xl border transition-all relative ${
                  notificationsOpen 
                    ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]' 
                    : 'bg-white text-gray-400 border-gray-100 hover:border-gray-200 hover:text-gray-600'
                }`}
              >
                <Bell size={18}/>
                {unreadNotificationsCount > 0 && (
                  <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full"></span>
                )}
              </button>

              {notificationsOpen && (
                <>
                  <div className="fixed inset-0 z-[110]" onClick={() => setNotificationsOpen(false)}></div>
                  <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-[120] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                      <h3 className="font-black text-gray-900 text-[10px] uppercase tracking-widest">Notifications</h3>
                      {unreadNotificationsCount > 0 && (
                        <button onClick={handleMarkAllRead} className="text-[10px] font-black text-[#1e3a5f] hover:underline uppercase tracking-tight">Mark all read</button>
                      )}
                    </div>
                    <div className="max-h-[400px] overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-10 text-center">
                          <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Bell className="text-gray-200" size={20}/>
                          </div>
                          <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">No Alerts</p>
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div 
                            key={n.id} 
                            onClick={() => {
                              handleMarkRead(n.id);
                              if (n.link) setActiveTab(n.link.startsWith('/admin/') ? n.link.replace('/admin/', '') : n.link);
                              setNotificationsOpen(false);
                            }}
                            className={`p-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors relative ${!n.is_read ? 'bg-blue-50/30' : ''}`}
                          >
                            <div className="flex gap-3">
                              <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${!n.is_read ? 'bg-[#1e3a5f]' : 'bg-transparent'}`}></div>
                              <div className="flex-1 min-w-0">
                                <p className="font-black text-gray-900 text-[11px] mb-1 uppercase tracking-tight">{n.title}</p>
                                <p className="text-gray-500 text-[11px] leading-relaxed line-clamp-2 font-medium">{n.message}</p>
                                <p className="text-[9px] text-gray-400 mt-2 uppercase font-black tracking-widest">
                                  {new Date(n.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            <button onClick={refreshAll} className="flex items-center gap-2 px-3 py-2.5 bg-[#1e3a5f] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#2e538a] transition-all">
              <RefreshCw size={13}/>
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="p-6 lg:p-8 max-w-[1400px] mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-black text-gray-900">{TAB_LABELS[activeTab]}</h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">WatchCollectorHUB Admin Panel · Full Access</p>
          </div>

          {activeTab === "overview" && (
            <Overview
              stats={stats}
              analytics={analytics}
              analyticsRange={analyticsRange}
              setAnalyticsRange={setAnalyticsRange}

              setActiveTab={setActiveTab}
              fetchStats={fetchStats}
              fetchAnalytics={fetchAnalytics}
              showToast={showToast}
            />
          )}

          {activeTab === "users" && (
            <UserTab
              users={users}
              tabLoading={tabLoading}
              API_BASE_URL={API_BASE_URL}
              API_URL={API_URL}
              getHeaders={getHeaders}
              toggleUserStatus={toggleUserStatus}
              deleteUser={deleteUser}
              showToast={showToast}
            />
          )}

          {activeTab === "products" && (
            <ProductTab
              products={products}
              tabLoading={tabLoading}
              API_BASE_URL={API_BASE_URL}
              API_URL={API_URL}
              getHeaders={getHeaders}
              updateProductStatus={updateProductStatus}
              deleteProduct={deleteProductAdmin}
              showToast={showToast}
            />
          )}

          {activeTab === "orders" && (
            <OrdersTab orders={orders} tabLoading={tabLoading} onResolve={resolveDealAdmin} API_BASE_URL={API_BASE_URL}/>
          )}

          {activeTab === "escrow" && (
            <EscrowTab escrowDeals={escrowDeals} tabLoading={tabLoading} onRelease={releasePayoutAdmin} API_BASE_URL={API_BASE_URL}/>
          )}

          {activeTab === "reports" && (
            <ReportsTab reports={reports} onResolve={resolveReport} tabLoading={tabLoading}/>
          )}

          {activeTab === "chats" && (
            <ChatsTab chats={chats} tabLoading={tabLoading} onOpenHistory={openChatHistory}/>
          )}

          {activeTab === "settings" && <SettingsTab />}
        </main>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-8 right-6 z-[200] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl text-[11px] font-black uppercase tracking-widest animate-in slide-in-from-right-10 duration-300 ${
          toast.type === "error" ? "bg-white border-2 border-rose-500 text-rose-600" : "bg-[#1e3a5f] text-white"
        }`}>
          <div className={`w-2 h-2 rounded-full ${toast.type === "error" ? "bg-rose-500" : "bg-[#b8860b]"} animate-pulse`}/>
          {toast.message}
        </div>
      )}

      {/* Chat History Modal */}
      {selectedChat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedChat(null)}/>
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-[#1e3a5f] p-6 text-white flex justify-between items-center">
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest">Audit Conversation #{selectedChat.id}</h3>
                <p className="text-[10px] font-bold text-white/60 uppercase mt-0.5">{selectedChat.product_title}</p>
              </div>
              <button onClick={() => setSelectedChat(null)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                <X size={20}/>
              </button>
            </div>
            <div className="p-6 h-[450px] overflow-y-auto bg-gray-50/50 space-y-4">
              {historyLoading ? (
                <div className="flex flex-col items-center justify-center h-full gap-3">
                  <RefreshCw className="animate-spin text-[#1e3a5f]" size={24}/>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Loading secure logs...</p>
                </div>
              ) : chatMessages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-[11px] font-black text-gray-300 uppercase tracking-widest">No messages in this audit log</p>
                </div>
              ) : (
                chatMessages.map((m, i) => (
                  <div key={m.id || i} className={`flex flex-col ${m.sender_id === selectedChat.buyer_id ? "items-start" : "items-end"}`}>
                     <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 px-1">
                        {m.sender_name || (m.sender_id === selectedChat.buyer_id ? "Buyer" : "Seller")}
                     </span>
                     <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-[12px] font-semibold leading-relaxed shadow-sm ${
                        m.sender_id === selectedChat.buyer_id 
                        ? "bg-white text-gray-800 border-l-4 border-[#1e3a5f]" 
                        : "bg-[#1e3a5f] text-white border-r-4 border-[#b8860b]"
                     }`}>
                        {m.message}
                     </div>
                     <span className="text-[9px] font-bold text-gray-300 mt-1.5 px-1 uppercase tracking-tight">
                        {new Date(m.created_at).toLocaleString()}
                     </span>
                  </div>
                ))
              )}
            </div>
            <div className="p-4 bg-white border-t border-gray-100 flex justify-end">
              <button onClick={() => setSelectedChat(null)} className="px-6 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 transition-all">
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="flex flex-col items-center gap-5">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-gray-100"/>
            <div className="absolute inset-0 rounded-full border-4 border-[#1e3a5f] border-t-transparent animate-spin"/>
          </div>
          <div className="text-center">
            <p className="text-[13px] font-black text-gray-900">WatchCollectorHUB</p>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Initializing Admin Panel...</p>
          </div>
        </div>
      </div>
    }>
      <AdminPageContent />
    </Suspense>
  );
}
