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
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/users/${user.id}`, {
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
        onComplete(data.user);
      } else {
        alert(data.message || "Failed to update profile");
      }
    } catch (err) {
      console.error(err);
      alert("System error updating profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[5000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="bg-blue-600 p-6 text-white text-center">
           <h2 className="text-2xl font-black uppercase tracking-widest">Complete Your Profile</h2>
           <p className="text-blue-100 text-sm mt-2">We need a few more details to secure your transaction.</p>
        </div>
        <form onSubmit={handleSubmit} className="p-8 space-y-5">
           <div className="space-y-1">
             <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Phone Number</label>
             <input required type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl focus:border-blue-600 outline-none text-sm font-semibold" placeholder="Your mobile number" />
           </div>
           <div className="space-y-1">
             <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Street Address</label>
             <input required type="text" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl focus:border-blue-600 outline-none text-sm font-semibold" placeholder="Full street address" />
           </div>
           <div className="grid grid-cols-2 gap-4">
             <div className="space-y-1">
               <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">City</label>
               <input required type="text" value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl focus:border-blue-600 outline-none text-sm font-semibold" placeholder="City" />
             </div>
             <div className="space-y-1">
               <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">State</label>
               <input required type="text" value={formData.state} onChange={(e) => setFormData({...formData, state: e.target.value})} className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl focus:border-blue-600 outline-none text-sm font-semibold" placeholder="State" />
             </div>
           </div>
           <div className="space-y-1">
             <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Pincode</label>
             <input required type="text" value={formData.pincode} onChange={(e) => setFormData({...formData, pincode: e.target.value})} className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl focus:border-blue-600 outline-none text-sm font-semibold" placeholder="Postal Code" />
           </div>

           <div className="pt-4 flex gap-4">
             <button type="button" onClick={onClose} className="flex-1 p-4 rounded-xl font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors uppercase tracking-widest text-[11px]">Cancel</button>
             <button type="submit" disabled={loading} className="flex-1 p-4 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors uppercase tracking-widest text-[11px] disabled:opacity-50 shadow-lg shadow-blue-200">
                {loading ? "Saving..." : "Save & Continue"}
             </button>
           </div>
        </form>
      </div>
    </div>
  );
}
