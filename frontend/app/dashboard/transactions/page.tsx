"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import {
  History,
  Loader2,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  X,
  Smartphone,
  Wifi,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Download,
  Share2,
} from "lucide-react";
import api from "@/lib/api";
import { jsPDF } from "jspdf";
import { getProviderLabel } from "@/lib/providers";

interface Transaction {
  _id: string;
  type: "CREDIT" | "DEBIT";
  category: string;
  amount: number;
  status: "SUCCESS" | "FAILED" | "PENDING";
  description: string;
  createdAt: string;
  metadata?: any;
}

const filters = ["ALL", "SUCCESS", "FAILED", "PENDING"];

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Transaction | null>(null);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/transactions");

      const list =
        data?.data ||
        data?.transactions ||
        (Array.isArray(data) ? data : []);

      setTransactions(list);
    } catch (error) {
      console.error("Failed to load transactions:", error);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const filtered = transactions.filter((tx) => {
    const matchStatus =
      statusFilter === "ALL" || tx.status === statusFilter;

    const text = `${tx.description} ${tx.category} ${tx.amount}`.toLowerCase();
    const matchSearch = text.includes(search.toLowerCase());

    return matchStatus && matchSearch;
  });

  const getIcon = (category: string, type: string) => {
    const cat = (category || "").toUpperCase();

    if (cat.includes("AIRTIME")) return <Smartphone size={18} />;
    if (cat.includes("DATA")) return <Wifi size={18} />;
    if (cat.includes("WALLET") || type === "CREDIT")
      return <Wallet size={18} />;
    if (type === "CREDIT") return <ArrowDownLeft size={18} />;
    return <ArrowUpRight size={18} />;
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "SUCCESS":
        return "bg-emerald-50 text-emerald-700";
      case "FAILED":
        return "bg-red-50 text-red-600";
      default:
        return "bg-amber-50 text-amber-700";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "SUCCESS":
        return <CheckCircle size={14} />;
      case "FAILED":
        return <XCircle size={14} />;
      default:
        return <Clock size={14} />;
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString("en-NG", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getReference = (tx: Transaction) => {
    return (
      tx.metadata?.reference ||
      tx.metadata?.request_id ||
      tx.metadata?.providerResponse?.request_id ||
      tx._id
    );
  };

  const getProviderName = (tx: Transaction) => {
    const provider = tx.metadata?.provider;
    return provider ? getProviderLabel(provider) : "—";
  };

  const downloadPdf = (tx: Transaction) => {
    const doc = new jsPDF();
    const ref = getReference(tx);

    // Header
    doc.setFillColor(5, 150, 105);
    doc.rect(0, 0, 210, 35, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.text("AbuPay", 20, 18);
    doc.setFontSize(11);
    doc.text("Transaction Receipt", 20, 28);

    // Amount
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(12);
    doc.text("Amount", 20, 50);
    doc.setFontSize(22);
    doc.setTextColor(5, 150, 105);
    doc.text(
      `${tx.type === "CREDIT" ? "+" : "-"}NGN ${Number(tx.amount || 0).toLocaleString()}`,
      20,
      62
    );

    // Details
    doc.setTextColor(80, 80, 80);
    doc.setFontSize(11);

    const rows = [
      ["Status", tx.status],
      ["Description", tx.description || tx.category],
      ["Type", tx.type],
      ["Category", tx.category],
      ["Provider", getProviderName(tx)],
      ["Phone", tx.metadata?.phone || "—"],
      ["Network", (tx.metadata?.network || "—").toString().toUpperCase()],
      ["Reference", String(ref)],
      ["Date", formatDate(tx.createdAt)],
    ];

    let y = 80;
    rows.forEach(([label, value]) => {
      doc.setTextColor(120, 120, 120);
      doc.text(String(label), 20, y);
      doc.setTextColor(30, 30, 30);
      doc.text(String(value), 70, y);
      y += 10;
    });

    // Footer
    doc.setDrawColor(220, 220, 220);
    doc.line(20, 180, 190, 180);
    doc.setFontSize(10);
    doc.setTextColor(120, 120, 120);
    doc.text("Powered by Abu Niematullah Ventures", 20, 190);
    doc.text("support@abupay.com", 20, 198);

    doc.save(`AbuPay-Receipt-${ref}.pdf`);
  };

  const shareReceipt = async (tx: Transaction) => {
    const ref = getReference(tx);
    const text = `AbuPay Receipt

Amount: ₦${Number(tx.amount || 0).toLocaleString()}
Status: ${tx.status}
Description: ${tx.description || tx.category}
Type: ${tx.type}
Category: ${tx.category}
Provider: ${getProviderName(tx)}
Phone: ${tx.metadata?.phone || "—"}
Network: ${(tx.metadata?.network || "—").toString().toUpperCase()}
Reference: ${ref}
Date: ${formatDate(tx.createdAt)}

Powered by Abu Niematullah Ventures`;

    // Native share (mobile)
    if (navigator.share) {
      try {
        await navigator.share({
          title: "AbuPay Receipt",
          text,
        });
        return;
      } catch {
        // user cancelled or share failed → fallback
      }
    }

    // WhatsApp fallback
    const wa = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(wa, "_blank");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
          <p className="mt-1 text-gray-500">
            History of your airtime, data and wallet activities
          </p>
        </div>

        {/* Filters */}
        <div className="rounded-2xl border bg-white p-4 shadow-sm md:p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:max-w-sm">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={16}
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search transactions..."
                className="w-full rounded-xl border py-2.5 pl-10 pr-4 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {filters.map((item) => (
                <button
                  key={item}
                  onClick={() => setStatusFilter(item)}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                    statusFilter === item
                      ? "bg-emerald-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* List */}
        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="animate-spin text-emerald-600" size={28} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              <History className="mx-auto text-gray-300" size={42} />
              <p className="mt-3 font-medium text-gray-500">
                No transactions found
              </p>
              <p className="mt-1 text-sm text-gray-400">
                Your airtime, data and funding history will appear here
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {filtered.map((tx) => (
                <button
                  key={tx._id}
                  onClick={() => setSelected(tx)}
                  className="flex w-full items-center gap-4 px-4 py-4 text-left transition hover:bg-gray-50 md:px-6"
                >
                  <div
                    className={`rounded-xl p-3 ${
                      tx.type === "CREDIT"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {getIcon(tx.category, tx.type)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-gray-900">
                      {tx.description || tx.category}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-400">
                      {formatDate(tx.createdAt)}
                    </p>
                  </div>

                  <div className="text-right">
                    <p
                      className={`font-semibold ${
                        tx.type === "CREDIT"
                          ? "text-emerald-600"
                          : "text-gray-900"
                      }`}
                    >
                      {tx.type === "CREDIT" ? "+" : "-"}₦
                      {Number(tx.amount || 0).toLocaleString()}
                    </p>
                    <span
                      className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${getStatusStyle(
                        tx.status
                      )}`}
                    >
                      {getStatusIcon(tx.status)}
                      {tx.status}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Receipt Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Transaction Receipt
              </h3>
              <button
                onClick={() => setSelected(null)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 px-5 py-6">
              <div className="text-center">
                <div
                  className={`mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full ${
                    selected.status === "SUCCESS"
                      ? "bg-emerald-100 text-emerald-600"
                      : selected.status === "FAILED"
                      ? "bg-red-100 text-red-600"
                      : "bg-amber-100 text-amber-600"
                  }`}
                >
                  {getStatusIcon(selected.status)}
                </div>
                <p className="text-sm text-gray-500">Amount</p>
                <p className="text-3xl font-bold text-gray-900">
                  ₦{Number(selected.amount || 0).toLocaleString()}
                </p>
                <span
                  className={`mt-2 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${getStatusStyle(
                    selected.status
                  )}`}
                >
                  {selected.status}
                </span>
              </div>

              <div className="space-y-3 rounded-xl bg-gray-50 p-4 text-sm">
                <div className="flex justify-between gap-3">
                  <span className="text-gray-500">Description</span>
                  <span className="text-right font-medium text-gray-900">
                    {selected.description || selected.category}
                  </span>
                </div>

                <div className="flex justify-between gap-3">
                  <span className="text-gray-500">Type</span>
                  <span className="font-medium text-gray-900">
                    {selected.type}
                  </span>
                </div>

                <div className="flex justify-between gap-3">
                  <span className="text-gray-500">Category</span>
                  <span className="font-medium text-gray-900">
                    {selected.category}
                  </span>
                </div>

                <div className="flex justify-between gap-3">
                  <span className="text-gray-500">Provider</span>
                  <span className="font-medium text-gray-900">
                    {getProviderName(selected)}
                  </span>
                </div>

                <div className="flex justify-between gap-3">
                  <span className="text-gray-500">Date</span>
                  <span className="text-right font-medium text-gray-900">
                    {formatDate(selected.createdAt)}
                  </span>
                </div>

                <div className="flex justify-between gap-3">
                  <span className="text-gray-500">Reference</span>
                  <span className="max-w-[180px] truncate text-right font-medium text-gray-900">
                    {getReference(selected)}
                  </span>
                </div>

                {selected.metadata?.phone && (
                  <div className="flex justify-between gap-3">
                    <span className="text-gray-500">Phone</span>
                    <span className="font-medium text-gray-900">
                      {selected.metadata.phone}
                    </span>
                  </div>
                )}

                {selected.metadata?.network && (
                  <div className="flex justify-between gap-3">
                    <span className="text-gray-500">Network</span>
                    <span className="font-medium uppercase text-gray-900">
                      {selected.metadata.network}
                    </span>
                  </div>
                )}
              </div>

              <p className="text-center text-xs text-gray-400">
                Powered by Abu Niematullah Ventures
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 border-t px-5 py-4">
              <button
                onClick={() => downloadPdf(selected)}
                className="flex items-center justify-center gap-2 rounded-xl border py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                <Download size={16} />
                PDF
              </button>

              <button
                onClick={() => shareReceipt(selected)}
                className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                <Share2 size={16} />
                Share
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}