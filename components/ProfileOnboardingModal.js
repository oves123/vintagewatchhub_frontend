"use client";
import { useState, useEffect } from "react";
import { API_URL } from "../services/api";

export default function ProfileOnboardingModal({ isOpen, onClose, user, onComplete }) {
  const [formData, setFormData] = useState({
    phone: user?.phone || "",
    address: user?.address || "",
    city: user?.city || "",
    state: user?.state || "",
    pincode: user?.pincode || "",
    payment_methods: user?.payment_methods || []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        phone: user.phone || "",
        address: user.address || "",
        city: user.city || "",
        state: user.state || "",
        pincode: user.pincode || "",
        payment_methods: user.payment_methods || []
      });
    }
  }, [user]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const userId = user?.id || user?._id;
    if (!userId) {
      setError("Session error: user ID not found. Please refresh and try again.");
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/user/profile/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
           ...formData,
           payment_methods: formData.payment_methods.length > 0 ? formData.payment_methods : ["Bank Transfer"]
        })
      });
      const data = await res.json();
      if (res.ok) {
        setSaved(true);
        setTimeout(() => {
          onComplete(data.user);
        }, 1600);
      } else {
        setError(data.message || "Failed to update profile. Please try again.");
      }
    } catch (err) {
      console.error(err);
      setError("A network error occurred. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[5000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-surface rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Success State */}
        {saved ? (
          <div className="flex flex-col items-center justify-center py-16 px-8 text-center">

            <div className="relative flex items-center justify-center mb-6">
              <div className="ripple-anim absolute w-20 h-20 rounded-full bg-emerald-300 opacity-40" />
              <div className="check-anim w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center shadow-xl shadow-emerald-200">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h3 className="text-2xl font-black text-foreground uppercase tracking-tight mb-2">Profile Saved!</h3>
            <p className="text-[12px] font-medium text-muted">Setting up your dashboard...</p>
          </div>
        ) : (
          <>
            <div className="bg-primary p-6 text-white text-center">
               <h2 className="text-2xl font-black uppercase tracking-widest">Complete Your Profile</h2>
               <p className="text-blue-100 text-sm mt-2">We need a few more details to secure your transaction.</p>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-5">
               {error && (
                 <div className="flex items-start gap-3 bg-rose-50 border border-rose-100 rounded-xl p-4 animate-in slide-in-from-top-2 duration-300">
                   <span className="text-rose-500 text-lg shrink-0"></span>
                   <p className="text-[12px] font-semibold text-rose-700 leading-relaxed">{error}</p>
                 </div>
               )}
               <div className="space-y-1">
                 <label className="text-xs font-bold text-muted uppercase tracking-widest">Phone Number</label>
                 <input required type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full bg-background border border-border p-4 rounded-lg focus:border-blue-600 outline-none text-sm font-semibold" placeholder="Your mobile number" />
               </div>
               <div className="space-y-1">
                 <label className="text-xs font-bold text-muted uppercase tracking-widest">Street Address</label>
                 <input required type="text" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="w-full bg-background border border-border p-4 rounded-lg focus:border-blue-600 outline-none text-sm font-semibold" placeholder="Full street address" />
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                   <label className="text-xs font-bold text-muted uppercase tracking-widest">City</label>
                   <input required type="text" value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} className="w-full bg-background border border-border p-4 rounded-lg focus:border-blue-600 outline-none text-sm font-semibold" placeholder="City" />
                 </div>
                 <div className="space-y-1">
                   <label className="text-xs font-bold text-muted uppercase tracking-widest">State</label>
                   <input required type="text" value={formData.state} onChange={(e) => setFormData({...formData, state: e.target.value})} className="w-full bg-background border border-border p-4 rounded-lg focus:border-blue-600 outline-none text-sm font-semibold" placeholder="State" />
                 </div>
               </div>
               <div className="space-y-1">
                 <label className="text-xs font-bold text-muted uppercase tracking-widest">Pincode</label>
                 <input required type="text" value={formData.pincode} onChange={(e) => setFormData({...formData, pincode: e.target.value})} className="w-full bg-background border border-border p-4 rounded-lg focus:border-blue-600 outline-none text-sm font-semibold" placeholder="Postal Code" />
               </div>
               <div className="pt-4 flex gap-4">
                 <button type="button" onClick={onClose} className="flex-1 p-4 rounded-lg font-bold text-muted bg-background hover:bg-gray-200 transition-colors uppercase tracking-widest text-sm">Cancel</button>
                  <button type="submit" disabled={loading} className="gold-sweep flex-1 p-4 font-bold uppercase tracking-widest text-sm disabled:opacity-50 shadow-lg flex items-center justify-center gap-2">
                    {loading ? (
                      <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</>
                    ) : "Save & Continue"}
                 </button>
               </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
