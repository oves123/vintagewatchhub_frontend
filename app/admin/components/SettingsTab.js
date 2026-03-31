"use client";

import { useEffect, useState } from "react";
import { getTerms, updatePlatformSetting } from "../../../services/api";
import { Save, AlertCircle, CheckCircle2 } from "lucide-react";

export default function SettingsTab() {
  const [terms, setTerms] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchTerms();
  }, []);

  const fetchTerms = async () => {
    setLoading(true);
    try {
      const data = await getTerms();
      setTerms(data.terms_and_conditions || "");
    } catch (err) {
      console.error("Failed to fetch terms:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await updatePlatformSetting("terms_and_conditions", terms);
      if (res.message) {
        setMessage({ text: "Protocol updated successfully", type: "success" });
      } else {
        setMessage({ text: res.error || "Failed to update protocol", type: "error" });
      }
    } catch (err) {
      console.error("Failed to update terms:", err);
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
          {saving ? "Deploying..." : "Save Protocol"}
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
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
              className="flex-1 p-8 focus:outline-none text-gray-700 font-medium leading-relaxed resize-none custom-scrollbar"
              placeholder="Define platform terms and conditions..."
            />
          </div>
        </div>

        <div className="xl:col-span-4 space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
             <h3 className="text-xs font-black text-gray-900 uppercase tracking-tight mb-4">Subscription Integration</h3>
             <p className="text-[11px] text-gray-500 font-medium leading-relaxed mb-6">
                Ensure the **Subscription Model** is explicitly mentioned in the protocols. Users cannot proceed past the registration stage without verifying their acceptance of these terms.
             </p>
             <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 border-dashed">
                <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-1">Status Reminder</p>
                <p className="text-[11px] font-medium text-gray-700">Any changes deployed here are immediately live for all new users.</p>
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
