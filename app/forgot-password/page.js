"use client";
import React, { useState } from "react";
import Link from "next/link";
import { forgotPassword } from "@/services/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: "", message: "" });

    try {
      const res = await forgotPassword(email);
      if (res.error) {
        setStatus({ type: "error", message: res.error });
      } else {
        setStatus({ 
          type: "success", 
          message: "If an account exists with that email, a reset link has been sent. Please check your inbox (and console if in dev mode)." 
        });
      }
    } catch (err) {
      setStatus({ type: "error", message: "Something went wrong. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B1221] px-4 py-12">
      <div className="max-w-md w-full space-y-8 bg-[#161F32] p-8 rounded-none border border-border/40 shadow-2xl">
        <div className="text-center">
          <h2 className="text-3xl font-serif uppercase tracking-[0.1em] text-white mb-3">Forgot Password?</h2>
          <p className="text-muted text-xs">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-2">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-4 py-3 bg-[#0B1221] border border-border/40 rounded-none text-white focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all text-[13px]"
              placeholder="name@example.com"
            />
          </div>

          {status.message && (
            <div className={`p-4 rounded-none text-xs font-semibold ${
              status.type === "success" ? "bg-emerald-950/30 text-emerald-400 border border-emerald-900" : "bg-rose-950/30 text-rose-400 border border-rose-900"
            }`}>
              {status.message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-4 px-4 border border-transparent rounded-none shadow-none text-[11px] font-bold uppercase tracking-[0.2em] text-[#0B1221] bg-[#C5A059] hover:bg-[#B38F48] focus:outline-none focus:ring-1 focus:ring-[#C5A059] disabled:opacity-50 transition-all font-serif"
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>

          <div className="text-center">
            <Link href="/login" className="text-xs font-bold uppercase tracking-wider text-[#C5A059] hover:text-[#B38F48] transition-colors">
              Back to Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
