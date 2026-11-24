"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";

type AuditLog = {
  _id: string; actorName: string; actorEmail: string; actorRole: string;
  action: string; resource: string; method: string; statusCode: number;
  ipAddress?: string; changedFields?: string[]; failureReason?: string; createdAt: string;
};

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadLogs = useCallback(async (requestedPage: number, query: string) => {
    setLoading(true); setError("");
    try {
      const params = new URLSearchParams({ page: String(requestedPage), limit: "25", search: query });
      const response = await api.get(`/admin/audit-logs?${params.toString()}`);
      const result = response.data;
      if (!result.success) throw new Error(result.message || "Unable to load activity history.");
      setLogs(Array.isArray(result.logs) ? result.logs : []);
      setPage(Number(result.page || requestedPage)); setTotal(Number(result.total || 0));
      setTotalPages(Number(result.totalPages || 1));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load activity history.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void loadLogs(1, ""); }, [loadLogs]);

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div><p className="text-sm font-semibold text-blue-600">AbuPay / Security</p><h1 className="mt-1 text-2xl font-bold">Admin Activity History</h1><p className="mt-1 text-sm text-slate-500">Read-only record of successful administrator changes and security events.</p></div>
          <Link href="/admin" className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold">Back to Admin</Link>
        </div>
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap gap-3 border-b border-slate-200 p-4">
            <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => { if (e.key === "Enter") loadLogs(1, search); }} placeholder="Search admin, action or resource" className="min-w-[220px] flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <button onClick={() => loadLogs(1, search)} disabled={loading} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Search / Refresh</button>
          </div>
          {error && <p className="m-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          {loading ? <p className="p-10 text-center text-sm text-slate-500">Loading activity...</p> : logs.length === 0 ? <p className="p-10 text-center text-sm text-slate-500">No activity records found. New successful admin actions will appear here.</p> : (
            <div className="overflow-x-auto"><table className="min-w-[950px] w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr>{["Date / Time", "Administrator", "Action", "Resource", "Fields Changed", "Result", "IP Address"].map(h => <th key={h} className="px-4 py-3 font-semibold">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-slate-100">{logs.map(log => <tr key={log._id} className="hover:bg-slate-50">
                <td className="whitespace-nowrap px-4 py-3">{new Date(log.createdAt).toLocaleString("en-NG")}</td>
                <td className="px-4 py-3"><p className="font-semibold">{log.actorName || "Unauthenticated"}</p><p className="text-xs text-slate-500">{log.actorEmail || "No email supplied"} · {log.actorRole || "unknown"}</p></td>
                <td className="px-4 py-3 font-medium">{log.action}{log.failureReason && <p className="mt-1 text-xs font-normal text-red-600">{log.failureReason}</p>}</td><td className="px-4 py-3">{log.resource}</td>
                <td className="px-4 py-3">{log.changedFields?.length ? log.changedFields.join(", ") : "—"}</td>
                <td className="px-4 py-3">{log.statusCode}</td><td className="px-4 py-3">{log.ipAddress || "—"}</td>
              </tr>)}</tbody>
            </table></div>
          )}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 text-sm text-slate-500"><span>{total.toLocaleString("en-NG")} record(s) · Page {page} of {totalPages}</span><div className="flex gap-2"><button disabled={page <= 1 || loading} onClick={() => loadLogs(page - 1, search)} className="rounded border border-slate-300 px-3 py-1.5 disabled:opacity-40">Previous</button><button disabled={page >= totalPages || loading} onClick={() => loadLogs(page + 1, search)} className="rounded border border-slate-300 px-3 py-1.5 disabled:opacity-40">Next</button></div></div>
        </section>
      </div>
    </main>
  );
}
