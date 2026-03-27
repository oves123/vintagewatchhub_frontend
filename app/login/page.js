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
    <div className="bg-[#fafafa] min-h-screen font-sans antialiased text-[#191919] flex flex-col">
      {/* Header */}
      <header className="px-5 py-4 bg-white border-b border-gray-100">
        <Link href="/" className="flex items-center gap-2 w-fit">
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="18" r="12" stroke="#1e3a5f" strokeWidth="2"/>
            <circle cx="16" cy="18" r="8" stroke="#b8860b" strokeWidth="1.5"/>
            <line x1="16" y1="10" x2="16" y2="18" stroke="#1e3a5f" strokeWidth="2" strokeLinecap="round"/>
            <line x1="16" y1="18" x2="21" y2="18" stroke="#b8860b" strokeWidth="2" strokeLinecap="round"/>
            <path d="M10 6 L12 3 L14 5 L16 2 L18 5 L20 3 L22 6 Z" fill="#b8860b"/>
            <circle cx="16" cy="18" r="1.5" fill="#1e3a5f"/>
          </svg>
          <span className="font-bold tracking-tight text-gray-950 text-[17px] leading-none">
            Watch<span className="text-[#1e3a5f]">Collector</span><span className="text-[#b8860b] font-black">HUB</span>
          </span>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-[420px] bg-white rounded-2xl shadow-sm border border-gray-100 p-8 sm:p-10">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-black mb-1">Hello</h1>
            <p className="text-sm">
              Sign in to The Hub or <Link href="/register" className="text-blue-600 hover:underline">create an account</Link>
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 flex items-center gap-3 animate-in fade-in duration-300">
               <svg className="w-5 h-5 text-red-500 fill-current" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"/></svg>
               <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <input
                type="email"
                required
                className="w-full px-4 pt-6 pb-2 bg-white border border-gray-300 rounded-lg outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all peer"
                placeholder=" "
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                id="email"
              />
              <label 
                htmlFor="email" 
                className="absolute text-gray-500 duration-300 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 peer-focus:text-blue-600"
              >
                Email
              </label>
            </div>

            <div className="relative">
              <input
                type="password"
                required
                className="w-full px-4 pt-6 pb-2 bg-white border border-gray-300 rounded-lg outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all peer"
                placeholder=" "
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                id="password"
              />
              <label 
                htmlFor="password" 
                className="absolute text-gray-500 duration-300 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 peer-focus:text-blue-600"
              >
                Password
              </label>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pt-4">
                <Link href="/forgot-password" className="text-sm font-medium text-blue-600 hover:underline">
                  Forgot?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-blue-600 text-white rounded-full font-bold text-base hover:bg-blue-700 transition-colors shadow-sm active:scale-[0.99] disabled:opacity-50 mt-4"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>
      </main>

      <footer className="py-8 border-t border-gray-100 text-center">
        <p className="text-[11px] text-gray-400">© 2026 WatchCollectorHub Inc. All Rights Reserved.</p>
      </footer>
    </div>
  );
}
