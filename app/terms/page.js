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
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="animate-pulse text-gold font-bold uppercase tracking-widest text-xs">Loading Protocol...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-sans">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-20">
        <div className="bg-surface rounded-xl p-8 md:p-16 border border-border animate-in fade-in slide-in-from-bottom-10 duration-700">
          <div className="mb-10 text-center">
            <h1 className="text-4xl font-black text-foreground uppercase tracking-tighter mb-4">Platform Protocol</h1>
            <p className="text-sm font-bold text-muted uppercase tracking-[0.2em]">Please review the updated marketplace terms & conditions</p>
          </div>

          <div className="prose prose-stone max-w-none mb-12 max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar bg-background/50 p-8 rounded-xl border border-border text-muted leading-relaxed">
             <div dangerouslySetInnerHTML={{ __html: terms.replace(/\n/g, '<br />') }} />
          </div>

          <div className="space-y-8">
            <label className="flex items-start gap-4 p-6 bg-gold/5 border border-gold/10 rounded-xl cursor-pointer group hover:bg-gold/10 transition-all">
              <input 
                type="checkbox" 
                checked={accepted} 
                onChange={() => setAccepted(!accepted)}
                className="mt-1 w-5 h-5 rounded-lg border-border text-gold focus:ring-gold transition-all cursor-pointer"
              />
              <span className="text-sm font-semibold text-muted leading-snug group-hover:text-foreground transition-colors">
                I have read and agree to the Terms & Conditions. I specifically acknowledge and accept the <span className="text-gold font-bold uppercase tracking-tighter">Subscription Model</span> and platform fee structures.
              </span>
            </label>

            <button
              onClick={handleAccept}
              disabled={!accepted || submitting}
              className="w-full h-16 bg-foreground text-white rounded-lg font-black text-xs uppercase tracking-[0.3em] hover:bg-gold hover:text-black disabled:opacity-20 disabled:hover:bg-foreground transition-all flex items-center justify-center gap-3 active:scale-95"
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
          border-radius: 0px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </div>
  );
}
