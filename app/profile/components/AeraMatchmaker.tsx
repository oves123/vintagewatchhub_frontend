"use client";

import { useState, useEffect } from 'react';
import { Target, Search, Plus, Filter, CheckCircle, Clock } from 'lucide-react';
import { API_URL, getHeaders } from "../../../services/api";
import { useToast } from "../../../context/ToastContext";

export default function AeraMatchmaker({ user }) {
  const [bounties, setBounties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const { showToast } = useToast();
  
  const [form, setForm] = useState({
    brand: '',
    model: '',
    reference_number: '',
    year_range: '',
    condition_req: 'Excellent',
    budget: ''
  });

  const fetchBounties = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/bounties/user`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setBounties(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBounties();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/bounties`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(form)
      });
      if (res.ok) {
        showToast("Bounty added! We will notify you when a seller lists a match.", "success");
        setShowForm(false);
        setForm({
          brand: '', model: '', reference_number: '', year_range: '', condition_req: 'Excellent', budget: ''
        });
        fetchBounties();
      } else {
        const error = await res.json();
        showToast(error.error || "Failed to create bounty", "error");
      }
    } catch (err) {
      showToast("Something went wrong", "error");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-gradient-to-br from-[#1e1b4b] to-[#312e81] rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
         <div className="absolute top-0 right-0 w-64 h-64 bg-gold/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
         <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
               <p className="text-indigo-200/80 text-xs font-black uppercase tracking-widest mb-1 flex items-center gap-2">
                 <Target size={14} /> AeraVault Matchmaker
               </p>
               <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white">Bounty System</h2>
               <p className="text-indigo-100 text-sm font-medium mt-2 max-w-md">
                 Can't find the exact timepiece you want? Post a bounty and let sellers bring the watches directly to you.
               </p>
            </div>
            <button 
              onClick={() => setShowForm(!showForm)}
              className="gold-sweep px-6 py-3 text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-xl"
            >
              {showForm ? 'Cancel' : <><Plus size={16} /> Place a Bounty</>}
            </button>
         </div>
      </div>

      {showForm && (
        <div className="bg-surface border border-border rounded-3xl p-8 shadow-sm">
          <h3 className="text-lg font-black uppercase tracking-widest text-foreground mb-6">New Bounty Request</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="space-y-2">
               <label className="text-xs font-bold text-muted uppercase tracking-widest">Brand *</label>
               <input required type="text" value={form.brand} onChange={e => setForm({...form, brand: e.target.value})} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm font-bold focus:border-gold outline-none" placeholder="e.g. Rolex" />
             </div>
             <div className="space-y-2">
               <label className="text-xs font-bold text-muted uppercase tracking-widest">Model *</label>
               <input required type="text" value={form.model} onChange={e => setForm({...form, model: e.target.value})} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm font-bold focus:border-gold outline-none" placeholder="e.g. Submariner" />
             </div>
             <div className="space-y-2">
               <label className="text-xs font-bold text-muted uppercase tracking-widest">Reference No. (Optional)</label>
               <input type="text" value={form.reference_number} onChange={e => setForm({...form, reference_number: e.target.value})} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm font-bold focus:border-gold outline-none" placeholder="e.g. 16610" />
             </div>
             <div className="space-y-2">
               <label className="text-xs font-bold text-muted uppercase tracking-widest">Preferred Year Range (Optional)</label>
               <input type="text" value={form.year_range} onChange={e => setForm({...form, year_range: e.target.value})} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm font-bold focus:border-gold outline-none" placeholder="e.g. 1990-1995" />
             </div>
             <div className="space-y-2">
               <label className="text-xs font-bold text-muted uppercase tracking-widest">Condition Requirement</label>
               <select value={form.condition_req} onChange={e => setForm({...form, condition_req: e.target.value})} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm font-bold focus:border-gold outline-none">
                 <option>Any Condition</option>
                 <option>Good</option>
                 <option>Excellent</option>
                 <option>Mint / Unworn</option>
               </select>
             </div>
             <div className="space-y-2">
               <label className="text-xs font-bold text-muted uppercase tracking-widest">Your Budget (₹) *</label>
               <input required type="number" min="1000" value={form.budget} onChange={e => setForm({...form, budget: e.target.value})} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm font-black text-emerald-600 focus:border-gold outline-none" placeholder="Max amount you're willing to pay" />
             </div>
             <div className="md:col-span-2 pt-4">
               <button type="submit" className="w-full gold-sweep py-4 text-xs font-black uppercase tracking-[0.2em] rounded-xl">Post Bounty to Sellers</button>
             </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="py-20 flex justify-center"><div className="w-8 h-8 border-4 border-gold border-t-transparent rounded-full animate-spin"></div></div>
      ) : bounties.length === 0 ? (
         <div className="bg-surface border border-border rounded-3xl p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
            <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
               <Search className="w-8 h-8 text-indigo-500" />
            </div>
            <h3 className="text-lg font-black text-foreground">No Active Bounties</h3>
            <p className="text-muted text-sm max-w-sm mt-2">
               You haven't placed any bounties yet. Describe the watch you're looking for, and we'll alert our sellers to fulfill it.
            </p>
         </div>
      ) : (
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {bounties.map(bounty => (
              <div key={bounty.id} className="bg-surface border border-border rounded-2xl p-6 relative overflow-hidden group hover:border-indigo-200 transition-colors">
                 <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                 <div className="flex justify-between items-start mb-4">
                    <div>
                       <h3 className="font-black text-lg text-foreground">{bounty.brand} {bounty.model}</h3>
                       {bounty.reference_number && <p className="text-xs font-bold text-muted uppercase mt-1">Ref: {bounty.reference_number}</p>}
                    </div>
                    <div className="bg-emerald-50 text-emerald-700 font-black text-sm px-3 py-1 rounded-lg border border-emerald-200">
                       ₹{parseFloat(bounty.budget).toLocaleString()}
                    </div>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-y-3 gap-x-4 mb-4 text-xs">
                    <div>
                      <p className="text-muted font-bold uppercase tracking-widest text-[9px] mb-0.5">Year Range</p>
                      <p className="font-bold text-foreground">{bounty.year_range || 'Any'}</p>
                    </div>
                    <div>
                      <p className="text-muted font-bold uppercase tracking-widest text-[9px] mb-0.5">Condition</p>
                      <p className="font-bold text-foreground">{bounty.condition_req || 'Any'}</p>
                    </div>
                 </div>
                 
                 <div className="flex items-center gap-2 text-xs font-bold mt-6 pt-4 border-t border-border">
                    <Clock size={12} className="text-indigo-500" />
                    <span className="text-muted">Posted {new Date(bounty.created_at).toLocaleDateString()}</span>
                    <span className="ml-auto text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase tracking-widest text-[10px]">Active</span>
                 </div>
              </div>
            ))}
         </div>
      )}
    </div>
  );
}
