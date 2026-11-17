"use client";

import { useEffect, useMemo, useState } from "react";
import { formatMoney } from "@/lib/format-money";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

interface DataPricingPlan {
  id: string;
  network: string;
  dataType: string;
  name: string;
  validity: string;
  provider: {
    key?: string;
    displayName?: string;
  } | null;
  providerPlan: {
    id: string;
    name: string;
    code: string;
    active: boolean;
  } | null;
  providerCost: number | null;
  sellingPrice: number;
  expectedProfit: number | null;
  active: boolean;
  costStatus: string;
}

const money = (value: number | null | undefined) =>
  formatMoney(value, { maximumFractionDigits: 2 });

export default function DataPlanMappingPage() {
  const [plans, setPlans] = useState<DataPricingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [networkFilter, setNetworkFilter] = useState("ALL");
  const [providerFilter, setProviderFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [mappingFilter, setMappingFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const loadPlans = async (refresh = false) => {
    if (refresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      // Follow the existing cookie-based admin authentication pattern.
      const authResponse = await fetch(`${API_URL}/auth/me`, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      if (!authResponse.ok) {
        throw new Error(
          "Admin authentication could not be verified. Please sign in again."
        );
      }

      const response = await fetch(`${API_URL}/data-pricing/plans`, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok || !result.success || !Array.isArray(result.data)) {
        throw new Error(result.message || "Unable to load data plan records.");
      }

      setPlans(result.data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "An unexpected error occurred while loading data plans."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadPlans();
  }, []);

  const networks = useMemo(
    () => [...new Set(plans.map((p) => p.network).filter(Boolean))].sort(),
    [plans]
  );

  const providers = useMemo(
    () =>
      [
        ...new Set(
          plans.map((p) => p.provider?.displayName || p.provider?.key).filter(Boolean)
        ),
      ].sort(),
    [plans]
  );

  const dataTypes = useMemo(
    () => [...new Set(plans.map((p) => p.dataType).filter(Boolean))].sort(),
    [plans]
  );

  const mappedCount = plans.filter(
    (p) => p.provider !== null && p.providerPlan !== null
  ).length;

  const unmappedCount = plans.length - mappedCount;
  const activeCount = plans.filter((p) => p.active).length;
  const inactiveCount = plans.length - activeCount;

  const filteredPlans = useMemo(() => {
    const term = search.trim().toLowerCase();

    return plans.filter((plan) => {
      const isMapped = Boolean(plan.provider && plan.providerPlan);

      const matchesSearch =
        !term ||
        [
          plan.name,
          plan.network,
          plan.dataType,
          plan.provider?.displayName,
          plan.provider?.key,
          plan.providerPlan?.name,
          plan.providerPlan?.code,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(term));

      const matchesNetwork =
        networkFilter === "ALL" || plan.network === networkFilter;

      const matchesProvider =
        providerFilter === "ALL" ||
        (plan.provider?.displayName || plan.provider?.key) === providerFilter;

      const matchesType =
        typeFilter === "ALL" || plan.dataType === typeFilter;

      const matchesMapping =
        mappingFilter === "ALL" ||
        (mappingFilter === "MAPPED" && isMapped) ||
        (mappingFilter === "UNMAPPED" && !isMapped);

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && plan.active) ||
        (statusFilter === "INACTIVE" && !plan.active);

      return (
        matchesSearch &&
        matchesNetwork &&
        matchesProvider &&
        matchesType &&
        matchesMapping &&
        matchesStatus
      );
    });
  }, [
    plans,
    search,
    networkFilter,
    providerFilter,
    typeFilter,
    mappingFilter,
    statusFilter,
  ]);

  const selectClass =
    "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500";

  const metricClass =
    "rounded-xl border border-slate-200 bg-white p-4 shadow-sm";

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-blue-600">
              AbuPay Admin / Products & Integrations
            </p>
            <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
              Data Plan Mapping & Catalogue
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-500">
              View AbuPay customer plans, their provider mappings, provider
              costs and selling prices in one register.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <a
              href="/admin"
              className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Admin Dashboard
            </a>
            <button
              type="button"
              onClick={() => void loadPlans(true)}
              disabled={loading || refreshing}
              className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
            >
              {refreshing ? "Refreshing..." : "Refresh Register"}
            </button>
          </div>
        </header>

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
          <div className={metricClass}>
            <p className="text-xs font-medium text-slate-500">Total AbuPay Plans</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {plans.length}
            </p>
          </div>
          <div className={metricClass}>
            <p className="text-xs font-medium text-slate-500">Mapped Plans</p>
            <p className="mt-2 text-2xl font-bold text-emerald-700">
              {mappedCount}
            </p>
          </div>
          <div className={metricClass}>
            <p className="text-xs font-medium text-slate-500">Unmapped Plans</p>
            <p className="mt-2 text-2xl font-bold text-amber-700">
              {unmappedCount}
            </p>
          </div>
          <div className={metricClass}>
            <p className="text-xs font-medium text-slate-500">Active Plans</p>
            <p className="mt-2 text-2xl font-bold text-blue-700">
              {activeCount}
            </p>
          </div>
          <div className={metricClass}>
            <p className="text-xs font-medium text-slate-500">Inactive Plans</p>
            <p className="mt-2 text-2xl font-bold text-slate-600">
              {inactiveCount}
            </p>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-4">
            <h2 className="font-bold text-slate-900">Plan Register</h2>
            <p className="mt-1 text-xs text-slate-500">
              Filters apply to all AbuPay data plan records, including inactive
              and unmapped plans.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search plan, provider or plan code..."
              className={selectClass}
            />

            <select
              value={networkFilter}
              onChange={(e) => setNetworkFilter(e.target.value)}
              className={selectClass}
            >
              <option value="ALL">All Networks</option>
              {networks.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>

            <select
              value={providerFilter}
              onChange={(e) => setProviderFilter(e.target.value)}
              className={selectClass}
            >
              <option value="ALL">All Providers</option>
              {providers.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className={selectClass}
            >
              <option value="ALL">All Data Types</option>
              {dataTypes.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>

            <select
              value={mappingFilter}
              onChange={(e) => setMappingFilter(e.target.value)}
              className={selectClass}
            >
              <option value="ALL">All Mapping Statuses</option>
              <option value="MAPPED">Mapped</option>
              <option value="UNMAPPED">Unmapped</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={selectClass}
            >
              <option value="ALL">All Plan Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4">
            <p className="text-sm text-slate-500">
              Showing <strong className="text-slate-800">{filteredPlans.length}</strong>
              {" "}of <strong className="text-slate-800">{plans.length}</strong> plans
            </p>
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setNetworkFilter("ALL");
                setProviderFilter("ALL");
                setTypeFilter("ALL");
                setMappingFilter("ALL");
                setStatusFilter("ALL");
              }}
              className="text-sm font-semibold text-blue-700 hover:underline"
            >
              Clear filters
            </button>
          </div>

          {loading ? (
            <div className="py-16 text-center text-sm text-slate-500">
              Loading AbuPay data plan register...
            </div>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[1150px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-3 py-3">AbuPay Plan</th>
                    <th className="px-3 py-3">Network / Type</th>
                    <th className="px-3 py-3">Provider</th>
                    <th className="px-3 py-3">Provider Plan / Code</th>
                    <th className="px-3 py-3 text-right">Provider Cost</th>
                    <th className="px-3 py-3 text-right">Selling Price</th>
                    <th className="px-3 py-3 text-right">Expected Profit</th>
                    <th className="px-3 py-3">Mapping</th>
                    <th className="px-3 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPlans.map((plan) => {
                    const mapped = Boolean(plan.provider && plan.providerPlan);
                    const profit =
                      plan.providerCost === null ||
                      plan.providerCost === undefined
                        ? null
                        : Number(
                            (Number(plan.sellingPrice) - Number(plan.providerCost)).toFixed(2)
                          );

                    const hasPricingIssue =
                      profit !== null && profit <= 0;

                    return (
                      <tr
                        key={plan.id}
                        className="border-b border-slate-100 align-top hover:bg-slate-50"
                      >
                        <td className="px-3 py-4">
                          <p className="font-semibold text-slate-900">{plan.name}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            {plan.validity || "Validity not specified"}
                          </p>
                          <p className="mt-1 break-all text-[10px] text-slate-400">
                            {plan.id}
                          </p>
                        </td>
                        <td className="px-3 py-4">
                          <p className="font-medium text-slate-800">
                            {plan.network}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {plan.dataType}
                          </p>
                        </td>
                        <td className="px-3 py-4 text-slate-700">
                          {plan.provider?.displayName || plan.provider?.key || "Not assigned"}
                        </td>
                        <td className="px-3 py-4">
                          {plan.providerPlan ? (
                            <>
                              <p className="font-medium text-slate-800">
                                {plan.providerPlan.name}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                Code: {plan.providerPlan.code || "—"}
                              </p>
                              {!plan.providerPlan.active && (
                                <p className="mt-1 text-xs font-semibold text-amber-700">
                                  Provider plan inactive
                                </p>
                              )}
                            </>
                          ) : (
                            <span className="text-slate-400">No provider plan linked</span>
                          )}
                        </td>
                        <td className="px-3 py-4 text-right tabular-nums text-slate-700">
                          {money(plan.providerCost)}
                        </td>
                        <td className="px-3 py-4 text-right font-semibold tabular-nums text-slate-900">
                          {money(plan.sellingPrice)}
                        </td>
                        <td className="px-3 py-4 text-right tabular-nums">
                          {profit === null ? (
                            <span className="text-slate-400">Unknown</span>
                          ) : (
                            <span className={hasPricingIssue ? "font-semibold text-red-700" : "font-semibold text-emerald-700"}>
                              {money(profit)}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-4">
                          {mapped ? (
                            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                              Mapped
                            </span>
                          ) : (
                            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                              Unmapped
                            </span>
                          )}
                          {plan.providerPlan && !plan.providerPlan.active && (
                            <p className="mt-2 text-xs text-amber-700">Provider inactive</p>
                          )}
                        </td>
                        <td className="px-3 py-4">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            plan.active
                              ? "bg-blue-50 text-blue-700"
                              : "bg-slate-100 text-slate-600"
                          }`}>
                            {plan.active ? "Active" : "Inactive"}
                          </span>
                          {plan.providerCost === null && (
                            <p className="mt-2 text-xs text-amber-700">
                              Cost not recorded
                            </p>
                          )}
                          {hasPricingIssue && (
                            <p className="mt-2 text-xs font-semibold text-red-700">
                              Review margin
                            </p>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {filteredPlans.length === 0 && (
                <div className="py-14 text-center text-sm text-slate-500">
                  No plans match the selected filters.
                </div>
              )}
            </div>
          )}
        </section>

        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
          <strong>Read-only register:</strong> This page does not modify provider
          mappings, provider costs, selling prices or plan activation. Use the
          existing Data Plan Pricing section for current management operations.
          New catalogue products should be reviewed and priced before being made
          available to customers.
        </div>
      </div>
    </main>
  );
}
