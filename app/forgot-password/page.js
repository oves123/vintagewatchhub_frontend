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
      <div className="max-w-md w-full space-y-8 bg-[#161F32] p-8 rounded-2xl border border-gray-800 shadow-2xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white mb-2">Forgot Password?</h2>
          <p className="text-gray-400 text-sm">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-4 py-3 bg-[#0B1221] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#C5A059] transition-all"
              placeholder="name@example.com"
            />
          </div>

          {status.message && (
            <div className={`p-4 rounded-lg text-sm ${
              status.type === "success" ? "bg-green-900/30 text-green-400 border border-green-800" : "bg-red-900/30 text-red-400 border border-red-800"
            }`}>
              {status.message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-[#0B1221] bg-[#C5A059] hover:bg-[#B38F48] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#C5A059] disabled:opacity-50 transition-colors"
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>

          <div className="text-center">
            <Link href="/login" className="text-sm font-medium text-[#C5A059] hover:text-[#B38F48]">
              Back to Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
