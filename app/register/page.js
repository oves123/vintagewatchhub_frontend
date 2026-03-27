"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { registerUser } from "../../services/api";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    city: "",
    state: "",
    pincode: "",
    password: "",
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
    <div className="bg-[#fafafa] min-h-screen font-sans antialiased text-[#191919] flex flex-col">
      {/* Header */}
      <header className="px-5 py-4 bg-white border-b border-gray-100 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
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
        <p className="text-sm text-gray-500">
           Already a member? <Link href="/login" className="text-blue-600 hover:underline font-semibold">Sign in</Link>
        </p>
      </header>
      
      <main className="flex-1 flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-[420px] bg-white rounded-2xl shadow-sm border border-gray-100 p-8 sm:p-10">
          <div className="mb-8">
            <h1 className="text-3xl font-black mb-1">Create an account</h1>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 flex items-center gap-3">
               <svg className="w-5 h-5 text-red-500 fill-current" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"/></svg>
               <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <input
                type="text"
                required
                className="w-full px-4 pt-6 pb-2 bg-white border border-gray-300 rounded-lg outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all peer"
                placeholder=" "
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                id="name"
              />
              <label 
                htmlFor="name" 
                className="absolute text-gray-500 duration-300 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 peer-focus:text-blue-600"
              >
                Full Name
              </label>
            </div>

            <div className="relative">
              <input
                type="email"
                required
                className="w-full px-4 pt-6 pb-2 bg-white border border-gray-300 rounded-lg outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all peer"
                placeholder=" "
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
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
                type="tel"
                required
                className="w-full px-4 pt-6 pb-2 bg-white border border-gray-300 rounded-lg outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all peer"
                placeholder=" "
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                id="phone"
              />
              <label 
                htmlFor="phone" 
                className="absolute text-gray-500 duration-300 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 peer-focus:text-blue-600"
              >
                Phone Number
              </label>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <input
                  type="text"
                  required
                  className="w-full px-4 pt-6 pb-2 bg-white border border-gray-300 rounded-lg outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all peer"
                  placeholder=" "
                  value={formData.city}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                  id="city"
                />
                <label 
                  htmlFor="city" 
                  className="absolute text-gray-500 duration-300 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 peer-focus:text-blue-600"
                >
                  City
                </label>
              </div>

              <div className="relative">
                <input
                  type="text"
                  required
                  className="w-full px-4 pt-6 pb-2 bg-white border border-gray-300 rounded-lg outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all peer"
                  placeholder=" "
                  value={formData.state}
                  onChange={(e) => setFormData({...formData, state: e.target.value})}
                  id="state"
                />
                <label 
                  htmlFor="state" 
                  className="absolute text-gray-500 duration-300 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 peer-focus:text-blue-600"
                >
                  State
                </label>
              </div>
            </div>

            <div className="relative">
              <input
                type="text"
                required
                className="w-full px-4 pt-6 pb-2 bg-white border border-gray-300 rounded-lg outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all peer"
                placeholder=" "
                value={formData.pincode}
                onChange={(e) => setFormData({...formData, pincode: e.target.value})}
                id="pincode"
              />
              <label 
                htmlFor="pincode" 
                className="absolute text-gray-500 duration-300 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 peer-focus:text-blue-600"
              >
                Pincode
              </label>
            </div>

            <div className="relative">
              <input
                type="password"
                required
                className="w-full px-4 pt-6 pb-2 bg-white border border-gray-300 rounded-lg outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all peer"
                placeholder=" "
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                id="password"
              />
              <label 
                htmlFor="password" 
                className="absolute text-gray-500 duration-300 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 peer-focus:text-blue-600"
              >
                Password
              </label>
            </div>

            <p className="text-[11px] text-gray-500 py-2">
              By selecting **Create account**, you agree to our <span className="text-blue-600">User Agreement</span> and acknowledge reading our <span className="text-blue-600">Privacy Notice</span>.
            </p>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-blue-600 text-white rounded-full font-bold text-base hover:bg-blue-700 transition-colors shadow-sm active:scale-[0.99] disabled:opacity-50 mt-2"
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <div className="mt-8 text-center text-[13px] text-gray-500">
             By joining, you help us keep the marketplace safe and fair for all collectors.
          </div>
        </div>
      </main>

      <footer className="py-8 border-t border-gray-100 text-center">
        <p className="text-[11px] text-gray-400">&copy; 2026 WatchCollectorHub Inc. All Rights Reserved.</p>
      </footer>
    </div>
  );
}
