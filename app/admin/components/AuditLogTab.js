"use client";

import { useEffect, useState } from "react";
import { Search, RefreshCw, Filter } from "lucide-react";

export default function AuditLogTab({ API_URL, getHeaders, showToast }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("ALL");

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (actionFilter !== "ALL") params.append("action", actionFilter);
      const res = await fetch(`${API_URL}/admin/audit-log?${params.toString()}`, {
        headers: getHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(Array.isArray(data) ? data : []);
      } else {
        setLogs([]);
      }
    } catch {
      setLogs([]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchLogs(); }, []);

  const actions = ["ALL", "APPROVE", "REJECT", "SUSPEND", "ACTIVATE", "DELETE", "CREATE", "UPDATE", "RELEASE_PAYOUT", "RESOLVE"];

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            placeholder="Search by admin, target, details..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-background border border-border pl-10 pr-4 py-3 text-sm outline-none focus:border-gold transition-colors"
          />
        </div>
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="bg-background border border-border px-4 py-3 text-sm font-bold outline-none focus:border-gold transition-colors"
        >
          {actions.map(a => (
            <option key={a} value={a}>{a === 'ALL' ? 'All Actions' : a.replace('_', ' ')}</option>
          ))}
        </select>
        <button onClick={fetchLogs} className="gold-sweep-outline px-5 py-3 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
          <RefreshCw className="w-3.5 h-3.5" /> Search
        </button>
      </div>

      {/* Table */}
      <div className="bg-background border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface/50">
              <th className="text-left p-4 text-xs font-black text-muted uppercase tracking-widest">Time</th>
              <th className="text-left p-4 text-xs font-black text-muted uppercase tracking-widest">Admin</th>
              <th className="text-left p-4 text-xs font-black text-muted uppercase tracking-widest">Action</th>
              <th className="text-left p-4 text-xs font-black text-muted uppercase tracking-widest">Target</th>
              <th className="text-left p-4 text-xs font-black text-muted uppercase tracking-widest">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr><td colSpan="5" className="p-10 text-center text-muted text-sm">Loading...</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan="5" className="p-10 text-center text-muted text-sm">
                <div className="mb-2">No audit logs found</div>
                <p className="text-xs">Admin actions are automatically logged here.</p>
              </td></tr>
            ) : (
              logs.map((log, i) => (
                <tr key={log.id || i} className="hover:bg-surface/30 transition-colors">
                  <td className="p-4 text-sm text-muted whitespace-nowrap">
                    {log.created_at ? new Date(log.created_at).toLocaleString() : '-'}
                  </td>
                  <td className="p-4">
                    <span className="text-[12px] font-bold text-foreground">{log.admin_name || log.admin_email || 'Unknown'}</span>
                  </td>
                  <td className="p-4">
                    <span className={`text-xs font-black uppercase tracking-widest px-2 py-0.5 border ${
                      log.action === 'APPROVE' || log.action === 'ACTIVATE' || log.action === 'RELEASE_PAYOUT' ? 'text-emerald-600 bg-emerald-50/50 border-emerald-200/50' :
                      log.action === 'REJECT' || log.action === 'SUSPEND' || log.action === 'DELETE' ? 'text-rose-600 bg-rose-50/50 border-rose-200/50' :
                      'text-amber-600 bg-amber-50/50 border-amber-200/50'
                    }`}>
                      {log.action?.replace('_', ' ') || 'N/A'}
                    </span>
                  </td>
                  <td className="p-4 text-[12px] text-foreground font-medium">{log.target_type || '-'} #{log.target_id || ''}</td>
                  <td className="p-4 text-sm text-muted max-w-[300px] truncate">{log.details || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted text-center mt-4 uppercase tracking-widest font-bold">
        All admin actions are permanently recorded for accountability.
      </p>
    </div>
  );
}
