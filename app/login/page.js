"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { loginUser } from "../../services/api";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Redirect if already logged in
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
      const data = await loginUser({ email, password });
      if (data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        
        // Use window.location for hard refresh to clear any old state
        if (data.user?.role === "admin") {
          window.location.href = "/admin";
        } else {
          window.location.href = "/";
        }
      } else {
        setError(data.message || "Invalid credentials. Please try again.");
      }
    } catch (err) {
      setError("Unable to connect to the server. Check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background min-h-screen font-sans antialiased text-foreground flex flex-col justify-between">
      {/* Header */}
      <header className="px-6 py-5 bg-background border-b border-border flex justify-center md:justify-start">
        <Link href="/" className="flex items-center gap-2 w-fit">
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="18" r="12" stroke="#1e3a5f" strokeWidth="2"/>
            <circle cx="16" cy="18" r="8" stroke="#b8860b" strokeWidth="1.5"/>
            <line x1="16" y1="10" x2="16" y2="18" stroke="#1e3a5f" strokeWidth="2" strokeLinecap="round"/>
            <line x1="16" y1="18" x2="21" y2="18" stroke="#b8860b" strokeWidth="2" strokeLinecap="round"/>
            <path d="M10 6 L12 3 L14 5 L16 2 L18 5 L20 3 L22 6 Z" fill="#b8860b"/>
            <circle cx="16" cy="18" r="1.5" fill="#1e3a5f"/>
          </svg>
          <span className="font-serif font-black tracking-widest text-foreground text-[16px] sm:text-[18px] leading-none">
            Watch<span className="text-gold italic font-light">Collector</span><span className="text-gold">HUB</span>
          </span>
        </Link>
      </header>

      <main className="flex-grow flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[440px] bg-background rounded-none border border-border p-8 sm:p-12">
          <div className="mb-10 text-center">
            <h1 className="text-2xl font-serif uppercase tracking-[0.2em] text-foreground mb-3">Sign In</h1>
            <p className="text-xs text-muted font-medium">
              Access the boutique or{" "}
              <Link href="/register" className="text-gold hover:text-gold/80 transition-colors underline font-bold">
                Create an Account
              </Link>
            </p>
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
                type="email"
                required
                className="w-full px-4 pt-6 pb-2 bg-transparent border border-border rounded-none outline-none focus:border-gold transition-all peer text-[13px] text-foreground"
                placeholder=" "
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                className="w-full px-4 pt-6 pb-2 bg-transparent border border-border rounded-none outline-none focus:border-gold transition-all peer text-[13px] text-foreground"
                placeholder=" "
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                id="password"
              />
              <label 
                htmlFor="password" 
                className="absolute text-muted duration-300 transform -translate-y-3.5 scale-75 top-4.5 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3.5 peer-focus:text-gold text-[12px] uppercase tracking-wider"
              >
                Password
              </label>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pt-4">
                <Link href="/forgot-password" className="text-[11px] font-bold text-muted hover:text-gold uppercase tracking-wider transition-colors">
                  Forgot?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-black text-white border border-black hover:bg-gold hover:text-black transition-all duration-300 rounded-none font-serif uppercase tracking-[0.2em] text-[11px] font-bold disabled:opacity-50 mt-6"
            >
              {loading ? "Signing in..." : "Enter Boutique"}
            </button>
          </form>
        </div>
      </main>

      <footer className="py-8 border-t border-border text-center bg-background">
        <p className="text-[10px] font-serif uppercase tracking-widest text-muted">© 2026 WatchCollectorHub Inc. All Rights Reserved.</p>
      </footer>
    </div>
  );
}

