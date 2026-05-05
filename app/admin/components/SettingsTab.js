"use client";

import { useEffect, useState } from "react";
import { getAdminSettings, updatePlatformSetting } from "../../../services/api";
import { Save, AlertCircle, CheckCircle2, Percent, Receipt } from "lucide-react";

export default function SettingsTab() {
  const [settings, setSettings] = useState({
    terms_and_conditions: "",
    seller_commission_rate: "5",
    buyer_commission_rate: "0"
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const data = await getAdminSettings();
      setSettings(prev => ({
        ...prev,
        ...data
      }));
    } catch (err) {
      console.error("Failed to fetch settings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const updates = [
        updatePlatformSetting("terms_and_conditions", settings.terms_and_conditions),
        updatePlatformSetting("seller_commission_rate", settings.seller_commission_rate),
        updatePlatformSetting("buyer_commission_rate", settings.buyer_commission_rate)
      ];
      await Promise.all(updates);
      setMessage({ text: "Settings updated successfully", type: "success" });
    } catch (err) {
      console.error("Failed to update settings:", err);
      setMessage({ text: "System error during update", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-blue-600 font-bold uppercase tracking-widest text-[10px]">Accessing Secure Protocol...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Platform Settings</h2>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-1">Manage global registration protocols and terms</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-8 py-3 bg-[#1e3a5f] text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 disabled:opacity-50"
        >
          <Save size={14} />
          {saving ? "Deploying..." : "Save Settings"}
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top-2 duration-300 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}>
          {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span className="text-[11px] font-black uppercase tracking-widest">{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        <div className="xl:col-span-8">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-[70vh]">
            <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
               <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Protocol Editor (Markdown Supported)</span>
            </div>
            <textarea
              value={settings.terms_and_conditions}
              onChange={(e) => setSettings({...settings, terms_and_conditions: e.target.value})}
              className="flex-1 p-8 focus:outline-none text-gray-700 font-medium leading-relaxed resize-none custom-scrollbar"
              placeholder="Define platform terms and conditions..."
            />
          </div>
        </div>

        <div className="xl:col-span-4 space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
             <h3 className="text-xs font-black text-gray-900 uppercase tracking-tight mb-4 flex items-center gap-2">
               <Receipt size={16} className="text-blue-600" />
               Financial Settings
             </h3>
             <div className="space-y-4">
               <div>
                 <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Seller Commission Rate (%)</label>
                 <div className="relative">
                   <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                     <Percent size={14} className="text-gray-400" />
                   </div>
                   <input
                     type="number"
                     min="0"
                     max="100"
                     step="0.1"
                     value={settings.seller_commission_rate}
                     onChange={(e) => setSettings({...settings, seller_commission_rate: e.target.value})}
                     className="w-full pl-9 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm font-medium"
                   />
                 </div>
                 <p className="text-[10px] text-gray-500 mt-1">Deducted from the seller's final payout.</p>
               </div>
               
               <div>
                 <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Buyer Commission Rate (%)</label>
                 <div className="relative">
                   <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                     <Percent size={14} className="text-gray-400" />
                   </div>
                   <input
                     type="number"
                     min="0"
                     max="100"
                     step="0.1"
                     value={settings.buyer_commission_rate}
                     onChange={(e) => setSettings({...settings, buyer_commission_rate: e.target.value})}
                     className="w-full pl-9 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm font-medium"
                   />
                 </div>
                 <p className="text-[10px] text-gray-500 mt-1">Added to the buyer's checkout total.</p>
               </div>
             </div>
          </div>

          <div className="bg-[#1e3a5f] p-8 rounded-3xl shadow-xl">
             <h3 className="text-xs font-black text-white uppercase tracking-tight mb-6 flex items-center gap-2">
                <ShieldCheck className="text-[#b8860b]" size={14} />
                Governance Protocol
             </h3>
             <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-white/10 text-[10px] font-bold uppercase tracking-widest">
                   <span className="text-white/40">Encryption</span>
                   <span className="text-emerald-400">Active</span>
                </div>
                <div className="flex justify-between items-center py-2 text-[10px] font-bold uppercase tracking-widest text-white">
                   <span className="text-white/40">Audit Logging</span>
                   <span>Enabled</span>
                </div>
             </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f8fafc;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </div>
  );
}

function ShieldCheck({ size, className }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      <path d="m9 12 2 2 4-4"/>
    </svg>
  );
}
