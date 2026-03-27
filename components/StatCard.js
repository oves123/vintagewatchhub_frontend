"use client";

import { TrendingUp, TrendingDown, Activity } from "lucide-react";

export default function StatCard({ title, value, trend, color = "slate", onDetail }) {
  const isPositive = trend?.startsWith("+");
  
  return (
    <div className="bg-white p-7 rounded-3xl border border-slate-100 shadow-sm transition-all duration-500 hover:shadow-xl hover:shadow-slate-200/50 hover:border-slate-200 font-sans group relative overflow-hidden">
      {/* Decorative Background Element */}
      <div className={`absolute -right-6 -bottom-6 w-24 h-24 rounded-full opacity-[0.03] group-hover:scale-125 transition-transform duration-700 ${color === 'blue' ? 'bg-blue-600' : 'bg-slate-900'}`}></div>
      
      <div className="flex flex-col gap-6 relative z-10">
        <div className="flex items-start justify-between">
            <div className="flex flex-col gap-1">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{title}</p>
               <div className="flex items-center gap-1.5 mt-0.5">
                  <Activity size={10} className="text-slate-300" />
                  <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Live Metadata</span>
               </div>
            </div>
            {trend && (
             <div className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[10px] font-black tracking-tight uppercase transition-all duration-300 group-hover:scale-105 ${isPositive ? 'bg-emerald-50 text-emerald-600 shadow-sm shadow-emerald-100' : 'bg-rose-50 text-rose-600 shadow-sm shadow-rose-100'}`}>
               {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
               {trend}
             </div>
            )}
        </div>
        
        <div className="flex items-baseline gap-2">
          <h3 className="text-3xl font-black text-slate-900 tracking-tight transition-all duration-300 group-hover:translate-x-1">
            {value}
          </h3>
        </div>

        <div className="space-y-3">
            <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100/50">
              <div 
                className={`h-full transition-all duration-1000 cubic-bezier(0.4, 0, 0.2, 1) w-[75%] ${color === 'blue' ? 'bg-blue-600 shadow-lg shadow-blue-200' : 'bg-slate-900 shadow-lg shadow-slate-300'}`}
              ></div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-slate-900 animate-pulse"></div>
                 <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Active Analysis</span>
              </div>
              <button 
                onClick={onDetail}
                className="text-[8px] font-black text-slate-400 hover:text-slate-900 uppercase tracking-widest transition-colors"
              >
                Details
              </button>
            </div>
        </div>
      </div>
    </div>
  );
}
