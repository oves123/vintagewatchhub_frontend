"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import WCHLogo from "../../components/WCHLogo";
import { useRouter } from "next/navigation";
import { registerUser } from "../../services/api";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    seller_type: "individual_collector",
    gst_number: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (localStorage.getItem("token")) {
      router.push("/");
    }
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const data = await registerUser(formData);
      if (data.message === "User registered successfully") {
         router.push("/login?registered=success");
      } else {
        setError(data.message || data.error || "Enrollment failed. Please check your details.");
      }
    } catch (err) {
      setError("Registration system currently unavailable. Please try later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background min-h-screen font-sans antialiased text-foreground flex flex-col justify-between">
      {/* Header */}
      <header className="px-6 py-5 bg-background border-b border-border flex items-center justify-between">
        <WCHLogo />
        <p className="text-xs font-serif uppercase tracking-widest text-muted">
           Member? <Link href="/login" className="text-gold hover:text-gold/80 transition-colors underline font-bold">Sign In</Link>
        </p>
      </header>
      
      <main className="flex-grow flex items-center justify-center px-6 py-12">
        <div className="card-3d w-full max-w-[440px] bg-background rounded-none border border-border p-8 sm:p-12">
          <div className="mb-10 text-center">
            <h1 className="text-2xl font-serif uppercase tracking-[0.2em] text-foreground mb-3">Register</h1>
            <p className="text-xs text-muted font-medium">Join our global community of collectors</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-rose-50/50 border border-rose-200 flex items-center gap-3 animate-in fade-in duration-300">
               <svg className="w-4 h-4 text-rose-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
               </svg>
               <p className="text-xs font-semibold text-rose-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
              <input
                type="text"
                required
                className="w-full px-4 pt-6 pb-2 bg-transparent border border-border rounded-lg outline-none focus:border-gold transition-all peer text-[13px] text-foreground"
                placeholder=" "
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                id="name"
              />
              <label 
                htmlFor="name" 
                className="absolute text-muted duration-300 transform -translate-y-3.5 scale-75 top-4.5 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3.5 peer-focus:text-gold text-[12px] uppercase tracking-wider"
              >
                Full Name
              </label>
            </div>

            <div className="relative">
              <input
                type="email"
                required
                className="w-full px-4 pt-6 pb-2 bg-transparent border border-border rounded-lg outline-none focus:border-gold transition-all peer text-[13px] text-foreground"
                placeholder=" "
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                id="email"
              />
              <label 
                htmlFor="email" 
                className="absolute text-muted duration-300 transform -translate-y-3.5 scale-75 top-4.5 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3.5 peer-focus:text-gold text-[12px] uppercase tracking-wider"
              >
                Email Address
              </label>
            </div>

            <div className="relative">
              <input
                type="password"
                required
                className="w-full px-4 pt-6 pb-2 bg-transparent border border-border rounded-lg outline-none focus:border-gold transition-all peer text-[13px] text-foreground"
                placeholder=" "
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                id="password"
              />
              <label 
                htmlFor="password" 
                className="absolute text-muted duration-300 transform -translate-y-3.5 scale-75 top-4.5 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3.5 peer-focus:text-gold text-[12px] uppercase tracking-wider"
              >
                Password
              </label>
            </div>

            <div className="relative">
              <select
                className="w-full px-4 pt-6 pb-2 bg-transparent border border-border rounded-lg outline-none focus:border-gold transition-all peer appearance-none text-[13px] text-foreground"
                value={formData.seller_type}
                onChange={(e) => setFormData({...formData, seller_type: e.target.value})}
                id="seller_type"
              >
                <option value="individual_collector" className="bg-background">Individual Collector</option>
                <option value="business_seller" className="bg-background">Business Seller</option>
              </select>
              <label 
                htmlFor="seller_type" 
                className="absolute text-muted duration-300 transform -translate-y-3.5 scale-75 top-4.5 z-10 origin-[0] left-4 text-[12px] uppercase tracking-wider"
              >
                Account Type
              </label>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted mt-2">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
              </div>
            </div>

            {formData.seller_type === 'business_seller' && (
              <div className="relative animate-in fade-in slide-in-from-top-1 duration-200">
                <input
                  type="text"
                  required
                  className="w-full px-4 pt-6 pb-2 bg-transparent border border-border rounded-lg outline-none focus:border-gold transition-all peer text-[13px] text-foreground"
                  placeholder=" "
                  value={formData.gst_number}
                  onChange={(e) => setFormData({...formData, gst_number: e.target.value})}
                  id="gst_number"
                />
                <label 
                  htmlFor="gst_number" 
                  className="absolute text-muted duration-300 transform -translate-y-3.5 scale-75 top-4.5 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3.5 peer-focus:text-gold text-[12px] uppercase tracking-wider"
                >
                  GST Number
                </label>
              </div>
            )}

            <p className="text-xs text-muted leading-relaxed">
              By selecting **Create account**, you agree to our <span className="text-gold font-bold underline cursor-pointer">User Agreement</span> and acknowledge reading our <span className="text-gold font-bold underline cursor-pointer">Privacy Notice</span>.
            </p>

            <button
              type="submit"
              disabled={loading}
              className="hover-3d w-full py-4 bg-black text-white border border-black hover:bg-gold hover:text-black transition-all duration-300 rounded-lg font-serif uppercase tracking-[0.2em] text-sm font-bold disabled:opacity-50 mt-6"
            >
              {loading ? "Enrolling..." : "Create Account"}
            </button>
          </form>

          <div className="mt-8 text-center text-[12px] text-muted">
             By joining, you help us keep the marketplace safe and fair for all collectors.
          </div>
        </div>
      </main>

      <footer className="py-8 border-t border-border text-center bg-background">
        <p className="text-xs font-serif uppercase tracking-widest text-muted">&copy; 2026 AeraVintage Inc. All Rights Reserved.</p>
      </footer>
    </div>
  );
}
