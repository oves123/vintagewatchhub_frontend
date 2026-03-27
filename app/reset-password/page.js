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
    <div className="bg-white min-h-screen font-sans antialiased text-[#191919]">
      <header className="px-6 py-6 max-w-[1240px] mx-auto">
        <Link href="/">
          <h1 className="text-2xl font-black tracking-tighter uppercase leading-none">
            WATCH<span className="text-blue-600">COLLECTOR</span>HUB
          </h1>
        </Link>
      </header>

      <main className="max-w-[1240px] mx-auto px-6 py-10 flex justify-center">
        <div className="w-full max-w-[420px] pt-4">
          <div className="mb-10 text-center">
            <h1 className="text-3xl font-black mb-1">Set New Password</h1>
            <p className="text-sm">
              Please enter your new password below.
            </p>
          </div>

          {message && (
            <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 flex items-center gap-3 animate-in fade-in duration-300">
               <p className="text-sm font-medium text-green-800">{message}</p>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 flex items-center gap-3 animate-in fade-in duration-300">
               <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          )}

          {!token ? (
            <div className="text-center">
              <Link href="/forgot-password" size="sm" className="text-sm font-medium text-blue-600 hover:underline">
                Request a new reset link
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
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
                  New Password
                </label>
              </div>

              <div className="relative">
                <input
                  type="password"
                  required
                  className="w-full px-4 pt-6 pb-2 bg-white border border-gray-300 rounded-lg outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all peer"
                  placeholder=" "
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  id="confirmPassword"
                />
                <label 
                  htmlFor="confirmPassword" 
                  className="absolute text-gray-500 duration-300 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 peer-focus:text-blue-600"
                >
                  Confirm New Password
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-blue-600 text-white rounded-full font-bold text-base hover:bg-blue-700 transition-colors shadow-sm active:scale-[0.99] disabled:opacity-50 mt-4"
              >
                {loading ? "Updating..." : "Update Password"}
              </button>
            </form>
          )}

          <div className="mt-8 text-center">
            <Link href="/login" className="text-sm font-medium text-blue-600 hover:underline">
              Back to Sign In
            </Link>
          </div>
        </div>
      </main>

      <footer className="mt-auto py-10 border-t border-gray-200">
         <div className="max-w-[1240px] mx-auto px-6 flex flex-col items-center gap-4 text-[11px] text-gray-500 uppercase tracking-widest font-bold">
            <div className="flex gap-6">
              <Link href="/help" className="hover:underline">User Agreement</Link>
              <Link href="/privacy" className="hover:underline">Privacy Notice</Link>
              <Link href="/cookies" className="hover:underline">Cookies</Link>
            </div>
            <p>Copyright © 1995-2026 WatchCollectorHub Inc. All Rights Reserved.</p>
         </div>
      </footer>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="bg-white min-h-screen font-sans antialiased text-[#191919] flex items-center justify-center">
        <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Loading parameters...</p>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
