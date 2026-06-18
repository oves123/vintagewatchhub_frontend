"use client";

import { Edit2, Send } from "lucide-react";

export default function ProfileSettings({ profileForm, setProfileForm, handleProfileUpdate, isUpdating, user }) {
  return (
    <div className="animate-in fade-in slide-in-from-left-4 duration-500">
      <div className="mb-12">
         <h2 className="text-xl font-bold text-foreground uppercase tracking-tight">Identity Details</h2>
         <p className="text-xs text-muted mt-2 font-medium">Manage your personal information and public collector profile.</p>
      </div>

      <div className="space-y-12">
        {/* Personal Details Group */}
        <div>
           <div className="flex items-center gap-3 mb-6">
              <span className="w-8 h-px bg-border"></span>
              <h3 className="text-sm font-bold text-muted uppercase tracking-[0.2em]">Contact & Location</h3>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                 <label className="text-xs font-black uppercase tracking-widest text-muted">Full Name</label>
                 <input type="text" className="w-full bg-background border border-border px-4 py-3 rounded-lg text-sm font-bold text-foreground outline-none focus:border-gold transition-colors"
                   value={profileForm.name} onChange={(e) => setProfileForm({...profileForm, name: e.target.value})} placeholder="Legal Name" />
              </div>
              <div className="space-y-3">
                 <label className="text-xs font-black uppercase tracking-widest text-muted">Phone Number</label>
                 <input type="tel" className="w-full bg-background border border-border px-4 py-3 rounded-lg text-sm font-bold text-foreground outline-none focus:border-gold transition-colors"
                   value={profileForm.phone} onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})} placeholder="+1 (555) 000-0000" />
              </div>
              <div className="space-y-3">
                 <label className="text-xs font-black uppercase tracking-widest text-muted">City</label>
                 <input type="text" className="w-full bg-background border border-border px-4 py-3 rounded-lg text-sm font-bold text-foreground outline-none focus:border-gold transition-colors"
                   value={profileForm.city} onChange={(e) => setProfileForm({...profileForm, city: e.target.value})} placeholder="City" />
              </div>
              <div className="space-y-3">
                 <label className="text-xs font-black uppercase tracking-widest text-muted">State/Province</label>
                 <input type="text" className="w-full bg-background border border-border px-4 py-3 rounded-lg text-sm font-bold text-foreground outline-none focus:border-gold transition-colors"
                   value={profileForm.state} onChange={(e) => setProfileForm({...profileForm, state: e.target.value})} placeholder="State" />
              </div>
              <div className="space-y-3">
                 <label className="text-xs font-black uppercase tracking-widest text-muted">Postal Code</label>
                 <input type="text" className="w-full bg-background border border-border px-4 py-3 rounded-lg text-sm font-bold text-foreground outline-none focus:border-gold transition-colors"
                   value={profileForm.pincode} onChange={(e) => setProfileForm({...profileForm, pincode: e.target.value})} placeholder="00000" />
              </div>
           </div>
        </div>

        {/* Public Profile Group */}
        <div>
           <div className="flex items-center gap-3 mb-6">
              <span className="w-8 h-px bg-border"></span>
              <h3 className="text-sm font-bold text-muted uppercase tracking-[0.2em]">Collector Profile</h3>
           </div>
           <div className="space-y-6">
              <div className="space-y-3">
                 <label className="text-xs font-black uppercase tracking-widest text-muted">Collector Bio</label>
                 <textarea rows={4} className="w-full bg-background border border-border px-4 py-3 rounded-lg text-sm text-foreground outline-none focus:border-gold transition-colors resize-none leading-relaxed"
                   value={profileForm.bio} onChange={(e) => setProfileForm({...profileForm, bio: e.target.value})} placeholder="Describe your collection or expertise..." />
              </div>
           </div>
        </div>

        {/* Seller Configurations */}
        {user?.role === 'seller' && (
           <div>
              <div className="flex items-center gap-3 mb-6">
                 <span className="w-8 h-px bg-border"></span>
                 <h3 className="text-sm font-bold text-muted uppercase tracking-[0.2em]">Seller Configuration</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                     <label className="text-xs font-black uppercase tracking-widest text-muted">Entity Type</label>
                     <select className="w-full bg-background border border-border px-4 py-3 rounded-lg text-sm font-bold text-foreground outline-none focus:border-gold transition-colors"
                       value={profileForm.seller_type} onChange={(e) => setProfileForm({...profileForm, seller_type: e.target.value})}>
                        <option value="individual">Private Collector</option>
                        <option value="business">Registered Dealer</option>
                     </select>
                  </div>
                  {profileForm.seller_type === 'business' && (
                     <div className="space-y-3">
                        <label className="text-xs font-black uppercase tracking-widest text-muted">Tax ID / VAT</label>
                        <input type="text" className="w-full bg-background border border-border px-4 py-3 rounded-lg text-sm font-bold text-foreground outline-none focus:border-gold transition-colors"
                          value={profileForm.gst_number} onChange={(e) => setProfileForm({...profileForm, gst_number: e.target.value})} placeholder="Registration Number" />
                     </div>
                  )}
              </div>

              <div className="mt-8 space-y-6">
                 <label className="text-xs font-black uppercase tracking-widest text-muted block">Settlement Details (Where you get paid)</label>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-background/50 p-6 rounded-xl border border-border/50">
                    <input type="text" placeholder="Bank Name" className="bg-background border border-border px-4 py-3 rounded-lg text-sm font-bold"
                      value={profileForm.payment_methods?.bank_name || ""} onChange={(e) => setProfileForm({...profileForm, payment_methods: {...profileForm.payment_methods, bank_name: e.target.value}})} />
                    <input type="text" placeholder="Account Number" className="bg-background border border-border px-4 py-3 rounded-lg text-sm font-bold"
                      value={profileForm.payment_methods?.account_number || ""} onChange={(e) => setProfileForm({...profileForm, payment_methods: {...profileForm.payment_methods, account_number: e.target.value}})} />
                    <input type="text" placeholder="Routing / SWIFT / IFSC" className="bg-background border border-border px-4 py-3 rounded-lg text-sm font-bold"
                      value={profileForm.payment_methods?.ifsc || ""} onChange={(e) => setProfileForm({...profileForm, payment_methods: {...profileForm.payment_methods, ifsc: e.target.value}})} />
                    <input type="text" placeholder="UPI / PayPal Email" className="bg-background border border-border px-4 py-3 rounded-lg text-sm font-bold"
                      value={profileForm.payment_methods?.upi || ""} onChange={(e) => setProfileForm({...profileForm, payment_methods: {...profileForm.payment_methods, upi: e.target.value}})} />
                 </div>
              </div>
           </div>
        )}

        <div className="pt-8 border-t border-border flex justify-end">
           <button onClick={() => handleProfileUpdate()} disabled={isUpdating} className="group relative bg-primary text-white px-10 py-4 rounded-xl font-bold text-xs uppercase tracking-widest overflow-hidden disabled:opacity-50 transition-transform hover:scale-[1.02] active:scale-95 shadow-xl shadow-primary/20">
              <span className="relative z-10 flex items-center gap-3">
                {isUpdating ? "Synchronizing..." : "Save Configuration"}
                <Send className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
           </button>
        </div>
      </div>
    </div>
  );
}
