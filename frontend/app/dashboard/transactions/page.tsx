"use client";

import { useCallback, useEffect, useState } from "react";
import {
  History,
  Search,
  ArrowDownLeft,
  ArrowUpRight,
  Filter,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import Button from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getTransactions } from "@/services/transaction";
import { Transaction } from "@/types/transaction";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS = ["ALL", "SUCCESS", "PENDING", "FAILED"] as const;
const CATEGORY_OPTIONS = [
  "ALL",
  "AIRTIME",
  "DATA",
  "WALLET_FUNDING",
  "ELECTRICITY",
  "CABLE",
  "REFUND",
  "TRANSFER",
] as const;

const statusStyles: Record<string, string> = {
  SUCCESS: "bg-emerald-50 text-emerald-700 border-emerald-200",
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  FAILED: "bg-red-50 text-red-700 border-red-200",
};

const categoryLabels: Record<string, string> = {
  AIRTIME: "Airtime",
  DATA: "Data",
  WALLET_FUNDING: "Wallet Funding",
  ELECTRICITY: "Electricity",
  CABLE: "Cable TV",
  REFUND: "Refund",
  TRANSFER: "Transfer",
};

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [status, setStatus] = useState<string>("ALL");
  const [category, setCategory] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const data = await getTransactions({
        page,
        limit: 15,
        status: status === "ALL" ? undefined : status,
        category: category === "ALL" ? undefined : category,
        search: search || undefined,
      });

      setTransactions(data.transactions || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || "Failed to load transactions"
      );
    } finally {
      setLoading(false);
    }
  }, [page, status, category, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const clearFilters = () => {
    setStatus("ALL");
    setCategory("ALL");
    setSearch("");
    setSearchInput("");
    setPage(1);
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-3xl font-bold text-gray-900">
              <History className="text-emerald-600" size={28} />
              Transactions
            </h1>
            <p className="mt-1 text-gray-500">
              View and filter all your transaction history
            </p>
          </div>

          <Button
            variant="outline"
            onClick={() => fetchData()}
            className="flex items-center gap-2"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </Button>
        </div>

        {/* Filters */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
              {/* Search */}
              <form onSubmit={handleSearch} className="flex-1">
                <label className="mb-1.5 block text-sm font-medium text-gray-600">
                  Search
                </label>
                <div className="relative">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <Input
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Search by reference or description..."
                    className="h-11 pl-10"
                  />
                </div>
              </form>

              {/* Status */}
              <div className="w-full lg:w-44">
                <label className="mb-1.5 block text-sm font-medium text-gray-600">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value);
                    setPage(1);
                  }}
                  className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-emerald-500"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s === "ALL" ? "All Status" : s}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category */}
              <div className="w-full lg:w-48">
                <label className="mb-1.5 block text-sm font-medium text-gray-600">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value);
                    setPage(1);
                  }}
                  className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-emerald-500"
                >
                  {CATEGORY_OPTIONS.map((c) => (
                    <option key={c} value={c}>
                      {c === "ALL" ? "All Categories" : categoryLabels[c] || c}
                    </option>
                  ))}
                </select>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={clearFilters}
                className="h-11"
              >
                <Filter size={16} className="mr-2" />
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg">
              {total} Transaction{total !== 1 ? "s" : ""}
            </CardTitle>
          </CardHeader>

          <CardContent className="p-0">
            {loading ? (
              <div className="flex h-64 items-center justify-center">
                <div className="text-center">
                  <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
                  <p className="mt-4 text-gray-500">Loading transactions...</p>
                </div>
              </div>
            ) : transactions.length === 0 ? (
              <div className="flex h-64 flex-col items-center justify-center text-gray-500">
                <History size={40} className="mb-3 opacity-40" />
                <p className="font-medium">No transactions found</p>
                <p className="text-sm">Try adjusting your filters</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/80">
                      <TableHead className="pl-6">Type</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead className="pr-6">Date</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {transactions.map((tx) => (
                      <TableRow
                        key={tx._id}
                        className="hover:bg-slate-50/50 transition"
                      >
                        <TableCell className="pl-6">
                          <div className="flex items-center gap-2">
                            {tx.type === "CREDIT" ? (
                              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                                <ArrowDownLeft size={16} />
                              </span>
                            ) : (
                              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-50 text-red-500">
                                <ArrowUpRight size={16} />
                              </span>
                            )}
                            <span className="text-sm font-medium capitalize">
                              {tx.type.toLowerCase()}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell>
                          <span className="text-sm font-medium text-gray-700">
                            {categoryLabels[tx.category] || tx.category}
                          </span>
                          {tx.description && (
                            <p className="mt-0.5 max-w-[180px] truncate text-xs text-gray-400">
                              {tx.description}
                            </p>
                          )}
                        </TableCell>

                        <TableCell>
                          <span
                            className={cn(
                              "font-semibold",
                              tx.type === "CREDIT"
                                ? "text-emerald-600"
                                : "text-gray-900"
                            )}
                          >
                            {tx.type === "CREDIT" ? "+" : "-"}₦
                            {tx.amount.toLocaleString()}
                          </span>
                        </TableCell>

                        <TableCell>
                          <span
                            className={cn(
                              "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium",
                              statusStyles[tx.status] || statusStyles.PENDING
                            )}
                          >
                            {tx.status}
                          </span>
                        </TableCell>

                        <TableCell>
                          <code className="rounded bg-slate-100 px-2 py-0.5 text-xs text-gray-600">
                            {tx.reference}
                          </code>
                        </TableCell>

                        <TableCell className="pr-6 text-sm text-gray-500">
                          {tx.createdAt
                            ? format(new Date(tx.createdAt), "dd MMM yyyy, HH:mm")
                            : "—"}\n                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t px-6 py-4">
                <p className="text-sm text-gray-500">
                  Page {page} of {totalPages}
                </p>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    disabled={page <= 1 || loading}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="h-9 px-3"
                  >
                    <ChevronLeft size={16} />
                  </Button>
                  <Button
                    variant="outline"
                    disabled={page >= totalPages || loading}
                    onClick={() => setPage((p) => p + 1)}
                    className="h-9 px-3"
                  >
                    <ChevronRight size={16} />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}