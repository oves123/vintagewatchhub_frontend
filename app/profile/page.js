"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import Navbar from "../../components/Navbar";
import { getUserProfile, updateUserProfile, getUserActivity, API_BASE_URL, API_URL, getSellerReviews, createReview, markOrderShipped, markOrderDelivered, confirmOrderReceived, confirmOrderSale, cancelDeal, disputeDeal, getUserDeals, markOrderPaid } from "../../services/api";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { X, Camera, CheckCircle, FileText, ExternalLink, Send, Edit2 } from "lucide-react";

function ProfileContent() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [activity, setActivity] = useState({ buyOrders: [], sellOrders: [], listings: [], chattedProducts: [] });
  const [offers, setOffers] = useState([]);
  const [deals, setDeals] = useState([]);
  const [activeTab, setActiveTab] = useState("personal");
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [buyingSubTab, setBuyingSubTab] = useState("active"); // active, shipped, delivered, completed
  const [sellingSubTab, setSellingSubTab] = useState("inventory"); // inventory, deals
  const [paymentReceiptModal, setPaymentReceiptModal] = useState(null); // URL of receipt to preview
  const [receivedReviews, setReceivedReviews] = useState({ reviews: [], stats: { average_rating: 0, review_count: 0 } });
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewForm, setReviewForm] = useState({ order_id: null, seller_id: null, rating: 5, comment: "", product_title: "", product_id: null });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [trackingForm, setTrackingForm] = useState({ order_id: null, tracking_number: "", courier_name: "", packing_video: null });
  const [isSubmittingTracking, setIsSubmittingTracking] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ dealId: null, method: "UPI", receipt: null });
  const [editingTrackingId, setEditingTrackingId] = useState(null);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [toast, setToast] = useState(null); 
  const [counterForm, setCounterForm] = useState({ offerId: null, amount: "" });
  const router = useRouter();

  // Grouped Negotiations Logic - Show only the latest offer per product
  const sellerNegotiations = useMemo(() => {
    if (!Array.isArray(offers)) return [];
    const filtered = offers.filter(o => o.seller_id === user?.id && (!o.deal_status || o.deal_status === 'EXPIRED'));
    const grouped = {};
    filtered.forEach(o => {
      if (!grouped[o.product_id] || grouped[o.product_id].id < o.id) {
        grouped[o.product_id] = o;
      }
    });
    return Object.values(grouped).sort((a, b) => b.id - a.id);
  }, [offers, user?.id]);

  const buyerNegotiations = useMemo(() => {
    if (!Array.isArray(offers)) return [];
    const filtered = offers.filter(o => o.buyer_id === user?.id && (!o.deal_status || o.deal_status === 'EXPIRED'));
    const grouped = {};
    filtered.forEach(o => {
      if (!grouped[o.product_id] || grouped[o.product_id].id < o.id) {
        grouped[o.product_id] = o;
      }
    });
    return Object.values(grouped).sort((a, b) => b.id - a.id);
  }, [offers, user?.id]);
  const searchParams = useSearchParams();

  const isVideo = (filename) => {
    if (!filename) return false;
    const ext = filename.split('.').pop().toLowerCase();
    return ['mp4', 'webm', 'ogg', 'mov'].includes(ext);
  };

  const getImg = (images) => {
    if (!images || !Array.isArray(images) || images.length === 0) {
      return "https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?q=80&w=400&auto=format&fit=crop";
    }
    const firstImage = images.find(img => !isVideo(img));
    const target = firstImage || images[0];
    return target && target.startsWith('http') ? target : `${API_BASE_URL}/uploads/${target}`;
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      router.push("/login?redirect=/profile");
      return;
    }
    const userData = JSON.parse(storedUser);
    setUser(userData);

    const initialTab = searchParams.get("tab");
    if (initialTab) setActiveTab(initialTab);

    const loadData = async () => {
      try {
        const [profData, actData, offersData, dealsData, reviewsData] = await Promise.all([
          getUserProfile(userData.id),
          getUserActivity(userData.id),
          fetch(`${API_URL}/offers/user/${userData.id}`, {
             headers: { 
                "Authorization": `Bearer ${localStorage.getItem("token")}`,
                "Content-Type": "application/json"
             }
          }).then(res => res.ok ? res.json() : []).catch(() => []),
          fetch(`${API_URL}/orders/user-deals/${userData.id}`, {
            headers: { 
               "Authorization": `Bearer ${localStorage.getItem("token")}`
            }
          }).then(res => res.json()).catch(() => []),
          getSellerReviews(userData.id)
        ]);

        setProfile(profData);
        setActivity(actData);
        setOffers(offersData);
        setDeals(dealsData);
        setReceivedReviews(reviewsData);
        setProfileForm({
          name: profData.name || "",
          phone: profData.phone || "",
          city: profData.city || "",
          state: profData.state || "",
          pincode: profData.pincode || "",
          bio: profData.bio || "",
          seller_type: profData.seller_type || "individual",
          gst_number: profData.gst_number || "",
          payment_methods: profData.payment_methods || { upi: "", bank_name: "", account_number: "", ifsc: "" }
        });
      } catch (err) {
        console.error("Failed to fetch profile data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [router, searchParams]);

  const loadActivity = async () => {
    if (user) {
      try {
        const [offersRes, dealsRes, activityRes] = await Promise.all([
          fetch(`${API_URL}/offers/user/${user.id}`, { headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` } }),
          fetch(`${API_URL}/orders/user-deals/${user.id}`, { headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` } }),
          getUserActivity(user.id)
        ]);

        const [offersData, dealsData, activityData] = await Promise.all([
          offersRes.ok ? offersRes.json() : [],
          dealsRes.json(),
          activityRes
        ]);

        setOffers(offersData);
        setDeals(dealsData);
        setActivity(activityData);
      } catch (err) {
        console.error("Failed to reload activity data:", err);
      }
    }
  };

  const [profileForm, setProfileForm] = useState({
    name: "",
    phone: "",
    city: "",
    state: "",
    pincode: "",
    bio: "",
    seller_type: "individual",
    gst_number: "",
    payment_methods: { upi: "", bank_name: "", account_number: "", ifsc: "" }
  });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleProfileUpdate = async (updatedData = null) => {
    setIsUpdating(true);
    try {
      const dataToSend = updatedData || profileForm;
      const res = await updateUserProfile(user.id, dataToSend);
      setProfile(res.user);
      setProfileForm({
        ...profileForm,
        name: res.user.name || "",
        phone: res.user.phone || "",
        city: res.user.city || "",
        state: res.user.state || "",
        pincode: res.user.pincode || "",
        bio: res.user.bio || "",
        seller_type: res.user.seller_type || "individual",
        gst_number: res.user.gst_number || "",
        payment_methods: res.user.payment_methods || { upi: "", bank_name: "", account_number: "", ifsc: "" }
      });
      showToast(updatedData ? "Configuration synchronized." : "Identity updated.");
      return true;
    } catch (err) {
      showToast("Error updating profile. Please try again.", "error");
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveTracking = async (orderId) => {
    if (!trackingForm.tracking_number.trim()) {
      showToast("Please enter a tracking number.", "error");
      return;
    }
    if (!trackingForm.packing_video && (!deals.find(d => d.id === orderId)?.packing_video)) {
      showToast("Packing video is mandatory for shipment.", "error");
      return;
    }

    setIsSubmittingTracking(true);
    try {
      const res = await markOrderShipped(orderId, user.id, {
        tracking_number: trackingForm.tracking_number,
        courier_name: trackingForm.courier_name,
        packing_video: trackingForm.packing_video
      });
      if (res.message) {
        showToast("Shipping updated successfully!");
        setTrackingForm({ order_id: null, tracking_number: "", courier_name: "", packing_video: null });
        setEditingTrackingId(null);
        await loadActivity();
      } else {
        showToast(res.message || "Failed to mark as shipped.", "error");
      }
    } catch (err) {
      showToast("Error updating shipping status.", "error");
    } finally {
      setIsSubmittingTracking(false);
    }
  };

  const handleOfferResponse = async (offerId, status, counter_amount = null) => {
    try {
      const res = await fetch(`${API_URL}/offers/${offerId}/respond`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ status, counter_amount })
      });
      const data = await res.json();
      if (res.ok) {
          showToast(`Offer ${status} successfully.`);
          setCounterForm({ offerId: null, amount: "" });
          loadActivity();
      } else {
          showToast(data.message || "Action failed", "error");
      }
    } catch (err) {
        showToast("Action failure", "error");
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm("Are you sure you want to delete this listing? This action cannot be undone.")) return;
    
    try {
      const res = await fetch(`${API_URL}/products/delete/${productId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      
      const data = await res.json();
      if (res.ok) {
        showToast("Listing deleted successfully.");
        setActivity(prev => ({
          ...prev,
          listings: prev.listings.filter(l => l.id !== productId)
        }));
      } else {
        showToast(data.message || "Failed to delete listing.", "error");
      }
    } catch (err) {
      console.error("Delete error:", err);
      showToast("An error occurred while deleting the listing.", "error");
    }
  };

  const handleMarkAsDelivered = async (orderId) => {
    if (!window.confirm("Confirm that the item has been delivered to the buyer?")) return;
    try {
      const res = await markOrderDelivered(orderId, user.id);
      if (res.message) {
        showToast("Marked as delivered.");
        loadActivity();
      }
    } catch (err) {
      showToast("Error updating delivery status.", "error");
    }
  };

  const handleConfirmPurchase = async (orderId) => {
    if (!window.confirm("Confirm receipt of this item? This will move the deal to DELIVERED state.")) return;
    try {
      const res = await confirmOrderReceived(orderId, user.id);
      if (res.message) {
        showToast("Receipt confirmed. Please verify the item then finalize completion.");
        loadActivity();
        setBuyingSubTab('delivered');
      }
    } catch (err) {
      showToast("Error confirming receipt.", "error");
    }
  };

  const handleMarkAsPaid = async () => {
    if (!paymentForm.method) {
      showToast("Please specify payment method.", "error");
      return;
    }
    
    setIsSubmittingPayment(true);
    try {
      const res = await markOrderPaid(paymentForm.dealId, user.id, paymentForm.method, paymentForm.receipt);
      if (res.deal) {
        showToast("Payment marks as SENT. Seller has been notified.");
        setIsPaymentModalOpen(false);
        setEditingTrackingId(null);
        await loadActivity();
      } else {
        showToast(res.message || "Failed to mark as paid.", "error");
      }
    } catch (err) {
      showToast("Error updating payment status.", "error");
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const handleFinalizeCompletion = async (orderId) => {
    if (!window.confirm("Is the watch exactly as described? Confirming completion finalized the deal and cannot be reversed.")) return;
    try {
      const res = await confirmOrderSale(orderId, user.id);
      if (res.message) {
        showToast("Transaction completed! Enjoy your new piece.");
        loadActivity();
        setBuyingSubTab('completed');
      }
    } catch (err) {
      showToast("Error finalizing completion.", "error");
    }
  };

  const handleCancelDeal = async (orderId) => {
    const reason = window.prompt("Please provide a reason for cancellation:");
    if (reason === null) return;
    if (!reason.trim()) return showToast("Reason is required", "error");

    try {
      const res = await cancelDeal(orderId, user.id, reason);
      if (res.message) {
        showToast("Deal cancelled.");
        loadActivity();
      }
    } catch (err) {
      showToast("Error cancelling deal.", "error");
    }
  };

  const handleDisputeDeal = async (orderId) => {
    const reason = window.prompt("Please explain the issue for the dispute:");
    if (reason === null) return;
    if (!reason.trim()) return showToast("Reason is required", "error");

    try {
      const res = await disputeDeal(orderId, user.id, reason);
      if (res.message) {
        showToast("Dispute raised. Support will review.");
        loadActivity();
      }
    } catch (err) {
      showToast("Error raising dispute.", "error");
    }
  };

  const handleMarkReturned = async (orderId) => {
    const reason = window.prompt("Explain why the item is being returned (e.g. Courier failed, Buyer rejected):");
    if (reason === null) return;
    if (!reason.trim()) return showToast("Reason is required", "error");

    try {
      const { markOrderReturned } = await import("../../services/api");
      const res = await markOrderReturned(orderId, user.id, reason);
      if (res.message) {
        showToast("Order marked as RETURNED. Listing is now active again.");
        loadActivity();
      }
    } catch (err) {
      showToast("Error marking as returned.", "error");
    }
  };

  const getRemainingTime = (expiresAt) => {
    if (!expiresAt) return null;
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry - now;
    if (diff <= 0) return "EXPIRED";
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const openReviewModal = (order) => {
    setReviewForm({
      order_id: order.id,
      seller_id: order.seller_id,
      rating: 5,
      comment: "",
      product_title: order.title,
      product_id: null
    });
    setIsReviewModalOpen(true);
  };

  const submitReview = async () => {
    setIsSubmittingReview(true);
    try {
      const res = await createReview({
        seller_id: reviewForm.seller_id,
        rating: reviewForm.rating,
        comment: reviewForm.comment,
        order_id: reviewForm.order_id || null
      });
      if (res.review) {
        loadActivity();
        setIsReviewModalOpen(false);
        showToast("Review submitted successfully!");
      } else {
        showToast(res.message || "Failed to submit review", "error");
      }
    } catch (err) {
      showToast("Transmission error: " + err.message, "error");
    } finally {
      setIsSubmittingReview(false);
    }
  };


  if (loading) return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="max-w-[1200px] mx-auto px-6 py-12 md:py-20 animate-pulse">
        <div className="w-48 h-10 bg-gray-100 rounded mb-4" />
        <div className="w-64 h-3 bg-gray-50 rounded mb-16" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          <aside className="lg:col-span-3 space-y-6">
             {[1,2,3,4,5].map(i => <div key={i} className="w-32 h-4 bg-gray-100 rounded" />)}
          </aside>
          <div className="lg:col-span-9 space-y-12">
             <div className="w-full h-64 bg-gray-50 rounded-xl" />
             <div className="grid grid-cols-2 gap-8">
                <div className="h-32 bg-gray-50 rounded-xl" />
                <div className="h-32 bg-gray-50 rounded-xl" />
             </div>
          </div>
        </div>
      </main>
    </div>
  );

  const navigation = [
    { id: "personal", label: "My Profile" },
    { id: "buying", label: "Buyer Hub" },
    { id: "selling", label: "Seller Hub" },
    { id: "feedback", label: "Feedback" },
    { id: "security", label: "Security" }
  ];

  return (
    <div className="bg-white min-h-screen pb-24 font-sans text-[#121212]">
      <Navbar />

      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[300] animate-in slide-in-from-top-4 duration-500">
           <div className={`px-8 py-3 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] shadow-xl backdrop-blur-md ${toast.type === 'error' ? 'bg-rose-500 text-white' : 'bg-black/90 text-white'}`}>
              {toast.message}
           </div>
        </div>
      )}


      <main className="max-w-[1200px] mx-auto px-6 py-12 md:py-20">
        
        {/* Header - Minimalist */}
        <div className="mb-16 flex flex-col md:flex-row md:items-center gap-8">
           <div className="w-24 h-24 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm">
              {profile?.profile_image ? (
                <img src={profile.profile_image} alt={profile.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-black text-gray-200 uppercase">{profile?.name?.charAt(0) || 'U'}</span>
              )}
           </div>
           <div>
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 uppercase">My Account</h1>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-3">
                 Member ID: {profile?.id} / Status: {profile?.is_verified ? 'Verified Collector' : 'Standard'}
              </p>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          
          {/* Navigation - Text Only */}
          <aside className="lg:col-span-3">
             <nav className="flex flex-col gap-6 sticky top-32">
                {navigation.map(nav => (
                   <button 
                      key={nav.id}
                      onClick={() => setActiveTab(nav.id)}
                      className={`text-left text-[11px] font-bold uppercase tracking-[0.15em] transition-all pb-2 border-b w-fit ${activeTab === nav.id ? 'text-blue-600 border-blue-600' : 'text-gray-400 border-transparent hover:text-gray-950 hover:border-gray-200'}`}
                   >
                      {nav.label}
                   </button>
                ))}
                
                <div className="mt-20 pt-8 border-t border-gray-100">
                   <p className="text-[9px] font-bold text-gray-300 uppercase tracking-widest mb-4">Account Metadata</p>
                   <div className="space-y-3">
                      <div className="flex justify-between text-[10px] font-bold">
                         <span className="text-gray-400 uppercase">Rating</span>
                         <span>{parseFloat(profile?.rating || 0).toFixed(1)} / 5.0</span>
                      </div>
                      <div className="flex justify-between text-[10px] font-bold">
                         <span className="text-gray-400 uppercase">Joined</span>
                         <span>{profile?.joined_date ? new Date(profile.joined_date).getFullYear() : "2024"}</span>
                      </div>
                   </div>
                </div>
             </nav>
          </aside>

          {/* Content Area */}
          <div className="lg:col-span-9">
             
             {/* Personal Information Tab */}
             {activeTab === "personal" && (
                <div className="animate-in fade-in slide-in-from-left-4 duration-500">
                   <div className="mb-12">
                      <h2 className="text-xl font-bold text-gray-900 uppercase tracking-tight">Identity Details</h2>
                      <p className="text-xs text-gray-400 mt-2 font-medium">Manage your personal collector identity and contact link.</p>
                   </div>

                   <form onSubmit={(e) => { e.preventDefault(); handleProfileUpdate(); }} className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10 max-w-4xl">
                      <div className="space-y-4">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Legal Name</label>
                          <input 
                             type="text" value={profileForm.name}
                             onChange={(e) => setProfileForm({...profileForm, name: e.target.value})}
                             className="w-full border-b border-gray-200 py-3 outline-none text-[13px] font-bold focus:border-blue-600 transition-colors uppercase tracking-tight"
                          />
                      </div>
                      <div className="space-y-4">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Mobile Link</label>
                          <input 
                             type="text" value={profileForm.phone}
                             onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})}
                             className="w-full border-b border-gray-200 py-3 outline-none text-[13px] font-bold focus:border-blue-600 transition-colors"
                          />
                      </div>
                      <div className="space-y-4">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">City</label>
                          <input 
                             type="text" value={profileForm.city}
                             onChange={(e) => setProfileForm({...profileForm, city: e.target.value})}
                             className="w-full border-b border-gray-200 py-3 outline-none text-[13px] font-bold focus:border-blue-600 transition-colors uppercase tracking-tight"
                          />
                      </div>
                      <div className="space-y-4">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">State</label>
                          <input 
                             type="text" value={profileForm.state}
                             onChange={(e) => setProfileForm({...profileForm, state: e.target.value})}
                             className="w-full border-b border-gray-200 py-3 outline-none text-[13px] font-bold focus:border-blue-600 transition-colors uppercase tracking-tight"
                          />
                      </div>
                      <div className="space-y-4">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Pincode</label>
                          <input 
                             type="text" value={profileForm.pincode}
                             onChange={(e) => setProfileForm({...profileForm, pincode: e.target.value})}
                             className="w-full border-b border-gray-200 py-3 outline-none text-[13px] font-bold focus:border-blue-600 transition-colors uppercase tracking-tight"
                          />
                      </div>
                      <div className="md:col-span-2 space-y-4 pt-4">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Collector Biography</label>
                          <textarea 
                             rows="4" value={profileForm.bio}
                             onChange={(e) => setProfileForm({...profileForm, bio: e.target.value})}
                             className="w-full border border-gray-100 bg-gray-50/50 p-6 rounded-lg outline-none text-[13px] font-medium leading-relaxed focus:border-blue-600 focus:bg-white transition-all"
                             placeholder="Briefly describe your watch collection interest..."
                          />
                      </div>

                      <div className="space-y-4 pt-4">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Seller Type</label>
                          <select 
                             value={profileForm.seller_type}
                             onChange={(e) => setProfileForm({...profileForm, seller_type: e.target.value})}
                             className="w-full border-b border-gray-200 py-3 outline-none text-[13px] font-bold focus:border-blue-600 transition-colors uppercase tracking-tight"
                          >
                             <option value="individual">Individual</option>
                             <option value="business">Business</option>
                          </select>
                      </div>

                      <div className="space-y-4 pt-4">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">GST Number (Optional)</label>
                          <input 
                             type="text" value={profileForm.gst_number}
                             onChange={(e) => setProfileForm({...profileForm, gst_number: e.target.value})}
                             className="w-full border-b border-gray-200 py-3 outline-none text-[13px] font-bold focus:border-blue-600 transition-colors uppercase tracking-tight"
                             placeholder="e.g. 22AAAAA0000A1Z5"
                          />
                      </div>

                      <div className="md:col-span-2 mt-12 mb-6 pt-12 border-t border-gray-100">
                          <h2 className="text-xl font-bold text-gray-900 uppercase tracking-tight">Payment Information</h2>
                          <p className="text-xs text-gray-400 mt-2 font-medium">Add payment methods to receive funds from buyers after a successful deal.</p>
                      </div>

                      <div className="space-y-4">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">UPI ID (e.g. name@bank)</label>
                          <input 
                             type="text" value={profileForm.payment_methods?.upi || ""}
                             onChange={(e) => setProfileForm({...profileForm, payment_methods: { ...profileForm.payment_methods, upi: e.target.value }})}
                             className="w-full border-b border-gray-200 py-3 outline-none text-[13px] font-bold focus:border-blue-600 transition-colors"
                             placeholder="Enter UPI ID"
                          />
                      </div>

                      <div className="space-y-4">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Bank Name</label>
                          <input 
                             type="text" value={profileForm.payment_methods?.bank_name || ""}
                             onChange={(e) => setProfileForm({...profileForm, payment_methods: { ...profileForm.payment_methods, bank_name: e.target.value }})}
                             className="w-full border-b border-gray-200 py-3 outline-none text-[13px] font-bold focus:border-blue-600 transition-colors uppercase tracking-tight"
                             placeholder="e.g. HDFC Bank"
                          />
                      </div>

                      <div className="space-y-4">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Account Number</label>
                          <input 
                             type="text" value={profileForm.payment_methods?.account_number || ""}
                             onChange={(e) => setProfileForm({...profileForm, payment_methods: { ...profileForm.payment_methods, account_number: e.target.value }})}
                             className="w-full border-b border-gray-200 py-3 outline-none text-[13px] font-bold focus:border-blue-600 transition-colors"
                             placeholder="Enter Bank Account Number"
                          />
                      </div>

                      <div className="space-y-4">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">IFSC Code</label>
                          <input 
                             type="text" value={profileForm.payment_methods?.ifsc || ""}
                             onChange={(e) => setProfileForm({...profileForm, payment_methods: { ...profileForm.payment_methods, ifsc: e.target.value }})}
                             className="w-full border-b border-gray-200 py-3 outline-none text-[13px] font-bold focus:border-blue-600 transition-colors uppercase tracking-tight"
                             placeholder="Enter Bank IFSC Code"
                          />
                      </div>
                      <div className="md:col-span-2 pt-8">
                          <button 
                             type="submit"
                             disabled={isUpdating}
                             className="bg-black text-white px-12 py-4 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-blue-600 transition-all disabled:bg-gray-200"
                          >
                             {isUpdating ? 'Synchronizing Node...' : 'Update Information'}
                          </button>
                      </div>
                   </form>
                </div>
             )}

              {/* Buyer Hub */}
              {activeTab === "buying" && (
                <div className="animate-in fade-in slide-in-from-left-4 duration-500">
                   <div className="mb-12">
                      <h2 className="text-xl font-bold text-gray-900 uppercase tracking-tight">Buyer Hub</h2>
                      <p className="text-xs text-gray-400 mt-2 font-medium">Tracking your active watch acquisitions and secured state-machine deals.</p>
                   </div>

                   {/* Sub Tabs */}
                   <div className="flex gap-8 border-b border-gray-100 mb-10 overflow-x-auto no-scrollbar">
                      {['active', 'shipped', 'delivered', 'completed', 'negotiations'].map(sub => (
                        <button 
                           key={sub}
                           onClick={() => setBuyingSubTab(sub)}
                           className={`pb-4 text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border-b-2 ${buyingSubTab === sub ? 'text-blue-600 border-blue-600' : 'text-gray-300 border-transparent hover:text-gray-900'}`}
                        >
                           {sub} {
                             sub === 'negotiations' ? (
                                buyerNegotiations.length > 0 && `(${buyerNegotiations.length})`
                             ) :
                             (Array.isArray(deals) && deals.filter(d => d.buyer_id == user.id && (
                               sub === 'active' ? ['ACCEPTED', 'PAID'].includes(d.status) : 
                               sub === 'shipped' ? d.status === 'SHIPPED' : 
                               sub === 'delivered' ? d.status === 'DELIVERED' : 
                               d.status === 'CONFIRMED'
                             )).length > 0 && `(${deals.filter(d => d.buyer_id == user.id && (
                               sub === 'active' ? ['ACCEPTED', 'PAID'].includes(d.status) : 
                               sub === 'shipped' ? d.status === 'SHIPPED' : 
                               sub === 'delivered' ? d.status === 'DELIVERED' : 
                               d.status === 'CONFIRMED'
                             )).length})`)
                           }
                        </button>
                      ))}
                   </div>

                   <div className="space-y-8">
                      {buyingSubTab === 'negotiations' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {buyerNegotiations.length > 0 ? (
                              buyerNegotiations.map(offer => (
                               <div key={offer.id} className="bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-md transition-all">
                                  <div className="flex items-center gap-4 mb-4">
                                     <div className="w-12 h-12 bg-gray-50 rounded-lg overflow-hidden">
                                        {offer.images?.[0] ? <img src={getImg(offer.images)} className="w-full h-full object-cover" alt="watch" /> : <div className="w-full h-full bg-gray-100" />}
                                     </div>
                                     <div className="flex-1 min-w-0">
                                        <h4 className="text-[13px] font-bold uppercase tracking-tight truncate">{offer.title}</h4>
                                        <div className="flex items-center gap-2">
                                           <p className="text-[9px] font-bold text-gray-400 uppercase truncate">To: {offer.seller_name}</p>
                                           {offer.status === 'pending' && offer.expires_at && (
                                             <span className="text-[7px] font-black text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded uppercase">
                                               Expires in: {getRemainingTime(offer.expires_at)}
                                             </span>
                                           )}
                                        </div>
                                     </div>
                                  </div>
                                   <div className="flex justify-between items-end">
                                     <div>
                                        <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">{offer.status === 'countered' ? 'Seller Counter Price' : 'Your bid'}</p>
                                        <p className={`text-md font-black ${offer.status === 'countered' ? 'text-blue-600' : 'text-gray-950'}`}>
                                           ₹{parseFloat(offer.status === 'countered' ? offer.counter_amount : offer.amount).toLocaleString()}
                                        </p>
                                     </div>
                                     <div className="flex flex-col items-end gap-2 w-full mt-4">
                                        {offer.status === 'countered' && (
                                           <div className="flex w-full gap-2 mt-2">
                                              <button onClick={() => handleOfferResponse(offer.id, 'accepted')} className="flex-1 py-2 bg-emerald-600 text-white text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-emerald-700 transition">Accept</button>
                                              <button onClick={() => handleOfferResponse(offer.id, 'declined')} className="flex-1 py-2 bg-rose-50 text-rose-600 text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-rose-100 transition border border-rose-200">Decline</button>
                                           </div>
                                        )}
                                        {offer.chat_id && (
                                           <button 
                                              onClick={() => router.push(`/messages?chat=${offer.chat_id}`)}
                                              className="w-full mt-2 px-6 py-2 bg-black text-white text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-blue-600 transition shadow-lg shadow-gray-100 flex items-center justify-center gap-2"
                                           >
                                              <Send className="w-3 h-3" /> Chat & Negotiate
                                           </button>
                                        )}
                                        {offer.status === 'declined' && <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest text-center w-full mt-2">Declined</p>}
                                        {offer.status === 'rejected' && <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest text-center w-full mt-2">Rejected/Expired</p>}
                                     </div>
                                  </div>

                               </div>
                             ))
                           ) : (
                              <div className="md:col-span-2 py-10 text-center bg-gray-50/50 rounded-2xl border border-gray-100 border-dashed">
                                 <p className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">No pending negotiations</p>
                              </div>
                           )}
                        </div>
                      ) : (
                        deals.filter(d => d.buyer_id == user.id && (
                          buyingSubTab === 'active' ? ['ACCEPTED', 'PAID', 'SHIPPED'].includes(d.status) : 
                          buyingSubTab === 'shipped' ? d.status === 'SHIPPED' : 
                          buyingSubTab === 'delivered' ? d.status === 'DELIVERED' : 
                          d.status === 'CONFIRMED'
                        )).length > 0 ? (
                          deals.filter(d => d.buyer_id == user.id && (
                            buyingSubTab === 'active' ? ['ACCEPTED', 'PAID', 'SHIPPED'].includes(d.status) : 
                            buyingSubTab === 'shipped' ? d.status === 'SHIPPED' : 
                            buyingSubTab === 'delivered' ? d.status === 'DELIVERED' : 
                            d.status === 'CONFIRMED'
                          )).map(deal => (
                            <div key={deal.id} className="border border-gray-100 rounded-2xl p-6 bg-white hover:shadow-xl hover:shadow-gray-100 transition-all flex flex-col md:flex-row gap-8 items-center">
                               <div className="w-20 h-20 bg-gray-50 rounded-xl overflow-hidden flex-shrink-0">
                                  {deal.images?.[0] ? <img src={getImg(deal.images)} className="w-full h-full object-cover" alt="watch" /> : <div className="w-full h-full bg-gray-100" />}
                               </div>
                               <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-1">
                                      <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${
                                        deal.status === 'CONFIRMED' ? 'bg-black text-white' : 
                                        deal.status === 'SHIPPED' ? 'bg-amber-500 text-white' : 
                                        deal.status === 'DELIVERED' ? 'bg-emerald-500 text-white' : 
                                        ['CANCELLED', 'REFUND_PENDING'].includes(deal.status) ? 'bg-rose-500 text-white' : 'bg-blue-500 text-white'
                                      }`}>
                                         {
                                          deal.status === 'PAID' ? '✓ Payment Verified' : 
                                          deal.status === 'SHIPPED' ? 'SHIPPED' :
                                          deal.status === 'DELIVERED' ? 'IN 48H INSPECTION' :
                                          deal.status === 'CONFIRMED' ? 'COMPLETED' :
                                          deal.status === 'ACCEPTED' ? 'ACTION REQUIRED: PAY NOW' : deal.status === 'REFUND_PENDING' ? 'REFUND PENDING' :
                                          deal.status
                                         }
                                      </span>
                                     <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Deal #D-{deal.id}</span>
                                     {deal.payment_status === 'PAID' && (
                                       <span className="text-[8px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded uppercase tracking-widest ml-auto">PAID via {deal.payment_method}</span>
                                     )}
                                  </div>
                                  <h4 className="text-sm font-bold uppercase tracking-tight mb-2">{deal.title}</h4>
                                  <div className="flex flex-col gap-1 mb-4">
                                     <div className="flex items-baseline gap-2">
                                        <span className="text-lg font-black text-gray-950">₹{(parseFloat(deal.amount || 0) + parseFloat(deal.shipping_fee || 0)).toLocaleString()}</span>
                                        <span className="text-[9px] font-bold text-gray-400 uppercase">Total Paid</span>
                                     </div>
                                     <div className="flex items-center gap-3">
                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tight">Item: ₹{parseFloat(deal.amount).toLocaleString()}</p>
                                        {parseFloat(deal.shipping_fee || 0) > 0 && (
                                           <p className="text-[9px] font-bold text-blue-600 uppercase tracking-tight">Shipping: ₹{parseFloat(deal.shipping_fee).toLocaleString()}</p>
                                        )}
                                        <p className="text-[9px] font-medium text-gray-400 uppercase ml-auto">Seller: {deal.seller_name}</p>
                                     </div>
                                  </div>

                                  {/* Buyer Status Timeline */}
                                  {!['CANCELLED', 'REFUND_PENDING'].includes(deal.status) ? (
                                      <div className="flex items-center gap-1 mb-6">
                                     {['ACCEPTED', 'PAID', 'SHIPPED', 'DELIVERED', 'CONFIRMED'].map((s, idx) => {
                                        const statuses = ['ACCEPTED', 'PAID', 'SHIPPED', 'DELIVERED', 'CONFIRMED'];
                                        const currentIdx = statuses.indexOf(deal.status);
                                        const isPast = idx < currentIdx;
                                        const isCurrent = idx === currentIdx;
                                        
                                        return (
                                           <div key={s} className="flex-1 flex flex-col gap-1.5">
                                              <div className={`h-1 rounded-full ${isPast ? 'bg-emerald-500' : isCurrent ? 'bg-blue-600 animate-pulse' : 'bg-gray-100'}`}></div>
                                              <p className={`text-[6px] font-black uppercase tracking-tighter ${isPast ? 'text-emerald-600' : isCurrent ? 'text-blue-600' : 'text-gray-300'}`}>{s}</p>
                                           </div>
                                        );
                                     })}
                                  </div>
                                   ) : (
                                      <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl">
                                         <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-1">Transaction Terminated</p>
                                         <p className="text-[11px] font-bold text-rose-800 leading-tight">{deal.cancel_reason || 'No reason provided.'}</p>
                                      </div>
                                   )}

                                  {deal.payment_status === 'PENDING' && deal.status === 'ACCEPTED' && deal.seller_payment_info && (
                                     <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                                        <p className="text-[9px] font-bold text-gray-950 uppercase tracking-widest mb-3">Seller Payment Details:</p>
                                        <div className="grid grid-cols-2 gap-4">
                                           {deal.seller_payment_info.upi && (
                                              <div>
                                                 <p className="text-[8px] font-black text-gray-400 uppercase">UPI ID</p>
                                                 <p className="text-[10px] font-bold">{deal.seller_payment_info.upi}</p>
                                              </div>
                                           )}
                                           {deal.seller_payment_info.bank_name && (
                                              <div>
                                                 <p className="text-[8px] font-black text-gray-400 uppercase">Bank</p>
                                                 <p className="text-[10px] font-bold">{deal.seller_payment_info.bank_name}</p>
                                              </div>
                                           )}
                                           {deal.seller_payment_info.account_number && (
                                              <div>
                                                 <p className="text-[8px] font-black text-gray-400 uppercase">A/C No</p>
                                                 <p className="text-[10px] font-bold">{deal.seller_payment_info.account_number}</p>
                                              </div>
                                           )}
                                           {deal.seller_payment_info.ifsc && (
                                              <div>
                                                 <p className="text-[8px] font-black text-gray-400 uppercase">IFSC</p>
                                                 <p className="text-[10px] font-bold uppercase">{deal.seller_payment_info.ifsc}</p>
                                              </div>
                                           )}
                                        </div>
                                     </div>
                                  )}
                               </div>

                               <div className="flex flex-col gap-3 min-w-[180px]">
                                  {deal.status === 'SHIPPED' && (
                                    <button 
                                       onClick={() => handleConfirmPurchase(deal.id)}
                                       className="w-full py-3 bg-blue-600 text-white rounded-full text-[9px] font-bold uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-100 transition"
                                    >
                                       Confirm Receipt
                                    </button>
                                  )}

                                  {deal.status === 'DELIVERED' && (
                                     <>
                                      <button 
                                          onClick={() => handleFinalizeCompletion(deal.id)}
                                          className="w-full py-3 bg-emerald-600 text-white rounded-full text-[9px] font-bold uppercase tracking-widest hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition"
                                       >
                                          Confirm Completion
                                       </button>
                                       <button 
                                          onClick={() => handleDisputeDeal(deal.id)}
                                          className="w-full py-2 border border-rose-100 text-rose-500 rounded-full text-[8px] font-bold uppercase tracking-widest hover:bg-rose-50 transition"
                                       >
                                          Item Not As Described
                                       </button>
                                     </>
                                   )}
                                  
                                  {((deal.status === 'ACCEPTED') || (deal.status === 'PAID' && new Date(deal.expires_at) < new Date())) && !deal.shipped_at && (
                                     <div className="flex flex-col gap-2">
                                        {deal.payment_status === 'PENDING' && (
                                           <button 
                                              onClick={() =>  { setPaymentForm({ ...paymentForm, dealId: deal.id }); setIsPaymentModalOpen(true); }}
                                              className="w-full py-3 bg-black text-white rounded-full text-[9px] font-bold uppercase tracking-widest hover:bg-gray-800 shadow-lg shadow-gray-100 transition"
                                           >
                                              I Have Paid
                                           </button>
                                        )}
                                        <button 
                                           onClick={() => handleCancelDeal(deal.id)}
                                           className="w-full py-2 border border-gray-100 text-gray-400 rounded-full text-[8px] font-bold uppercase tracking-widest hover:bg-gray-50 transition"
                                        >
                                           {deal.status === 'PAID' ? 'Request Refund & Cancel' : 'Cancel Order'}
                                        </button>
                                     </div>
                                  )}

                                  {['ACCEPTED', 'SHIPPED', 'DELIVERED'].includes(deal.status) && (
                                      <button 
                                         onClick={() => handleDisputeDeal(deal.id)}
                                         className="w-full py-2 text-rose-500 text-[8px] font-bold uppercase tracking-widest hover:underline"
                                      >
                                         Raise Dispute
                                      </button>
                                   )}

                                   {deal.status === 'DISPUTED' && (
                                      <div className="w-full py-3 bg-gray-50 text-gray-400 rounded-full text-[9px] font-bold uppercase tracking-widest text-center border border-gray-100 italic">
                                         Under Admin Review
                                      </div>
                                   )}

                                  {deal.status === 'CONFIRMED' && !deal.review_id && (
                                     <button 
                                        onClick={() => openReviewModal({...deal, seller_id: deal.seller_id})}
                                        className="w-full py-3 bg-black text-white rounded-full text-[9px] font-bold uppercase tracking-widest hover:bg-gray-800 transition"
                                     >
                                        Leave Feedback
                                     </button>
                                  )}

                                  {deal.tracking_number && (
                                     <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 mt-2">
                                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">{deal.courier_name || 'Tracking'}</p>
                                        <a 
                                           href={`https://www.google.com/search?q=${encodeURIComponent((deal.courier_name || '') + ' tracking ' + deal.tracking_number)}`}
                                           target="_blank"
                                           className="text-[10px] font-bold text-blue-600 truncate hover:underline flex items-center gap-1"
                                        >
                                           {deal.tracking_number} <ExternalLink className="w-3 h-3" />
                                        </a>
                                        {deal.packing_video && (
                                           <a href={deal.packing_video.startsWith('http') ? deal.packing_video : `${API_BASE_URL}/uploads/${deal.packing_video}`} target="_blank" className="text-[9px] font-bold text-blue-600 uppercase tracking-widest mt-2 inline-flex items-center gap-1 hover:underline"><Camera className="w-3 h-3" /> View Packing Video</a>
                                        )}
                                     </div>
                                  )}
                               </div>
                            </div>
                          ))
                        ) : (
                          <div className="py-20 text-center border border-dashed border-gray-100 rounded-3xl">
                             <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">No deals in {buyingSubTab} state</p>
                          </div>
                        )
                      )}
                   </div>
                </div>
              )}

               {/* Seller Hub */}
               {activeTab === "selling" && (
                  <div className="animate-in fade-in slide-in-from-left-4 duration-500">
                     <div className="mb-12 flex justify-between items-end">
                        <div>
                          <h2 className="text-xl font-bold text-gray-900 uppercase tracking-tight">Seller Hub</h2>
                          <p className="text-xs text-gray-400 mt-2 font-medium">Professional command center for your high-value inventory and active deal pipelines.</p>
                        </div>
                        <button onClick={() => router.push('/sell')} className="bg-black text-white px-6 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg shadow-gray-100">Create Listing</button>
                     </div>

                     {/* Sub Tabs */}
                     <div className="flex gap-8 border-b border-gray-100 mb-10 overflow-x-auto no-scrollbar">
                        {['inventory', 'deals', 'negotiations'].map(sub => (
                          <button 
                             key={sub}
                             onClick={() => setSellingSubTab(sub)}
                             className={`pb-4 text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border-b-2 ${sellingSubTab === sub ? 'text-blue-600 border-blue-600' : 'text-gray-300 border-transparent hover:text-gray-900'}`}
                          >
                             {sub === 'inventory' ? `Inventory (${activity.listings?.length || 0})` : 
                              sub === 'deals' ? `Active Deals${deals.filter(d => d.seller_id == user?.id && ['ACCEPTED','SHIPPED'].includes(d.status)).length > 0 ? ` (${deals.filter(d => d.seller_id == user?.id && ['ACCEPTED','SHIPPED'].includes(d.status)).length})` : ''}` :
                              `Negotiations${sellerNegotiations.length > 0 ? ` (${sellerNegotiations.length})` : ''}`}
                          </button>
                        ))}
                     </div>

                     <div className="space-y-12">
                        {/* Inventory Tab */}
                        {sellingSubTab === 'inventory' && (
                           <div className="space-y-6">
                               {activity.listings?.some(item => item.status === 'pending') && (
                                 <div className="bg-blue-50 border border-blue-100 text-blue-700 px-6 py-4 rounded-xl text-[11px] font-bold uppercase tracking-tight flex items-start gap-4">
                                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    <p>Newly created listings will appear as <span className="px-1 py-0.5 bg-amber-500 text-white rounded font-black mx-1">PENDING</span> and must be approved by an administrator before they become visible on the marketplace.</p>
                                 </div>
                               )}
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                 {activity.listings?.length > 0 ? (
                                activity.listings.map(item => (
                                  <div key={item.id} className="group border border-gray-100 rounded-2xl p-5 hover:bg-white hover:shadow-xl transition-all relative">
                                     <div className="w-full aspect-square bg-gray-50 rounded-xl mb-4 overflow-hidden relative">
                                        {item.images?.[0] ? <img src={getImg(item.images)} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500" alt="watch" /> : <div className="w-full h-full bg-gray-100" />}
                                        <div className={`absolute top-3 left-3 px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest ${
                                          item.status === 'approved' || item.status === 'active' ? 'bg-black text-white' : 
                                          item.status === 'sold' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
                                        }`}>
                                           {item.status}
                                        </div>
                                     </div>
                                     <h4 className="text-[11px] font-bold uppercase tracking-tight truncate leading-none mb-2">{item.title}</h4>
                                     
                                     {item.status === 'rejected' && item.rejection_reason && (
                                       <div className="mb-3 p-2 bg-rose-50 border border-rose-100 rounded-lg">
                                         <p className="text-[8px] font-black text-rose-500 uppercase tracking-widest mb-1">Rejection Reason:</p>
                                         <p className="text-[10px] text-rose-700 font-medium leading-tight">{item.rejection_reason}</p>
                                       </div>
                                     )}

                                     <div className="flex justify-between items-center">
                                        <span className="text-sm font-black text-gray-950">₹{parseFloat(item.price).toLocaleString()}</span>
                                        <div className="flex gap-1">
                                           <button onClick={() => router.push(`/sell?edit=${item.id}`)} className="p-1.5 hover:text-blue-600 transition-colors"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                                           <button onClick={() => handleDeleteProduct(item.id)} className="p-1.5 hover:text-rose-600 transition-colors"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                                        </div>
                                     </div>
                                  </div>
                                ))
                              ) : (
                                 <div className="col-span-full py-12 text-center border border-gray-50 border-dashed rounded-3xl">
                                    <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Zero items listed</p>
                                 </div>
                              )}
                           </div>
                           </div>
                        )}

                         {/* Seller Active Deals Tab */}
                         {sellingSubTab === 'deals' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                               {deals.filter(d => d.seller_id == user?.id && ['ACCEPTED','PAID','SHIPPED','DELIVERED','CONFIRMED','DISPUTED'].includes(d.status)).length > 0 ? (
                                 deals.filter(d => d.seller_id == user?.id && ['ACCEPTED','PAID','SHIPPED','DELIVERED','CONFIRMED','DISPUTED'].includes(d.status)).map(deal => (
                                   <div key={deal.id} className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row gap-8 hover:shadow-xl transition-all group">
                                      {/* Product Visual */}
                                      <div className="w-full md:w-48 aspect-square rounded-2xl bg-gray-50 flex-shrink-0 relative overflow-hidden">
                                         <img src={deal.images?.[0] ? getImg(deal.images) : '/placeholder.png'} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" alt="product" />
                                         <div className="absolute top-4 left-4">
                                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm ${
                                               deal.status === 'ACCEPTED' ? 'bg-blue-600 text-white' : 
                                               deal.status === 'PAID' ? 'bg-amber-500 text-white' : 
                                               deal.status === 'SHIPPED' ? 'bg-black text-white' : 'bg-emerald-500 text-white'
                                            }`}>
                                               {deal.status}
                                            </span>
                                         </div>
                                      </div>

                                      {/* Deal Content */}
                                      <div className="flex-grow flex flex-col justify-between py-1">
                                         <div className="space-y-4">
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                               <div>
                                                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Deal #D-{deal.id}</p>
                                                  <h3 className="text-xl font-bold text-gray-950 uppercase tracking-tight leading-none">{deal.product_title}</h3>
                                               </div>
                                               <div className="text-right">
                                                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Your Payout</p>
                                                  <p className="text-2xl font-black text-gray-950 leading-none">₹{parseFloat(deal.seller_payout || 0).toLocaleString()}</p>
                                                  <div className="flex flex-col items-end mt-2">
                                                     <p className="text-[8px] font-bold text-gray-400 uppercase">Sale: ₹{parseFloat(deal.amount).toLocaleString()}</p>
                                                     {parseFloat(deal.shipping_fee || 0) > 0 && (
                                                        <p className="text-[8px] font-bold text-blue-600 uppercase">Shipping: +₹{parseFloat(deal.shipping_fee).toLocaleString()}</p>
                                                     )}
                                                     <p className="text-[8px] font-bold text-rose-500 uppercase">Fee: -₹{parseFloat(deal.total_platform_fee || 0).toLocaleString()}</p>
                                                  </div>
                                               </div>
                                            </div>

                                            {/* Status Timeline */}
                                            <div className="flex items-center gap-1 mt-6">
                                               {['ACCEPTED', 'PAID', 'SHIPPED', 'DELIVERED', 'CONFIRMED'].map((s, idx) => {
                                                  const statuses = ['ACCEPTED', 'PAID', 'SHIPPED', 'DELIVERED', 'CONFIRMED'];
                                                  const currentIdx = statuses.indexOf(deal.status);
                                                  const stepIdx = idx;
                                                  const isPast = stepIdx < currentIdx;
                                                  const isCurrent = stepIdx === currentIdx;
                                                  
                                                  return (
                                                     <div key={s} className="flex-1 flex flex-col gap-2">
                                                        <div className={`h-1 rounded-full ${isPast ? 'bg-emerald-500' : isCurrent ? 'bg-blue-600 animate-pulse' : 'bg-gray-100'}`}></div>
                                                        <p className={`text-[7px] font-black uppercase tracking-tighter ${isPast ? 'text-emerald-600' : isCurrent ? 'text-blue-600' : 'text-gray-300'}`}>{s}</p>
                                                     </div>
                                                  );
                                               })}
                                            </div>
                                         </div>

                                         <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* Left - Status Detail */}
                                            <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100/50">
                                               {deal.status === 'ACCEPTED' && (
                                                  <div className="flex items-start gap-3">
                                                     <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center animate-pulse"><FileText className="w-4 h-4 text-blue-600" /></div>
                                                     <div>
                                                        <p className="text-[10px] font-black text-gray-900 uppercase">Awaiting Payment</p>
                                                        <p className="text-[9px] text-gray-400 font-bold uppercase mt-1">Buyer has been notified to send funds.</p>
                                                     </div>
                                                  </div>
                                               )}

                                               {deal.status === 'PAID' && (
                                                  <div className="flex flex-col gap-3">
                                                     <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center"><CheckCircle className="w-4 h-4 text-emerald-600" /></div>
                                                        <div>
                                                           <p className="text-[10px] font-black text-gray-900 uppercase">Funds Verified</p>
                                                           <p className="text-[9px] text-gray-400 font-bold uppercase mt-1">Please prepare the shipment.</p>
                                                        </div>
                                                     </div>
                                                     {deal.payment_receipt && (
                                                        <button 
                                                           onClick={() => setPaymentReceiptModal(deal.payment_receipt?.startsWith('http') ? deal.payment_receipt : `${API_BASE_URL}/uploads/${deal.payment_receipt}`)}
                                                           className="w-full py-2 bg-white border border-gray-200 rounded-lg text-[10px] font-black uppercase tracking-widest text-gray-900 hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                                                        >
                                                           <Camera className="w-4 h-4" /> View Receipt
                                                        </button>
                                                     )}
                                                  </div>
                                               )}

                                               {deal.status === 'SHIPPED' && (
                                                   <div className="flex items-start gap-3">
                                                      <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center"><Send className="w-4 h-4 text-white" /></div>
                                                      <div>
                                                         <p className="text-[11px] font-black text-gray-900 uppercase">In Transit</p>
                                                         <p className="text-[10px] text-blue-600 font-bold uppercase mt-1 tracking-widest">{deal.courier_name} · {deal.tracking_number}</p>
                                                      </div>
                                                   </div>
                                                )}

                                                {deal.status === 'CONFIRMED' && (
                                                   <div className="flex flex-col gap-3">
                                                      <div className="flex items-center gap-3">
                                                         <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center"><CheckCircle className="w-4 h-4 text-emerald-600" /></div>
                                                         <div>
                                                            <p className="text-[10px] font-black text-gray-900 uppercase">Deal Completed</p>
                                                            <p className="text-[9px] text-gray-400 font-bold uppercase mt-1">Buyer has confirmed receipt.</p>
                                                         </div>
                                                      </div>
                                                      <div className="mt-2 p-3 bg-white rounded-xl border border-gray-100 shadow-sm">
                                                         <div className="flex justify-between items-center mb-1">
                                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Payout Status</p>
                                                            <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${deal.payout_status === 'RELEASED' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                                               {deal.payout_status || 'PENDING'}
                                                            </span>
                                                         </div>
                                                         <p className="text-sm font-black text-gray-950">₹{parseFloat(deal.seller_payout || 0).toLocaleString()}</p>
                                                         {deal.payout_released_at && (
                                                            <p className="text-[7px] text-gray-400 mt-1 font-bold uppercase tracking-tight">Released on {new Date(deal.payout_released_at).toLocaleDateString()}</p>
                                                         )}
                                                      </div>
                                                   </div>
                                                )}
                                            </div>

                                            {/* Right - Immediate Action */}
                                            <div className="flex flex-col justify-center">
                                                {(deal.status === 'PAID' || editingTrackingId === deal.id) && (
                                                   <div className="space-y-3">
                                                      <div className="flex flex-col gap-2">
                                                         <div className="flex gap-2">
                                                            <select 
                                                               className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-xl text-[10px] font-bold uppercase tracking-widest outline-none focus:ring-2 focus:ring-blue-100 text-gray-900"
                                                               value={trackingForm.order_id === deal.id ? trackingForm.courier_name : (deal.courier_name || '')}
                                                               onChange={(e) => setTrackingForm({ ...trackingForm, order_id: deal.id, courier_name: e.target.value })}
                                                            >
                                                               <option value="">SELECT COURIER</option>
                                                               <option value="DTDC">DTDC</option>
                                                               <option value="Bluedart">Bluedart</option>
                                                               <option value="Delhivery">Delhivery</option>
                                                               <option value="FedEx">FedEx</option>
                                                               <option value="India Post">India Post</option>
                                                               <option value="Other">Other</option>
                                                            </select>
                                                            <input 
                                                               placeholder="TRACKING #" 
                                                               className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-xl text-[10px] font-bold uppercase tracking-widest outline-none focus:ring-2 focus:ring-blue-100 placeholder:text-gray-200"
                                                               value={trackingForm.order_id === deal.id ? trackingForm.tracking_number : (deal.tracking_number || '')}
                                                               onChange={(e) => setTrackingForm({ ...trackingForm, order_id: deal.id, tracking_number: e.target.value.toUpperCase() })}
                                                            />
                                                         </div>
                                                         
                                                         <div className="relative group w-full">
                                                            <input 
                                                                type="file" 
                                                                accept="video/mp4,video/webm"
                                                                onChange={(e) => setTrackingForm({ ...trackingForm, order_id: deal.id, packing_video: e.target.files[0] })}
                                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                            />
                                                            <div className="w-full bg-white border-2 border-dashed border-gray-200 rounded-xl px-4 py-3 flex flex-col items-center justify-center gap-1 group-hover:border-blue-300 transition-colors">
                                                               {trackingForm.order_id === deal.id && trackingForm.packing_video ? (
                                                                  <span className="text-[10px] font-bold text-gray-900 truncate">Video Selected: {trackingForm.packing_video.name}</span>
                                                               ) : (
                                                                  <>
                                                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest"><Camera className="w-3 h-3 inline-block mr-1" /> Upload Packing Video</span>
                                                                    <span className="text-[8px] text-gray-400 font-medium">Mandatory for shipment verification</span>
                                                                  </>
                                                               )}
                                                            </div>
                                                         </div>
                                                      </div>
                                                      <div className="flex gap-2">
                                                         <button 
                                                            disabled={isSubmittingTracking}
                                                            onClick={() => handleSaveTracking(deal.id)}
                                                            className="flex-1 py-4 bg-blue-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-blue-100/50 hover:bg-black transition-all"
                                                         >
                                                            {isSubmittingTracking ? 'Syncing...' : (deal.status === 'SHIPPED' ? 'Save Changes' : 'Confirm Shipment')}
                                                         </button>
                                                         {editingTrackingId === deal.id && (
                                                            <button 
                                                               onClick={() => setEditingTrackingId(null)}
                                                               className="px-6 py-4 bg-gray-100 text-gray-500 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-gray-200 transition-all"
                                                            >
                                                               Cancel
                                                            </button>
                                                         )}
                                                      </div>
                                                   </div>
                                                )}

                                                {deal.status === 'SHIPPED' && editingTrackingId !== deal.id && (
                                                   <div className="flex flex-col gap-3">
                                                      {deal.tracking_number && (
                                                         <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">{deal.courier_name || 'Tracking'}</p>
                                                            <a 
                                                               href={`https://www.google.com/search?q=${encodeURIComponent((deal.courier_name || '') + ' tracking ' + deal.tracking_number)}`}
                                                               target="_blank"
                                                               className="text-[10px] font-bold text-blue-600 truncate hover:underline flex items-center gap-1"
                                                            >
                                                               {deal.tracking_number} <ExternalLink className="w-3 h-3" />
                                                            </a>
                                                         </div>
                                                      )}
                                                      {deal.packing_video && (
                                                         <a href={deal.packing_video.startsWith('http') ? deal.packing_video : `${API_BASE_URL}/uploads/${deal.packing_video}`} target="_blank" className="text-[9px] font-bold text-blue-600 uppercase tracking-widest mt-2 inline-flex items-center gap-1 hover:underline"><Camera className="w-3 h-3" /> View Packing Video</a>
                                                      )}
                                                      <button 
                                                         onClick={() => {
                                                            setEditingTrackingId(deal.id);
                                                            setTrackingForm({
                                                               order_id: deal.id,
                                                               courier_name: deal.courier_name || '',
                                                               tracking_number: deal.tracking_number || '',
                                                               packing_video: null
                                                            });
                                                         }}
                                                         className="w-full py-3 bg-white border border-gray-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-900 hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                                                      >
                                                         <Edit2 className="w-3 h-3" /> Edit Tracking Details
                                                      </button>
                                                   </div>
                                                )}

                                               {((deal.status === 'ACCEPTED') || (deal.status === 'PAID' && new Date(deal.expires_at) < new Date())) && (
                                                  <button 
                                                     onClick={() => handleCancelDeal(deal.id)}
                                                     className="w-full py-3 border-2 border-dashed border-gray-100 text-gray-300 rounded-2xl text-[11px] font-bold uppercase tracking-widest hover:border-rose-100 hover:text-rose-500 hover:bg-rose-50 transition-all"
                                                  >
                                                     {deal.status === 'PAID' ? 'Cancel & Process Refund' : 'Cancel Deal'}
                                                  </button>
                                               )}
                                            </div>
                                         </div>
                                      </div>
                                   </div>
                                 ))
                               ) : (
                                   <div className="bg-white rounded-3xl p-20 text-center border border-gray-100 shadow-sm border-dashed">
                                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                         <FileText className="w-8 h-8 text-gray-200" />
                                      </div>
                                      <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">No Active Pipelines</h3>
                                      <p className="text-[10px] text-gray-400 font-bold uppercase mt-2">Active deals will materialize here once offers are accepted.</p>
                                   </div>
                               )}
                            </div>
                          )}

                          {/* Seller Negotiations Tab */}
                          {sellingSubTab === 'negotiations' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                               {sellerNegotiations.length > 0 ? (
                                 sellerNegotiations.map(offer => (
                                   <div key={offer.id} className="bg-white border border-gray-100 rounded-3xl p-6 hover:shadow-xl transition-all flex flex-col md:flex-row gap-6">
                                      <div className="w-24 h-24 bg-gray-50 rounded-xl overflow-hidden flex-shrink-0">
                                         {offer.images?.[0] ? <img src={getImg(offer.images)} className="w-full h-full object-cover" alt="watch" /> : <div className="w-full h-full bg-gray-100" />}
                                      </div>
                                      <div className="flex-1">
                                         <div className="flex justify-between items-start mb-2">
                                            <div>
                                               <h4 className="text-sm font-bold uppercase tracking-tight">{offer.title}</h4>
                                               <p className="text-[9px] font-bold text-gray-400 uppercase mt-1">From: {offer.buyer_name}</p>
                                            </div>
                                            <div className="text-right">
                                               <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">Offered Price</p>
                                               <p className="text-xl font-black text-blue-600">₹{parseFloat(offer.amount).toLocaleString()}</p>
                                            </div>
                                         </div>
                                         
                                         {offer.message && (
                                           <div className="mt-3 p-3 bg-gray-50 rounded-xl border-l-4 border-blue-600">
                                              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Buyer's Message:</p>
                                              <p className="text-[11px] font-medium text-gray-700 italic leading-relaxed">"{offer.message}"</p>
                                           </div>
                                         )}

                                         <div className="mt-4 flex flex-col gap-3">
                                            <div className="flex justify-between items-center w-full">
                                                <span className="text-[8px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded uppercase tracking-widest">
                                                   Expires in: {getRemainingTime(offer.expires_at)}
                                                </span>
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Offer Count: {offer.offer_count}/5</span>
                                            </div>
                                            {offer.status === 'pending' && (
                                                <>
                                                   {counterForm.offerId === offer.id ? (
                                                      <div className="flex items-center gap-2">
                                                         <span className="text-sm font-bold text-gray-500">₹</span>
                                                         <input 
                                                            type="number" 
                                                            value={counterForm.amount} 
                                                            onChange={e => setCounterForm({...counterForm, amount: e.target.value})}
                                                            className="flex-1 py-2 px-3 border border-gray-200 rounded outline-none text-xs font-bold"
                                                            placeholder="Counter Amount"
                                                         />
                                                         <button onClick={() => handleOfferResponse(offer.id, 'countered', counterForm.amount)} className="px-4 py-2 bg-blue-600 text-white rounded text-[9px] font-bold uppercase hover:bg-blue-700">Send</button>
                                                         <button onClick={() => setCounterForm({offerId: null, amount: ""})} className="px-4 py-2 bg-gray-100 text-gray-600 rounded text-[9px] font-bold uppercase hover:bg-gray-200">Cancel</button>
                                                      </div>
                                                   ) : (
                                                      <div className="flex w-full gap-2">
                                                         <button onClick={() => handleOfferResponse(offer.id, 'accepted')} className="flex-1 py-2.5 bg-emerald-600 text-white text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-emerald-700 transition">Accept</button>
                                                         <button onClick={() => setCounterForm({offerId: offer.id, amount: offer.amount})} className="flex-1 py-2.5 bg-white border-2 border-gray-900 text-gray-900 text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-gray-50 transition">Counter</button>
                                                         <button onClick={() => handleOfferResponse(offer.id, 'declined')} className="flex-1 py-2.5 bg-rose-50 text-rose-600 border border-rose-200 text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-rose-100 transition">Decline</button>
                                                      </div>
                                                   )}
                                                </>
                                            )}
                                            {offer.status === 'countered' && <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest text-center mt-2">Awaiting Buyer Response</p>}
                                            {offer.status === 'declined' && <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest text-center mt-2">Declined</p>}
                                            <button 
                                               onClick={() => router.push(`/messages?chat=${offer.chat_id}`)}
                                               className="w-full mt-1 px-6 py-2.5 bg-gray-100 text-gray-700 text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-gray-200 transition flex items-center justify-center gap-2"
                                            >
                                               <Send className="w-3 h-3" /> Go to Chat
                                            </button>
                                         </div>
                                      </div>
                                   </div>
                                 ))
                               ) : (
                                 <div className="bg-white rounded-3xl p-20 text-center border border-gray-100 shadow-sm border-dashed">
                                    <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">No pending offers received</p>
                                 </div>
                               )}
                            </div>
                          )}

                      </div>
                   </div>
                )}
               {/* Feedback Received Tab */}
               {activeTab === "feedback" && (
                  <div className="animate-in fade-in slide-in-from-left-4 duration-500">
                     <div className="mb-12 flex justify-between items-end">
                        <div>
                          <h2 className="text-xl font-bold text-gray-900 uppercase tracking-tight">Feedback Ledger</h2>
                          <p className="text-xs text-gray-400 mt-2 font-medium">Verified historical performance and collector sentiment.</p>
                        </div>
                        <div className="text-right">
                           <p className="text-2xl font-black text-gray-900">{receivedReviews.stats.average_rating}</p>
                           <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Global Index / {receivedReviews.stats.review_count} nodes</p>
                        </div>
                     </div>

                     <div className="space-y-6">
                        {receivedReviews.reviews?.length > 0 ? (
                           receivedReviews.reviews.map(review => (
                              <div key={review.id} className="p-8 border border-gray-100 rounded-2xl bg-gray-50/20">
                                 <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                       <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-[10px] font-bold">
                                          {review.reviewer_name?.charAt(0).toUpperCase()}
                                       </div>
                                       <div>
                                          <p className="text-[11px] font-bold text-gray-900 uppercase">{review.reviewer_name}</p>
                                          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{new Date(review.created_at).toLocaleDateString()}</p>
                                       </div>
                                    </div>
                                    <div className="flex gap-0.5">
                                       {[1,2,3,4,5].map(s => (
                                          <svg key={s} className={`w-3 h-3 ${s <= review.rating ? 'text-amber-400' : 'text-gray-200'} fill-current`} viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                       ))}
                                    </div>
                                 </div>
                                 <p className="text-sm font-medium text-gray-600 leading-relaxed italic">"{review.comment}"</p>
                              </div>
                           ))
                        ) : (
                           <div className="py-20 text-center border-2 border-dashed border-gray-50 rounded-2xl">
                              <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">No Feedback Logs Found</p>
                           </div>
                        )}
                     </div>
                  </div>
               )}


                {/* Security Tab */}
               {activeTab === "security" && (
                  <div className="animate-in fade-in slide-in-from-left-4 duration-500">
                     <div className="mb-12">
                        <h2 className="text-xl font-bold text-gray-900 uppercase tracking-tight">Access Control</h2>
                        <p className="text-xs text-gray-400 mt-2 font-medium">Monitoring active sessions and multi-factor authentication nodes.</p>
                     </div>

                     <div className="space-y-4">
                        <div className="p-8 border border-gray-100 rounded-2xl flex justify-between items-center bg-gray-50/20">
                           <div>
                              <p className="text-sm font-bold text-gray-900 uppercase tracking-tight">Current Session</p>
                              <p className="text-[10px] text-gray-400 mt-1 uppercase font-medium">Windows Chrome • IP: 152.16.x.x • Active Now</p>
                           </div>
                           <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-sm shadow-emerald-200"></span>
                        </div>
                        
                        <div className="pt-10">
                           <button className="text-[10px] font-bold text-rose-500 uppercase tracking-widest border-b border-rose-100 pb-1 hover:border-rose-500 transition-all">Revoke All Other Sessions</button>
                        </div>
                     </div>
                  </div>
               )}

            </div>
         </div>
      </main>

      {/* Payment Receipt Preview Modal */}
      {paymentReceiptModal && (
        <div className="fixed inset-0 z-[1100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setPaymentReceiptModal(null)}>
          <div className="relative max-w-2xl w-full" onClick={e => e.stopPropagation()}>
            <button onClick={() => setPaymentReceiptModal(null)} className="absolute -top-10 right-0 text-white/60 hover:text-white text-[10px] font-black uppercase tracking-widest">Close ✕</button>
            <div className="bg-white rounded-2xl overflow-hidden shadow-2xl">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                </div>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-widest text-gray-900">Payment Receipt</p>
                  <p className="text-[9px] font-bold text-gray-400 uppercase">Buyer submitted proof of payment</p>
                </div>
              </div>
              <div className="p-4">
                <img src={paymentReceiptModal} alt="Payment Receipt" className="w-full rounded-xl object-contain max-h-[60vh]" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Leave Review Modal */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsReviewModalOpen(false)} />
           <div className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl p-10 animate-in zoom-in-95 duration-300">
              <div className="mb-8">
                 <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Evaluate Transaction</h3>
                 <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-2">Logging performance for: {reviewForm.product_title}</p>
              </div>

              <div className="space-y-8">
                 <div className="flex flex-col items-center gap-4">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Service Rating</p>
                    <div className="flex gap-4">
                       {[1,2,3,4,5].map(star => (
                          <button 
                             key={star}
                             onClick={() => setReviewForm({...reviewForm, rating: star})}
                             className="group transition-transform hover:scale-125 focus:outline-none"
                          >
                             <svg className={`w-10 h-10 ${star <= reviewForm.rating ? 'text-amber-400 fill-current' : 'text-gray-100 hover:text-amber-200'} transition-colors`} viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                             </svg>
                          </button>
                       ))}
                    </div>
                 </div>

                 <div className="space-y-4">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Feedback Log</label>
                    <textarea 
                       rows="4"
                       value={reviewForm.comment}
                       onChange={(e) => setReviewForm({...reviewForm, comment: e.target.value})}
                       className="w-full bg-gray-50 border border-gray-100 p-6 rounded-2xl outline-none focus:border-blue-600 focus:bg-white transition-all text-sm font-medium"
                       placeholder="Detail your acquisition experience..."
                    />
                 </div>

                 <div className="grid grid-cols-2 gap-4 pt-4">
                    <button 
                       onClick={() => setIsReviewModalOpen(false)}
                       className="py-4 border border-gray-100 rounded-xl text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:bg-gray-50 transition-all"
                    >
                       Cancel
                    </button>
                    <button 
                       onClick={submitReview}
                       disabled={isSubmittingReview}
                       className="py-4 bg-black text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-blue-600 transition-all disabled:opacity-50"
                    >
                       {isSubmittingReview ? 'Logging...' : 'Submit Records'}
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}
      {/* Payment Confirmation Modal */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-6">
           <div className="bg-white rounded-3xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="p-10">
                 <div className="flex justify-between items-center mb-8">
                    <div>
                      <h3 className="text-xl font-bold uppercase tracking-tight">Confirm Payment Submission</h3>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">Uploading receipt helps verify your acquisition records faster.</p>
                    </div>
                    <button onClick={() => setIsPaymentModalOpen(false)} className="p-2 hover:bg-gray-50 rounded-full transition-colors"><X className="w-5 h-5 text-gray-400" /></button>
                 </div>

                 <div className="space-y-8">
                    <div className="space-y-4">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Payment Channel</label>
                       <select 
                          value={paymentForm.method}
                          onChange={(e) => setPaymentForm({...paymentForm, method: e.target.value})}
                          className="w-full bg-gray-50 border border-gray-100 p-4 rounded-xl outline-none focus:border-blue-600 focus:bg-white transition-all text-sm font-bold"
                       >
                          <option value="UPI">UPI Transfer</option>
                          <option value="Bank Transfer">Direct Bank Transfer</option>
                          <option value="Cash" hidden>Cash / Other</option>
                       </select>
                    </div>

                    <div className="space-y-4">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Transaction Artifact (Screenshot/Receipt)</label>
                       <div className="relative group">
                          <input 
                              type="file" 
                              accept="image/*"
                              onChange={(e) => setPaymentForm({...paymentForm, receipt: e.target.files[0]})}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                          />
                          <div className="border-2 border-dashed border-gray-100 rounded-2xl p-8 text-center group-hover:border-blue-200 transition-colors">
                             {paymentForm.receipt ? (
                               <div className="flex items-center justify-center gap-3">
                                  <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                                     <CheckCircle className="w-5 h-5 text-emerald-500" />
                                  </div>
                                  <span className="text-xs font-bold text-gray-900 truncate max-w-[200px]">{paymentForm.receipt.name}</span>
                               </div>
                             ) : (
                               <>
                                 <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                                    <Camera className="w-6 h-6 text-gray-300" />
                                 </div>
                                 <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Click to upload transfer confirmation</p>
                               </>
                             )}
                          </div>
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4">
                       <button 
                          onClick={() => setIsPaymentModalOpen(false)}
                          className="py-4 border border-gray-100 rounded-xl text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:bg-gray-50 transition-all"
                       >
                          Abort
                       </button>
                       <button 
                          onClick={handleMarkAsPaid}
                          disabled={isSubmittingPayment}
                          className="py-4 bg-black text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-blue-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                       >
                          {isSubmittingPayment ? (
                            <>
                              <div className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full"></div>
                              <span>Authenticating...</span>
                            </>
                          ) : 'Authorize Payment Mark'}
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

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex items-center justify-center h-[60vh] gap-3">
          <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
          <span className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Verifying credentials...</span>
        </div>
      </div>
    }>
      <ProfileContent />
    </Suspense>
  );
}
