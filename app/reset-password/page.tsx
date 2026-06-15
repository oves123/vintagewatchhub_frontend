"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { resetPassword } from "../../services/api";

function ResetPasswordContent() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      setError("Invalid or expired reset token.");
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const data = await resetPassword({ token, password });
      if (data.status === "success") {
        setMessage("Password reset successful! Redirecting to login...");
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      } else {
        setError(data.message || "Something went wrong. Please try again.");
      }
    } catch (err) {
      setError("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface min-h-screen font-sans antialiased text-foreground">
      <header className="px-6 py-6 max-w-[1240px] mx-auto border-b border-border">
        <Link href="/">
          <h1 className="text-2xl font-black tracking-tighter uppercase leading-none font-serif">
            WATCH<span className="text-gold italic font-light">COLLECTOR</span>HUB
          </h1>
        </Link>
      </header>

      <main className="max-w-[1240px] mx-auto px-6 py-20 flex justify-center">
        <div className="w-full max-w-[420px] pt-4">
          <div className="mb-10 text-center">
            <h1 className="text-3xl font-serif uppercase tracking-[0.1em] mb-3">Set New Password</h1>
            <p className="text-xs text-muted font-medium">
              Please enter your new password below.
            </p>
          </div>

          {message && (
            <div className="mb-6 p-4 bg-emerald-50/50 border border-emerald-100 flex items-center gap-3 animate-in fade-in duration-300">
               <p className="text-xs font-semibold text-emerald-700">{message}</p>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-rose-50/50 border border-rose-200 flex items-center gap-3 animate-in fade-in duration-300">
               <p className="text-xs font-semibold text-rose-700">{error}</p>
            </div>
          )}

          {!token ? (
            <div className="text-center">
              <Link href="/forgot-password" className="text-xs font-bold uppercase tracking-wider text-gold hover:text-gold/80 transition-colors">
                Request a new reset link
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="relative">
                <input
                  type="password"
                  required
                  className="w-full px-4 pt-6 pb-2 bg-surface border border-border rounded-lg outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all peer text-[13px] text-foreground"
                  placeholder=" "
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  id="password"
                />
                <label 
                  htmlFor="password" 
                  className="absolute text-muted duration-300 transform -translate-y-3.5 scale-75 top-4.5 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3.5 peer-focus:text-gold text-[12px] uppercase tracking-wider"
                >
                  New Password
                </label>
              </div>

              <div className="relative">
                <input
                  type="password"
                  required
                  className="w-full px-4 pt-6 pb-2 bg-surface border border-border rounded-lg outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all peer text-[13px] text-foreground"
                  placeholder=" "
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  id="confirmPassword"
                />
                <label 
                  htmlFor="confirmPassword" 
                  className="absolute text-muted duration-300 transform -translate-y-3.5 scale-75 top-4.5 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3.5 peer-focus:text-gold text-[12px] uppercase tracking-wider"
                >
                  Confirm New Password
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-black text-white border border-black hover:bg-gold hover:text-black transition-all duration-300 rounded-lg font-serif uppercase tracking-[0.2em] text-sm font-bold disabled:opacity-50 mt-6"
              >
                {loading ? "Updating..." : "Update Password"}
              </button>
            </form>
          )}

          <div className="mt-8 text-center">
            <Link href="/login" className="text-xs font-bold uppercase tracking-wider text-gold hover:text-gold/80 transition-colors">
              Back to Sign In
            </Link>
          </div>
        </div>
      </main>

      <footer className="mt-auto py-10 border-t border-border">
         <div className="max-w-[1240px] mx-auto px-6 flex flex-col items-center gap-4 text-sm text-muted uppercase tracking-widest font-bold">
            <div className="flex gap-6">
              <Link href="/help" className="hover:underline">User Agreement</Link>
              <Link href="/privacy" className="hover:underline">Privacy Notice</Link>
              <Link href="/cookies" className="hover:underline">Cookies</Link>
            </div>
            <p>Copyright 1995-2026 AeraVintage Inc. All Rights Reserved.</p>
         </div>
      </footer>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="bg-surface min-h-screen font-sans antialiased text-foreground flex items-center justify-center">
        <p className="text-sm font-bold text-muted uppercase tracking-widest">Loading parameters...</p>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
