"use client";

import { Info, AlertCircle, Loader2 } from "lucide-react";

export default function AdminTable({ headers, data, renderRow, loading, onSelectAll, isAllSelected }) {
  if (loading) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-12 border border-slate-100 shadow-sm overflow-hidden min-h-[400px] flex items-center justify-center font-sans transition-all duration-500">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
             <div className="w-12 h-12 border-2 border-slate-900/10 rounded-full"></div>
             <Loader2 className="absolute inset-0 w-12 h-12 text-slate-900 animate-spin" />
          </div>
          <div className="text-center">
            <p className="text-[11px] font-black text-slate-900 uppercase tracking-[0.25em]">Synchronizing Registry</p>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-2">Fetching live platform data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-700 font-sans group">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100/50">
              {onSelectAll && (
                <th className="px-6 py-5 w-10">
                  <div className="flex items-center">
                    <input 
                      type="checkbox" 
                      onChange={onSelectAll}
                      checked={isAllSelected}
                      className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 transition-all cursor-pointer"
                    />
                  </div>
                </th>
              )}
              {headers.map((h, i) => (
                <th key={i} className="px-6 py-5 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] whitespace-nowrap first:pl-8">
                  <div className="flex items-center gap-2">
                    {h}
                    <Info size={10} className="text-slate-200 group-hover:text-slate-300 transition-colors" />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50/80">
            {!Array.isArray(data) || data.length === 0 ? (
              <tr>
                <td colSpan={headers.length + (onSelectAll ? 1 : 0)} className="px-6 py-32 text-center">
                  <div className="max-w-sm mx-auto flex flex-col items-center gap-4">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 mb-2">
                       <AlertCircle size={32} />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900 mb-1 uppercase tracking-tight">Zero Result Consensus</h4>
                      <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.15em] leading-relaxed">The administrative queries returned no matching records for this sector.</p>
                    </div>
                    {!Array.isArray(data) && data?.error && (
                      <div className="mt-4 py-2.5 px-5 bg-rose-50 border border-rose-100 rounded-xl">
                        <p className="text-rose-600 text-[9px] font-black uppercase tracking-widest">{data.error}</p>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              data.map((item, index) => renderRow(item, index))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Table Footer / Pagination Placeholder */}
      <div className="p-5 border-t border-slate-50 flex items-center justify-between bg-slate-50/30">
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
          Showing <span className="text-slate-900">{data?.length || 0}</span> specialized entries
        </p>
        <div className="flex gap-2">
           <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
           <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Live Feed active</span>
        </div>
      </div>
    </div>
  );
}
