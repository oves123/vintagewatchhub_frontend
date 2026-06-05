"use client";

import Link from "next/link";
import Navbar from "../components/Navbar";

export default function NotFound() {
  return (
    <div className="bg-background min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow flex items-center justify-center px-4 py-20">
        <div className="max-w-2xl w-full text-center">
          {/* Animated Pocket Watch */}
          <div className="relative mb-12 flex justify-center">
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] select-none pointer-events-none">
               <span className="text-[20rem] font-black tracking-tighter text-foreground">404</span>
            </div>
            
            <div className="relative z-10 w-40 h-40 rounded-full border-2 border-gold/30 flex items-center justify-center bg-background shadow-2xl shadow-gold/5 hover:shadow-gold/20 transition-shadow duration-700 group">
              {/* Pocket watch crown */}
              <div className="absolute -top-3 w-6 h-3 bg-gold/40 rounded-t-full border border-gold/30"></div>
              {/* Watch face */}
              <div className="w-32 h-32 rounded-full border border-border relative flex items-center justify-center bg-surface/50">
                {/* Hour markers */}
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((h) => (
                  <div
                    key={h}
                    className="absolute w-0.5 h-2.5 bg-muted/40 rounded-full"
                    style={{
                      transform: `rotate(${h * 30}deg) translateY(-42px)`,
                      transformOrigin: "50% 42px",
                    }}
                  />
                ))}
                {/* Hour hand */}
                <div className="absolute w-1 h-10 bg-foreground/60 rounded-full animate-[crownRotate_12s_linear_infinite] origin-bottom" style={{ transformOrigin: 'bottom center', top: 'calc(50% - 40px)' }}></div>
                {/* Minute hand */}
                <div className="absolute w-0.5 h-14 bg-gold/60 rounded-full animate-[crownRotate_1s_linear_infinite] origin-bottom" style={{ transformOrigin: 'bottom center', top: 'calc(50% - 56px)' }}></div>
                {/* Center dot */}
                <div className="w-3 h-3 rounded-full bg-gold absolute"></div>
                {/* Brand text */}
                <span className="absolute bottom-7 text-[6px] text-muted uppercase tracking-[0.3em] font-black">WCH</span>
              </div>
            </div>
          </div>

          <h1 className="text-4xl md:text-6xl font-black text-foreground tracking-tighter uppercase mb-6">
            Lost in the <span className="text-gold">Collection</span>.
          </h1>
          
          <p className="text-muted font-bold uppercase tracking-[0.3em] text-xs mb-12 max-w-md mx-auto leading-relaxed">
            Time&apos;s run out for this page. The asset you seek has been de-listed or moved to a restricted vault.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto">
            <Link 
              href="/" 
              className="gold-sweep flex items-center justify-center gap-3 px-8 py-5 font-black text-xs uppercase tracking-widest"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Return Home
            </Link>
            
            <button 
              onClick={() => window.history.back()}
              className="gold-sweep-outline flex items-center justify-center gap-3 px-8 py-5 font-black text-xs uppercase tracking-widest"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Previous Vault
            </button>
          </div>

          <div className="mt-20 pt-10 border-t border-border">
             <p className="text-xs font-black text-muted uppercase tracking-[0.4em]">
               System Error Code: 0x404_HUB_VAULT_MISSING
             </p>
          </div>
        </div>
      </main>

      <footer className="py-10 text-center opacity-20 grayscale">
         <h2 className="text-xl font-black tracking-tighter text-foreground uppercase">
            WATCH<span className="text-gold">COLLECTOR</span>HUB
         </h2>
      </footer>
    </div>
  );
}
