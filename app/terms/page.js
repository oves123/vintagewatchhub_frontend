"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getTerms, acceptTerms } from "../../services/api";
import Navbar from "../../components/Navbar";

export default function TermsPage() {
  const router = useRouter();
  const [terms, setTerms] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchTerms = async () => {
      try {
        const data = await getTerms();
        setTerms(data.terms_and_conditions || "Terms and Conditions not found. Please contact support.");
      } catch (err) {
        console.error("Failed to fetch terms:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTerms();
  }, []);

  const handleAccept = async () => {
    if (!accepted) return;
    setSubmitting(true);
    try {
      const res = await acceptTerms();
      if (res.terms_accepted) {
        // Update local storage user object
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const user = JSON.parse(storedUser);
          user.terms_accepted = true;
          localStorage.setItem("user", JSON.stringify(user));
        }
        router.push("/");
        router.refresh();
      }
    } catch (err) {
      console.error("Failed to accept terms:", err);
      alert("Failed to accept terms. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-pulse text-blue-600 font-bold uppercase tracking-widest text-xs">Loading Terms...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] font-sans">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-20">
        <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 md:p-16 border border-gray-100 animate-in fade-in slide-in-from-bottom-10 duration-700">
          <div className="mb-10 text-center">
            <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tighter mb-4">Platform Protocol</h1>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.2em]">Please review the updated marketplace terms & conditions</p>
          </div>

          <div className="prose prose-blue max-w-none mb-12 max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar bg-gray-50/50 p-8 rounded-3xl border border-gray-100 text-gray-700 leading-relaxed">
             <div dangerouslySetInnerHTML={{ __html: terms.replace(/\n/g, '<br />') }} />
          </div>

          <div className="space-y-8">
            <label className="flex items-start gap-4 p-6 bg-blue-50/50 border border-blue-100 rounded-2xl cursor-pointer group hover:bg-blue-50 transition-all">
              <input 
                type="checkbox" 
                checked={accepted} 
                onChange={() => setAccepted(!accepted)}
                className="mt-1 w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 transition-all cursor-pointer"
              />
              <span className="text-sm font-semibold text-gray-700 leading-snug group-hover:text-gray-900 transition-colors">
                I have read and agree to the Terms & Conditions. I specifically acknowledge and accept the <span className="text-blue-600 font-bold uppercase tracking-tighter">Subscription Model</span> and platform fee structures.
              </span>
            </label>

            <button
              onClick={handleAccept}
              disabled={!accepted || submitting}
              className="w-full h-16 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] hover:bg-blue-600 disabled:opacity-20 disabled:hover:bg-gray-900 transition-all shadow-xl shadow-gray-200/50 flex items-center justify-center gap-3 active:scale-95"
            >
              {submitting ? "Processing Protocol..." : "Accept & Continue Access"}
            </button>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
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
