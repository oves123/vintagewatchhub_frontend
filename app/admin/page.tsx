"use client";

import { useState, useEffect, Suspense } from "react";
import { Menu, RefreshCw, ChevronRight, Bell, X, Users, ShoppingCart, Package, IndianRupee } from "lucide-react";
import { API_URL, API_BASE_URL, getNotifications, markNotificationAsRead, markAllNotificationsAsRead } from "../../services/api";
import OptimizedImage from "../../components/OptimizedImage";
import { useSearchParams, useRouter } from "next/navigation";
import socket from "../../services/socket";

import AdminSidebar from "../../components/AdminSidebar";
import ConfirmDialog from "../../components/ConfirmDialog";
import Overview from "./components/Overview";
import UserTab from "./components/UserTab";
import ProductTab from "./components/ProductTab";
import { OrdersTab, ChatsTab, ReportsTab, EscrowTab, AuctionsTab, BidsTab, FinancialAuditTab } from "./components/OtherTabs";
import { getAdminFinancialLedger } from "../../services/api";
import SettingsTab from "./components/SettingsTab";
import CategoriesTab from "./components/CategoriesTab";
import AuditLogTab from "./components/AuditLogTab";

const TAB_LABELS = {
  overview: "Dashboard",
  users: "User Management",
  products: "Listings & Approvals",
  orders: "Orders",
  categories: "Categories & Brands",
  escrow: "Escrow & Payouts",
  auctions: "Auction Oversight",
  bids: "Global Bid History",
  disputes: "Dispute Management",
  coupons: "Coupon Engine",
  verification: "Seller Verification",
  featured: "Promotional Tools",
  reports: "Reports & Complaints",
  chats: "Chats & Messages",
  financials: "Financial Audit",
  audit: "Admin Audit Log",
  settings: "Platform Protocol",
};

function AdminPageContent() {
  const [activeTab, setActiveTabState] = useState("overview");
  const [fetchVersion, setFetchVersion] = useState(0);
  const setActiveTab = (tab) => {
    setActiveTabState(tab);
    setFetchVersion(v => v + 1);
  };
  const searchParams = useSearchParams();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminUser, setAdminUser] = useState(null);

  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState({ users: [], products: [], orders: [] });
  const [analyticsRange, setAnalyticsRange] = useState("30");
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [escrowDeals, setEscrowDeals] = useState([]);
  const [auctions, setAuctions] = useState([]);
  const [bids, setBids] = useState([]);
  const [chats, setChats] = useState([]);
  const [reports, setReports] = useState([]);
  const [adminLedger, setAdminLedger] = useState([]);
  const [adminLedgerSummary, setAdminLedgerSummary] = useState(null);
  const [adminLedgerFilters, setAdminLedgerFilters] = useState({
    startDate: "",
    endDate: "",
    status: "ALL",
    search: ""
  });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabLoading, setTabLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // Notification State
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  
  const [confirmDialog, setConfirmDialog] = useState(null);

  // Dispute State
  const [disputes, setDisputes] = useState([]);
  const [disputeFilter, setDisputeFilter] = useState("open");
  const [selectedResolution, setSelectedResolution] = useState("");
  const [resolutionNotes, setResolutionNotes] = useState("");

  // Coupon State
  const [coupons, setCoupons] = useState([]);
  const [showCouponForm, setShowCouponForm] = useState(false);
  const [couponForm, setCouponForm] = useState({ code: "", type: "percentage", value: "", min_cart_value: "", max_uses: "", expires_at: "" });
  const [couponCreating, setCouponCreating] = useState(false);

  // Verification State
  const [verifications, setVerifications] = useState([]);
  const [verifFilter, setVerifFilter] = useState("all");

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

  // ========== DISPUTE HANDLERS ==========
  const loadDisputes = async (status) => {
    try {
      const res = await fetch(`${API_URL}/features/admin/disputes${status && status !== 'all' ? `?status=${status}` : ''}`, { headers: getHeaders() });
      const data = await res.json();
      setDisputes(Array.isArray(data) ? data : []);
    } catch (e) { setDisputes([]); }
  };
  const handleResolveDispute = async (id) => {
    try {
      const res = await fetch(`${API_URL}/features/admin/disputes/${id}/resolve`, {
        method: "PATCH", headers: getHeaders(),
        body: JSON.stringify({ status: selectedResolution, resolution_notes: resolutionNotes, admin_id: adminUser?.id })
      });
      if (res.ok) { showToast("Dispute resolved"); loadDisputes(disputeFilter); setSelectedResolution(""); setResolutionNotes(""); }
    } catch (e) { showToast("Failed to resolve", "error"); }
  };

  // ========== COUPON HANDLERS ==========
  const loadCoupons = async () => {
    try {
      const res = await fetch(`${API_URL}/features/admin/coupons`, { headers: getHeaders() });
      const data = await res.json();
      setCoupons(Array.isArray(data) ? data : []);
    } catch (e) { setCoupons([]); }
  };
  const handleCreateCoupon = async () => {
    if (couponCreating) return;
    setCouponCreating(true);
    try {
      const res = await fetch(`${API_URL}/features/admin/coupons`, {
        method: "POST", headers: getHeaders(), body: JSON.stringify(couponForm)
      });
      if (res.ok) { showToast("Coupon created!"); setShowCouponForm(false); setCouponForm({ code: "", type: "percentage", value: "", min_cart_value: "", max_uses: "", expires_at: "" }); loadCoupons(); }
    } catch (e) { showToast("Failed to create coupon", "error"); }
    finally { setCouponCreating(false); }
  };
  const handleToggleCoupon = async (id, is_active) => {
    try {
      await fetch(`${API_URL}/features/admin/coupons/${id}`, { method: "PATCH", headers: getHeaders(), body: JSON.stringify({ is_active }) });
      loadCoupons();
    } catch (e) { showToast("Failed to update coupon", "error"); }
  };
  const handleDeleteCoupon = async (id) => {
    try {
      await fetch(`${API_URL}/features/admin/coupons/${id}`, { method: "DELETE", headers: getHeaders() });
      loadCoupons();
    } catch (e) { showToast("Failed to delete coupon", "error"); }
  };

  // ========== VERIFICATION HANDLERS ==========
  const loadVerifications = async (status) => {
    try {
      const res = await fetch(`${API_URL}/features/admin/verifications${status && status !== 'all' ? `?status=${status}` : ''}`, { headers: getHeaders() });
      const data = await res.json();
      setVerifications(Array.isArray(data) ? data : []);
    } catch (e) { setVerifications([]); }
  };
  const handleReviewDoc = async (id, status, notes) => {
    try {
      await fetch(`${API_URL}/features/admin/verifications/${id}/review`, {
        method: "PATCH", headers: getHeaders(),
        body: JSON.stringify({ status, admin_notes: notes, reviewed_by: adminUser?.id })
      });
      showToast(`Document ${status}`);
      loadVerifications(verifFilter);
    } catch (e) { showToast("Failed to review", "error"); }
  };

  // ========== FEATURED HANDLERS ==========
  const handleToggleFeatured = async (id, is_featured) => {
    try {
      await fetch(`${API_URL}/features/admin/products/${id}/feature`, {
        method: "PATCH", headers: getHeaders(), body: JSON.stringify({ is_featured })
      });
      showToast(is_featured ? "Product featured!" : "Featured removed");
      fetchProducts();
    } catch (e) { showToast("Failed to update", "error"); }
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
    Promise.all([fetchStats(), fetchCategories(), fetchNotifications()]).then(() => {
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
    let userId = null;
    if (storedUser) {
      try {
        const u = JSON.parse(storedUser);
        userId = u.id;
        socket.emit("joinUser", u.id);
      } catch (e) {
        console.error(e);
      }
    }

    return () => {
      socket.off("newNotification", handleNewNotification);
      if (userId) socket.emit("leaveUser", userId);
    };
  }, []);

  useEffect(() => { fetchAnalytics(); }, [analyticsRange]);

  useEffect(() => {
    if (activeTab === "users") fetchUsers();
    else if (activeTab === "products" || activeTab === "featured") fetchProducts();
    else if (activeTab === "orders") fetchOrders();
    else if (activeTab === "escrow") fetchEscrowDeals();
    else if (activeTab === "chats") fetchChats();
    else if (activeTab === "auctions") fetchAuctions();
    else if (activeTab === "bids") fetchBids();
    else if (activeTab === "reports") fetchReports();
    else if (activeTab === "financials") fetchAdminLedger();
    else if (activeTab === "disputes") loadDisputes("open");
    else if (activeTab === "coupons") loadCoupons();
    else if (activeTab === "verification") loadVerifications("all");
  }, [activeTab, fetchVersion]);

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

  const extractList = (data) => {
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object') {
      const keys = ['users', 'products', 'orders', 'escrow', 'chats', 'auctions', 'bids', 'reports', 'items', 'data', 'results'];
      for (const key of keys) {
        if (Array.isArray(data[key])) return data[key];
      }
    }
    return [];
  };

  const fetchUsers = async () => {
    setTabLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/users`, { headers: getHeaders() });
      if (!res.ok) { const e = await res.json().catch(() => ({})); showToast(e.error || `Failed to load users (${res.status})`, "error"); return; }
      const d = await res.json();
      setUsers(extractList(d));
    } catch { showToast("Failed to load users", "error"); }
    finally { setTabLoading(false); }
  };

  const fetchProducts = async () => {
    setTabLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/products`, { headers: getHeaders() });
      if (!res.ok) { const e = await res.json().catch(() => ({})); showToast(e.error || `Failed to load products (${res.status})`, "error"); return; }
      const d = await res.json();
      setProducts(extractList(d));
    } catch { showToast("Failed to load products", "error"); }
    finally { setTabLoading(false); }
  };

  const fetchOrders = async () => {
    setTabLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/orders`, { headers: getHeaders() });
      if (!res.ok) { const e = await res.json().catch(() => ({})); showToast(e.error || `Failed to load orders (${res.status})`, "error"); return; }
      const d = await res.json();
      setOrders(extractList(d));
    } catch { showToast("Failed to load orders", "error"); }
    finally { setTabLoading(false); }
  };

  const fetchEscrowDeals = async () => {
    setTabLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/escrow`, { headers: getHeaders() });
      if (!res.ok) { const e = await res.json().catch(() => ({})); showToast(e.error || `Failed to load escrow data (${res.status})`, "error"); return; }
      const d = await res.json();
      setEscrowDeals(extractList(d));
    } catch { showToast("Failed to load escrow data", "error"); }
    finally { setTabLoading(false); }
  };

  const fetchChats = async () => {
    setTabLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/chats`, { headers: getHeaders() });
      if (!res.ok) { const e = await res.json().catch(() => ({})); showToast(e.error || `Failed to load chats (${res.status})`, "error"); return; }
      const d = await res.json();
      setChats(extractList(d));
    } catch { showToast("Failed to load chats", "error"); }
    finally { setTabLoading(false); }
  };

  const fetchAuctions = async () => {
    setTabLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/auctions`, { headers: getHeaders() });
      if (!res.ok) { const e = await res.json().catch(() => ({})); showToast(e.error || `Failed to load auctions (${res.status})`, "error"); return; }
      const d = await res.json();
      setAuctions(extractList(d));
    } catch { showToast("Failed to load auctions", "error"); }
    finally { setTabLoading(false); }
  };

  const fetchBids = async () => {
    setTabLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/bids`, { headers: getHeaders() });
      if (!res.ok) { const e = await res.json().catch(() => ({})); showToast(e.error || `Failed to load bid history (${res.status})`, "error"); return; }
      const d = await res.json();
      setBids(extractList(d));
    } catch { showToast("Failed to load bid history", "error"); }
    finally { setTabLoading(false); }
  };

  const fetchReports = async () => {
    setTabLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/reports`, { headers: getHeaders() });
      if (!res.ok) { const e = await res.json().catch(() => ({})); showToast(e.error || `Failed to load reports (${res.status})`, "error"); return; }
      const d = await res.json();
      setReports(extractList(d));
    } catch { showToast("Failed to load reports", "error"); }
    finally { setTabLoading(false); }
  };

  const fetchAdminLedger = async () => {
    setTabLoading(true);
    try {
      const data = await getAdminFinancialLedger(adminLedgerFilters);
      setAdminLedger(data.ledger || []);
      setAdminLedgerSummary(data.summary || null);
    } catch {
      showToast("Failed to load financial ledger", "error");
    } finally {
      setTabLoading(false);
    }
  };

  const downloadAdminLedgerCSV = () => {
    if (adminLedger.length === 0) {
      showToast("No data to export", "error");
      return;
    }

    const headers = [
      "Deal ID", "Date", "Status", "Product", "Buyer", "Seller", 
      "Base Amount", "Shipping", "Platform Fee", "Platform GST", 
      "Total Buyer Paid", "Seller Payout"
    ];

    const rows = adminLedger.map(row => [
      row.id,
      new Date(row.created_at).toLocaleDateString(),
      row.status,
      row.product_title,
      row.buyer_name,
      row.seller_name,
      row.amount,
      row.shipping_fee,
      row.total_platform_fee,
      row.platform_gst_amount,
      row.total_buyer_cost,
      row.seller_payout
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(r => r.map(field => `"${field}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `AeraVintage_Global_Audit_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Audit Report Downloaded");
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

  const handleMarkRead = async (id: any, e?: any) => {
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

  const markHubReceivedAdmin = async (id) => {
    try {
      const res = await fetch(`${API_URL}/admin/deals/${id}/mark-hub-received`, {
        method: "PATCH",
        headers: getHeaders()
      });
      if (!res.ok) throw new Error("Update failed");
      showToast(`Deal #${id} marked as Received at Hub`);
      fetchOrders();
    } catch (e) { showToast(e.message, "error"); }
  };

  const markHubAuthenticatedAdmin = async (id) => {
    try {
      const res = await fetch(`${API_URL}/admin/deals/${id}/mark-hub-authenticated`, {
        method: "PATCH",
        headers: getHeaders()
      });
      if (!res.ok) throw new Error("Update failed");
      showToast(`Deal #${id} marked as Authenticated`);
      fetchOrders();
    } catch (e) { showToast(e.message, "error"); }
  };

  const releasePayoutAdmin = async (id) => {
    setConfirmDialog({
      title: "Release payout?",
      message: "Are you sure you want to release this payout? This action is irreversible.",
      confirmText: "Release Payout",
      variant: "danger",
      onConfirm: async () => {
        try {
          const res = await fetch(`${API_URL}/admin/deals/${id}/release-payout`, {
            method: "PATCH",
            headers: getHeaders()
          });
          if (!res.ok) throw new Error("Payout release failed");
          showToast("Payout released successfully");
          fetchEscrowDeals(); fetchStats();
        } catch (e) { showToast(e.message, "error"); }
      }
    });
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
    if (activeTab === "users") fetchUsers();
    if (activeTab === "products") fetchProducts();
    if (activeTab === "orders") fetchOrders();
    if (activeTab === "reports") fetchReports();
    if (activeTab === "chats") fetchChats();
    showToast("Data refreshed");
  };

  const totalUsers = stats?.totalUsers ?? users.length ?? 0;
  const totalProducts = stats?.totalProducts ?? products.length ?? 0;
  const totalOrders = stats?.totalOrders ?? orders.length ?? 0;
  const rawRevenue = stats?.totalRevenue ?? (Array.isArray(analytics?.orders) ? analytics.orders.reduce((sum, o) => sum + (parseFloat(o.total_amount ?? o.amount ?? 0) || 0), 0) : 0);
  const formatRevenue = (val) => `Rs. ${parseFloat(val || 0).toLocaleString()}`;

  const statCards = [
    { icon: Users, label: "Total Users", value: totalUsers.toLocaleString() },
    { icon: Package, label: "Total Products", value: totalProducts.toLocaleString() },
    { icon: ShoppingCart, label: "Total Orders", value: totalOrders.toLocaleString() },
    { icon: IndianRupee, label: "Total Revenue", value: formatRevenue(rawRevenue) },
  ];

  if (loading || !adminUser) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="flex flex-col items-center gap-5">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-border"/>
            <div className="absolute inset-0 rounded-full border-4 border-[#1e3a5f] border-t-transparent animate-spin"/>
          </div>
          <div className="text-center">
            <p className="text-[13px] font-black text-foreground">AeraVintage</p>
            <p className="text-xs font-bold text-muted uppercase tracking-widest mt-1">{!adminUser ? 'Authenticating...' : 'Loading Admin Panel...'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex bg-[#f8fafc] min-h-screen text-foreground antialiased">
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
        <header className="sticky top-0 z-40 bg-surface/80 backdrop-blur-xl border-b border-border flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 bg-background rounded-lg text-muted hover:bg-background transition-all">
              <Menu size={20}/>
            </button>
            <nav className="flex items-center gap-2 text-sm font-black uppercase tracking-widest">
              <span className="text-muted">Admin</span>
              <ChevronRight size={10} className="text-muted"/>
              <span className="text-primary">{TAB_LABELS[activeTab] || activeTab}</span>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            {stats?.pendingVerifications > 0 && (
              <button onClick={() => setActiveTab("products")} className="hidden sm:flex items-center gap-2 px-3 py-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-amber-100 transition-all">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"/>
                {stats.pendingVerifications} Pending
              </button>
            )}

            {/* Notification Bell */}
            <div className="relative">
              <button 
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className={`p-2.5 rounded-lg border transition-all relative ${
                  notificationsOpen 
                    ? 'bg-primary text-white border-[#1e3a5f]' 
                    : 'bg-surface text-muted border-border hover:border-border hover:text-muted'
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
                  <div className="absolute right-0 mt-3 w-80 bg-surface rounded-xl shadow-2xl border border-border z-[120] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-background/50">
                      <h3 className="font-black text-foreground text-xs uppercase tracking-widest">Notifications</h3>
                      {unreadNotificationsCount > 0 && (
                        <button onClick={handleMarkAllRead} className="text-xs font-black text-primary hover:underline uppercase tracking-tight">Mark all read</button>
                      )}
                    </div>
                    <div className="max-h-[400px] overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center">
                          <p className="text-muted text-sm font-medium">No notifications</p>
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div 
                            key={n.id} 
                            onClick={() => {
                              handleMarkRead(n.id);
                              if (n.link) {
                                if (n.link.startsWith('/admin/')) {
                                  setActiveTab(n.link.replace('/admin/', ''));
                                } else {
                                  router.push(n.link);
                                }
                              }
                              setNotificationsOpen(false);
                            }}
                            className={`p-4 border-b border-gray-50 hover:bg-background cursor-pointer transition-colors relative ${!n.is_read ? 'bg-blue-50/30' : ''}`}
                          >
                            <div className="flex gap-3">
                              <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${!n.is_read ? 'bg-primary' : 'bg-transparent'}`}></div>
                              <div className="flex-1 min-w-0">
                                <p className="font-black text-foreground text-sm mb-1 uppercase tracking-tight">{n.title}</p>
                                <p className="text-muted text-sm leading-relaxed line-clamp-2 font-medium">{n.message}</p>
                                <p className="text-xs text-muted mt-2 uppercase font-black tracking-widest">
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

            <button onClick={refreshAll} className="flex items-center gap-2 px-3 py-2.5 bg-primary text-white rounded-lg text-xs font-black uppercase tracking-widest hover:bg-[#2e538a] transition-all">
              <RefreshCw size={13}/>
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="p-6 lg:p-8 max-w-[1400px] mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground">{TAB_LABELS[activeTab]}</h1>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {statCards.map((card, idx) => (
              <div
                key={idx}
                className="bg-surface border border-border rounded-xl p-6 hover:border-amber-200 hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-amber-100/80 flex items-center justify-center shrink-0">
                    <card.icon size={22} className="text-amber-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-3xl font-bold text-foreground truncate">{card.value}</p>
                    <p className="text-xs font-bold text-muted uppercase tracking-widest">{card.label}</p>
                  </div>
                </div>
              </div>
            ))}
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
            <OrdersTab 
              orders={orders} 
              tabLoading={tabLoading} 
              onResolve={resolveDealAdmin} 
              onMarkHubReceived={markHubReceivedAdmin}
              onMarkHubAuthenticated={markHubAuthenticatedAdmin}
              API_BASE_URL={API_BASE_URL}
            />
          )}

          {activeTab === "categories" && (
            <CategoriesTab
              categories={categories}
              tabLoading={tabLoading}
              API_URL={API_URL}
              getHeaders={getHeaders}
              showToast={showToast}
              onRefresh={fetchCategories}
            />
          )}

          {activeTab === "escrow" && (
            <EscrowTab escrowDeals={escrowDeals} tabLoading={tabLoading} onRelease={releasePayoutAdmin} API_BASE_URL={API_BASE_URL}/>
          )}

          {activeTab === "auctions" && (
            <AuctionsTab auctions={auctions} tabLoading={tabLoading} API_BASE_URL={API_BASE_URL} onOpenBids={(auctionId) => { setActiveTab("bids"); }} />
          )}

          {activeTab === "bids" && (
            <BidsTab bids={bids} tabLoading={tabLoading} />
          )}

          {activeTab === "reports" && (
            <ReportsTab reports={reports} onResolve={resolveReport} tabLoading={tabLoading}/>
          )}

          {activeTab === "chats" && (
            <ChatsTab chats={chats} tabLoading={tabLoading} onOpenHistory={openChatHistory}/>
          )}

          {activeTab === "financials" && (
            <FinancialAuditTab 
              ledger={adminLedger}
              summary={adminLedgerSummary}
              loading={tabLoading}
              onFilter={fetchAdminLedger}
              onDownload={downloadAdminLedgerCSV}
              filters={adminLedgerFilters}
              setFilters={setAdminLedgerFilters}
              API_BASE_URL={API_BASE_URL}
            />
          )}

          {activeTab === "audit" && (
            <AuditLogTab
              API_URL={API_URL}
              getHeaders={getHeaders}
              showToast={showToast}
            />
          )}

          {activeTab === "disputes" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-black text-foreground uppercase tracking-tight">Dispute Management</h2>
                <div className="flex gap-2">
                  {["open", "under_review", "resolved_buyer", "resolved_seller", "cancelled"].map(s => (
                    <button key={s} onClick={() => { setDisputeFilter(s); loadDisputes(s); }} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${disputeFilter === s ? 'bg-primary text-white' : 'bg-surface text-muted hover:bg-background border border-border'}`}>{s.replace('_', ' ')}</button>
                  ))}
                </div>
              </div>
              {disputes.length === 0 ? (
                <div className="p-12 border border-border rounded-xl text-center">
                  <p className="text-sm text-muted font-bold uppercase tracking-widest">No disputes found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {disputes.map(d => (
                    <div key={d.id} className="p-6 border border-border rounded-xl bg-surface hover:bg-background/50 transition-all">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="font-bold text-foreground">Dispute #{d.id} — Deal #{d.deal_id}</p>
                          <p className="text-xs text-muted font-bold mt-1 uppercase tracking-widest">Opened by: {d.opened_by_name} • {new Date(d.created_at).toLocaleDateString()}</p>
                        </div>
                        <span className={`text-xs font-black px-3 py-1 uppercase tracking-widest ${d.status === 'open' ? 'bg-red-50 text-red-500' : d.status === 'under_review' ? 'bg-amber-50 text-amber-500' : 'bg-emerald-50 text-emerald-500'}`}>{d.status}</span>
                      </div>
                      <p className="text-sm font-bold text-muted mb-2">Reason: {d.reason}</p>
                      <p className="text-xs text-muted mb-4">{d.description}</p>
                      {d.status !== 'resolved_buyer' && d.status !== 'resolved_seller' && d.status !== 'cancelled' && (
                        <div className="flex gap-3">
                          <select value={selectedResolution} onChange={e => setSelectedResolution(e.target.value)} className="px-3 py-2 bg-background border border-border rounded-lg text-xs font-bold">
                            <option value="">Resolve as...</option>
                            <option value="resolved_buyer">Resolved — Buyer Wins</option>
                            <option value="resolved_seller">Resolved — Seller Wins</option>
                            <option value="cancelled">Cancel Dispute</option>
                          </select>
                          <input value={resolutionNotes} onChange={e => setResolutionNotes(e.target.value)} placeholder="Resolution notes..." className="px-3 py-2 bg-background border border-border rounded-lg text-xs font-bold flex-1" />
                          <button onClick={() => handleResolveDispute(d.id)} disabled={!selectedResolution} className="px-6 py-2 bg-primary text-white rounded-lg text-xs font-black uppercase tracking-widest disabled:opacity-50">Apply</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "coupons" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-black text-foreground uppercase tracking-tight">Coupon Engine</h2>
                <button onClick={() => setShowCouponForm(!showCouponForm)} className="px-6 py-3 bg-primary text-white rounded-lg text-xs font-black uppercase tracking-widest hover:bg-primary/90">
                  {showCouponForm ? 'Cancel' : 'Create Coupon'}
                </button>
              </div>
              {showCouponForm && (
                <div className="p-6 border border-border rounded-xl bg-surface mb-6">
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <input value={couponForm.code} onChange={e => setCouponForm({...couponForm, code: e.target.value})} placeholder="CODE" className="px-4 py-3 bg-background border border-border rounded-lg text-sm font-bold" />
                    <select value={couponForm.type} onChange={e => setCouponForm({...couponForm, type: e.target.value})} className="px-4 py-3 bg-background border border-border rounded-lg text-sm font-bold">
                      <option value="percentage">Percentage</option>
                      <option value="flat">Flat Amount</option>
                    </select>
                    <input value={couponForm.value} onChange={e => setCouponForm({...couponForm, value: e.target.value})} placeholder="Value" type="number" className="px-4 py-3 bg-background border border-border rounded-lg text-sm font-bold" />
                  </div>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <input value={couponForm.min_cart_value} onChange={e => setCouponForm({...couponForm, min_cart_value: e.target.value})} placeholder="Min Cart Value" type="number" className="px-4 py-3 bg-background border border-border rounded-lg text-sm font-bold" />
                    <input value={couponForm.max_uses} onChange={e => setCouponForm({...couponForm, max_uses: e.target.value})} placeholder="Max Uses" type="number" className="px-4 py-3 bg-background border border-border rounded-lg text-sm font-bold" />
                    <input value={couponForm.expires_at} onChange={e => setCouponForm({...couponForm, expires_at: e.target.value})} placeholder="Expires At (YYYY-MM-DD)" className="px-4 py-3 bg-background border border-border rounded-lg text-sm font-bold" />
                  </div>
                  <button onClick={handleCreateCoupon} disabled={couponCreating} className="px-8 py-3 bg-black text-white rounded-lg text-xs font-black uppercase tracking-widest hover:bg-primary disabled:opacity-50">{couponCreating ? 'Creating...' : 'Create Coupon'}</button>
                </div>
              )}
              {coupons.length === 0 ? (
                <div className="p-12 border border-border rounded-xl text-center">
                  <p className="text-sm text-muted font-bold uppercase tracking-widest">No coupons created</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {coupons.map(c => (
                    <div key={c.id} className="p-4 border border-border rounded-xl bg-surface flex items-center justify-between">
                      <div className="flex items-center gap-6">
                        <span className="font-black text-lg text-primary">{c.code}</span>
                        <span className="text-xs font-bold">{c.type === 'percentage' ? `${c.value}%` : `₹${c.value}`}</span>
                        <span className="text-xs font-bold text-muted">Used: {c.used_count}/{c.max_uses || '∞'}</span>
                        <span className={`text-xs font-bold px-2 py-0.5 ${c.is_active ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50'}`}>{c.is_active ? 'Active' : 'Inactive'}</span>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleToggleCoupon(c.id, !c.is_active)} className="text-xs font-bold text-primary uppercase tracking-widest border-b border-primary/20">{c.is_active ? 'Deactivate' : 'Activate'}</button>
                        <button onClick={() => handleDeleteCoupon(c.id)} className="text-xs font-bold text-rose-500 uppercase tracking-widest">Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "verification" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-black text-foreground uppercase tracking-tight">Seller Verification</h2>
                <div className="flex gap-2">
                  {["all", "pending", "approved", "rejected"].map(s => (
                    <button key={s} onClick={() => { setVerifFilter(s); loadVerifications(s); }} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${verifFilter === s ? 'bg-primary text-white' : 'bg-surface text-muted hover:bg-background border border-border'}`}>{s}</button>
                  ))}
                </div>
              </div>
              {verifications.length === 0 ? (
                <div className="p-12 border border-border rounded-xl text-center">
                  <p className="text-sm text-muted font-bold uppercase tracking-widest">No verification requests</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {verifications.map(v => (
                    <div key={v.id} className="p-6 border border-border rounded-xl bg-surface hover:bg-background/50 transition-all">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="font-bold text-foreground">{v.user_name} <span className="text-muted text-xs font-medium">({v.email})</span></p>
                          <p className="text-xs text-muted font-bold mt-1 uppercase tracking-widest">{v.document_type} • Submitted {new Date(v.submitted_at).toLocaleDateString()}</p>
                        </div>
                        <span className={`text-xs font-black px-3 py-1 uppercase tracking-widest ${v.status === 'pending' ? 'bg-amber-50 text-amber-500' : v.status === 'approved' ? 'bg-emerald-50 text-emerald-500' : 'bg-red-50 text-red-500'}`}>{v.status}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <a href={v.document_url} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-primary underline underline-offset-4">View Document</a>
                        {v.status === 'pending' && (
                          <div className="flex gap-2 ml-auto">
                            <button onClick={() => handleReviewDoc(v.id, 'approved', '')} className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-xs font-black uppercase tracking-widest hover:bg-emerald-600">Approve</button>
                            <button onClick={() => handleReviewDoc(v.id, 'rejected', '')} className="px-4 py-2 bg-red-500 text-white rounded-lg text-xs font-black uppercase tracking-widest hover:bg-red-600">Reject</button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "featured" && (
            <div className="space-y-6">
              <h2 className="text-xl font-black text-foreground uppercase tracking-tight mb-8">Promotional Tools</h2>
              {products.length === 0 ? (
                <div className="p-12 border border-border rounded-xl text-center">
                  <p className="text-sm text-muted font-bold uppercase tracking-widest">No products available</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {products.map(p => (
                    <div key={p.id} className="p-4 border border-border rounded-xl bg-surface flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {p.images?.[0] && <div className="relative w-12 h-12 shrink-0"><OptimizedImage src={p.images[0]} alt={p.title || 'Product image'} fill className="object-cover rounded-lg" size="thumbnail" /></div>}
                        <div>
                          <p className="font-bold text-foreground text-sm">{p.title}</p>
                          <p className="text-xs text-muted font-bold">₹{parseFloat(p.price).toLocaleString()} • {p.status}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-bold px-2 py-0.5 ${p.is_featured ? 'text-amber-600 bg-amber-50' : 'text-muted bg-surface border border-border'}`}>{p.is_featured ? 'Featured' : 'Standard'}</span>
                        <button onClick={() => handleToggleFeatured(p.id, !p.is_featured)} className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest ${p.is_featured ? 'bg-surface text-muted border border-border hover:bg-background' : 'bg-amber-500 text-white hover:bg-amber-600'}`}>
                          {p.is_featured ? 'Remove Featured' : 'Make Featured'}
                        </button>
                        {p.is_featured && p.featured_expires_at && (
                          <span className="text-xs text-muted font-bold">Expires: {new Date(p.featured_expires_at).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "settings" && <SettingsTab />}
        </main>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-8 right-6 z-[200] flex items-center gap-3 px-6 py-4 rounded-lg shadow-2xl text-sm font-bold tracking-wide ${
          toast.type === "error" ? "bg-surface border-2 border-rose-500 text-rose-600" : "bg-primary text-white"
        }`}>
          {toast.message}
        </div>
      )}

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

      {/* Chat History Modal */}
      {selectedChat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedChat(null)}/>
          <div className="relative w-full max-w-2xl bg-surface rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-primary p-6 text-white flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold">Chat #{selectedChat.id}</h3>
                <p className="text-sm text-white/80 mt-0.5">{selectedChat.product_title}</p>
              </div>
              <button onClick={() => setSelectedChat(null)} className="p-2 hover:bg-surface/10 rounded-lg transition-colors">
                <X size={20}/>
              </button>
            </div>
            <div className="p-6 h-[450px] overflow-y-auto bg-background/50 space-y-4">
              {historyLoading ? (
                <div className="flex flex-col items-center justify-center h-full gap-3">
                  <RefreshCw className="animate-spin text-primary" size={24}/>
                  <p className="text-xs font-black text-muted uppercase tracking-widest">Loading secure logs...</p>
                </div>
              ) : chatMessages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm font-black text-muted uppercase tracking-widest">No messages in this audit log</p>
                </div>
              ) : (
                chatMessages.map((m, i) => (
                  <div key={m.id || i} className={`flex flex-col ${m.sender_id === selectedChat.buyer_id ? "items-start" : "items-end"}`}>
                     <span className="text-xs font-black text-muted uppercase tracking-widest mb-1.5 px-1">
                        {m.sender_name || (m.sender_id === selectedChat.buyer_id ? "Buyer" : "Seller")}
                     </span>
                     <div className={`max-w-[85%] px-4 py-3 rounded-lg text-[12px] font-semibold leading-relaxed shadow-sm ${
                        m.sender_id === selectedChat.buyer_id 
                        ? "bg-surface text-foreground border-l-4 border-[#1e3a5f]" 
                        : "bg-primary text-white border-r-4 border-[#b8860b]"
                     }`}>
                        {m.message}
                     </div>
                     <span className="text-xs font-bold text-muted mt-1.5 px-1 uppercase tracking-tight">
                        {new Date(m.created_at).toLocaleString()}
                     </span>
                  </div>
                ))
              )}
            </div>
            <div className="p-4 bg-surface border-t border-border flex justify-end">
              <button onClick={() => setSelectedChat(null)} className="px-6 py-2.5 bg-background text-muted rounded-lg text-xs font-black uppercase tracking-widest hover:bg-gray-200 transition-all">
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
            <div className="absolute inset-0 rounded-full border-4 border-border"/>
            <div className="absolute inset-0 rounded-full border-4 border-[#1e3a5f] border-t-transparent animate-spin"/>
          </div>
          <div className="text-center">
            <p className="text-[13px] font-black text-foreground">AeraVintage</p>
            <p className="text-xs font-bold text-muted uppercase tracking-widest mt-1">Initializing Admin Panel...</p>
          </div>
        </div>
      </div>
    }>
      <AdminPageContent />
    </Suspense>
  );
}
