"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import WCHLogo from "../../components/WCHLogo";
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
        <WCHLogo />
      </header>

      <main className="flex-grow flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[440px] bg-background rounded-xl border border-border p-8 sm:p-12">
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
                className="w-full px-4 pt-6 pb-2 bg-transparent border border-border rounded-lg outline-none focus:border-gold transition-all peer text-[13px] text-foreground"
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
                className="w-full px-4 pt-6 pb-2 bg-transparent border border-border rounded-lg outline-none focus:border-gold transition-all peer text-[13px] text-foreground"
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
                <Link href="/forgot-password" className="text-sm font-bold text-muted hover:text-gold uppercase tracking-wider transition-colors">
                  Forgot?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-black text-white border border-black hover:bg-gold hover:text-black transition-all duration-300 rounded-lg font-serif uppercase tracking-[0.2em] text-sm font-bold disabled:opacity-50 mt-6"
            >
              {loading ? "Signing in..." : "Enter Boutique"}
            </button>
          </form>
        </div>
      </main>

      <footer className="py-8 border-t border-border text-center bg-background">
        <p className="text-xs font-serif uppercase tracking-widest text-muted">© 2026 Aera Inc. All Rights Reserved.</p>
      </footer>
    </div>
  );
}

