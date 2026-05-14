"use client";

import { useEffect, useState } from "react";
import { getTerms, updatePlatformSetting } from "@/services/api";
import Link from "next/link";

export default function AdminTermsPage() {
  const [terms, setTerms] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchTerms = async () => {
      try {
        const data = await getTerms();
        setTerms(data.terms_and_conditions || "");
      } catch (err) {
        console.error("Failed to fetch terms:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTerms();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      const res = await updatePlatformSetting("terms_and_conditions", terms);
      if (res.message) {
        setMessage("âœ… protocol updated successfully");
      }
    } catch (err) {
      console.error("Failed to update terms:", err);
      setMessage("âŒ Failed to update protocol");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-primary font-bold uppercase tracking-widest text-xs">Accessing Settings Hub...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-10 font-sans">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
          <div>
            <h1 className="text-3xl font-black text-foreground uppercase tracking-tighter">Compliance Control Center</h1>
            <p className="text-[10px] font-bold text-muted uppercase tracking-[0.2em] mt-1">Manage global marketplace terms and registration protocols</p>
          </div>
          <div className="flex gap-4">
            <Link href="/admin" className="px-6 py-3 bg-surface border border-border rounded-none text-[10px] font-bold text-muted uppercase tracking-widest hover:text-foreground transition-all">
              Exit Settings
            </Link>
            <button 
              onClick={handleSave}
              disabled={saving}
              className="px-8 py-3 bg-primary text-white rounded-none text-[10px] font-bold uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 disabled:opacity-50"
            >
              {saving ? "Deploying..." : "Deploy protocol Updates"}
            </button>
          </div>
        </div>

        {message && (
          <div className={`mb-8 p-4 rounded-none text-[11px] font-black uppercase tracking-widest text-center ${message.includes('âœ…') ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8">
            <div className="bg-surface rounded-3xl shadow-xl shadow-gray-200/50 border border-border overflow-hidden overflow-hidden">
               <div className="p-4 border-b border-gray-50 bg-background/50 flex items-center justify-between">
                  <span className="text-[10px] font-black text-muted uppercase tracking-widest">Protocol Editor (Markdown Supported)</span>
                  <div className="flex gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                    <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                  </div>
               </div>
               <textarea 
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  className="w-full h-[70vh] p-8 focus:outline-none text-muted font-medium leading-relaxed resize-none custom-scrollbar"
                  placeholder="Enter marketplace terms and conditions..."
               />
            </div>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <div className="bg-surface p-8 rounded-3xl border border-border shadow-sm">
                <h3 className="text-sm font-black text-foreground uppercase tracking-tight mb-4">Subscription Integration</h3>
                <p className="text-xs text-muted leading-relaxed mb-6">
                  Ensure the **Subscription Model** parameters are clearly defined. Users are required to explicitly acknowledge these terms before registration is finalized.
                </p>
                <div className="space-y-3">
                   <div className="p-4 bg-blue-50/50 rounded-none border border-blue-100">
                      <p className="text-[10px] font-black text-primary uppercase tracking-widest">Dynamic Variable</p>
                      <p className="text-xs font-bold text-muted mt-1">[[subscription_tiers]]</p>
                   </div>
                </div>
            </div>

            <div className="bg-foreground p-8 rounded-3xl shadow-xl">
                <h3 className="text-sm font-black text-white uppercase tracking-tight mb-4">Protocol Insights</h3>
                <div className="space-y-4">
                   <div className="flex justify-between items-center py-2 border-b border-white/10">
                      <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Status</span>
                      <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest underline decoration-2 underline-offset-4">Active</span>
                   </div>
                   <div className="flex justify-between items-center py-2">
                      <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Last Update</span>
                      <span className="text-[10px] text-white font-bold uppercase tracking-widest">{new Date().toLocaleDateString()}</span>
                   </div>
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
