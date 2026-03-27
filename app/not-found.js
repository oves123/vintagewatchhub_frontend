"use client";

import Link from "next/link";
import Navbar from "../components/Navbar";

export default function NotFound() {
  return (
    <div className="bg-[#fcfcfc] min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow flex items-center justify-center px-4 py-20">
        <div className="max-w-2xl w-full text-center">
          {/* Animated SVG Backdrop */}
          <div className="relative mb-12">
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] select-none pointer-events-none">
               <span className="text-[20rem] font-black tracking-tighter">404</span>
            </div>
            
            <div className="relative z-10 w-32 h-32 bg-white rounded-[2.5rem] shadow-xl border border-gray-100 flex items-center justify-center text-5xl mx-auto shadow-gray-200/50 animate-bounce-slow">
              🔭
            </div>
          </div>

          <h1 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tighter uppercase mb-6 drop-shadow-sm">
            Lost in the <span className="text-blue-600">Collection</span>.
          </h1>
          
          <p className="text-gray-400 font-bold uppercase tracking-[0.3em] text-xs mb-12 max-w-md mx-auto leading-relaxed">
            The asset or terminal you are attempting to access has been de-listed or moved to a restricted vault.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto">
            <Link 
              href="/" 
              className="flex items-center justify-center gap-3 px-8 py-5 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all shadow-2xl active:scale-[0.98]"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Return Home
            </Link>
            
            <button 
              onClick={() => window.history.back()}
              className="flex items-center justify-center gap-3 px-8 py-5 bg-white border-2 border-gray-100 text-gray-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:border-gray-900 transition-all active:scale-[0.98]"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Previous Vault
            </button>
          </div>

          <div className="mt-20 pt-10 border-t border-gray-50">
             <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.4em]">
               System Error Code: 0x404_HUB_VAULT_MISSING
             </p>
          </div>
        </div>
      </main>

      <footer className="py-10 text-center opacity-20 grayscale">
         <h2 className="text-xl font-black tracking-tighter text-gray-900 uppercase">
            WATCH<span className="text-blue-600">COLLECTOR</span>HUB
         </h2>
      </footer>
    </div>
  );
}
