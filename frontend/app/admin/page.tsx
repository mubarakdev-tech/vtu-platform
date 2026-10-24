"use client";

import { FormEvent, useEffect, useState } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role?: string;
}

interface DataPricingPlan {
  id: string;
  network: string;
  dataType: string;
  name: string;
  validity: string;
  provider: { key?: string; displayName?: string } | null;
  providerPlan: { id: string; name: string; code: string; active: boolean } | null;
  providerCost: number | null;
  sellingPrice: number;
  expectedProfit: number | null;
  active: boolean;
  costStatus: string;
}

interface DataPricingProvider {
  key: string;
  displayName: string;
}

interface ProviderCataloguePlan {
  name: string;
  code: string;
  catalogueAmount: number | null;
  validity: string;
}

interface FinancialData {
  revenue: { total: number; transactions: number };
  expenses: { total: number; transactions: number };
  grossProfit: number | null;
  financialResult: number | null;
  profitStatus?: "COMPLETE" | "RECORDED_COSTS_COMPLETE" | "PROVISIONAL";
  providerCostsComplete?: boolean;
  airtime: { revenue: number; transactions: number };
  data: { revenue: number; transactions: number };
  providerCosts: { total: number; transactions: number };
  paystackFees: { total: number; transactions: number };
}

type AnnouncementType = "INFO" | "SUCCESS" | "WARNING" | "URGENT";

interface Announcement {
  _id: string;
  title: string;
  message: string;
  type: AnnouncementType;
  isActive: boolean;
  startDate?: string | null;
  endDate?: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy?: { name?: string; email?: string; role?: string } | null;
}

interface AdminTransaction {
  _id: string;
  user?: {
    _id?: string;
    id?: string;
    name?: string;
    email?: string;
    phone?: string | null;
  } | string | null;
  type: string;
  category: string;
  amount: number;
  status: string;
  reference: string;
  gatewayReference?: string | null;
  description?: string | null;
  createdAt: string;
  gateway?: string;
}

interface AdminTransactionsResponse {
  success?: boolean;
  transactions?: AdminTransaction[];
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
  message?: string;
}

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const formatMoney = (amount: number) =>
  `₦${Number(amount || 0).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDate = (date?: string | null) => {
  if (!date) return "No date";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "Invalid date";

  return parsed.toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (date?: string | null) => {
  if (!date) return "No date";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "Invalid date";

  return parsed.toLocaleString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const normalizeFinancialData = (
  data: Partial<FinancialData> | null | undefined
): FinancialData | null => {
  if (!data) return null;

  return {
    revenue: {
      total: Number(data.revenue?.total ?? 0),
      transactions: Number(data.revenue?.transactions ?? 0),
    },
    expenses: {
      total: Number(data.expenses?.total ?? 0),
      transactions: Number(data.expenses?.transactions ?? 0),
    },
    grossProfit:
      typeof data.grossProfit === "number" ? data.grossProfit : null,
    financialResult:
      typeof data.financialResult === "number" ? data.financialResult : null,
    profitStatus:
      data.profitStatus === "COMPLETE" ||
      data.profitStatus === "RECORDED_COSTS_COMPLETE"
        ? "RECORDED_COSTS_COMPLETE"
        : "PROVISIONAL",
    providerCostsComplete: data.providerCostsComplete === true,
    airtime: {
      revenue: Number(data.airtime?.revenue ?? 0),
      transactions: Number(data.airtime?.transactions ?? 0),
    },
    data: {
      revenue: Number(data.data?.revenue ?? 0),
      transactions: Number(data.data?.transactions ?? 0),
    },
    providerCosts: {
      total: Number(data.providerCosts?.total ?? 0),
      transactions: Number(data.providerCosts?.transactions ?? 0),
    },
    paystackFees: {
      total: Number(data.paystackFees?.total ?? 0),
      transactions: Number(data.paystackFees?.transactions ?? 0),
    },
  };
};

const statusClass = (status: string) => {
  const value = status.toUpperCase();

  if (["SUCCESS", "SUCCESSFUL", "COMPLETED"].includes(value)) {
    return "bg-emerald-100 text-emerald-700";
  }

  if (["PENDING", "PROCESSING"].includes(value)) {
    return "bg-amber-100 text-amber-700";
  }

  if (["FAILED", "CANCELLED", "REVERSED"].includes(value)) {
    return "bg-red-100 text-red-700";
  }

  return "bg-slate-100 text-slate-700";
};

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [financialData, setFinancialData] = useState<FinancialData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [error, setError] = useState("");

  // Password management
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // Data plan pricing
  const [pricingPlans, setPricingPlans] = useState<DataPricingPlan[]>([]);
  const [pricingLoading, setPricingLoading] = useState(false);
  const [pricingError, setPricingError] = useState("");
  const [pricingMessage, setPricingMessage] = useState("");
  const [pricingDrafts, setPricingDrafts] = useState<
    Record<string, { sellingPrice: string; providerCost: string }>
  >({});
  const [pricingSaving, setPricingSaving] = useState<string | null>(null);

  // Provider mapping
  const [pricingProviders, setPricingProviders] = useState<DataPricingProvider[]>([]);
  const [mappingProviderDrafts, setMappingProviderDrafts] = useState<Record<string, string>>({});
  const [mappingCatalogues, setMappingCatalogues] = useState<Record<string, ProviderCataloguePlan[]>>({});
  const [mappingSelectedCodes, setMappingSelectedCodes] = useState<Record<string, string>>({});
  const [mappingCosts, setMappingCosts] = useState<Record<string, string>>({});
  const [mappingCostConfirmed, setMappingCostConfirmed] = useState<Record<string, boolean>>({});
  const [mappingLoading, setMappingLoading] = useState<string | null>(null);
  const [mappingSaving, setMappingSaving] = useState<string | null>(null);
  const [mappingError, setMappingError] = useState("");
  const [mappingMessage, setMappingMessage] = useState("");

  // Announcements
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(false);
  const [announcementError, setAnnouncementError] = useState("");
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementMessage, setAnnouncementMessage] = useState("");
  const [announcementType, setAnnouncementType] = useState<AnnouncementType>("INFO");
  const [announcementActive, setAnnouncementActive] = useState(true);
  const [announcementStartDate, setAnnouncementStartDate] = useState("");
  const [announcementEndDate, setAnnouncementEndDate] = useState("");
  const [announcementSaving, setAnnouncementSaving] = useState(false);

  // Admin transactions
  const [adminTransactions, setAdminTransactions] = useState<AdminTransaction[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [transactionsError, setTransactionsError] = useState("");
  const [transactionsPage, setTransactionsPage] = useState(1);
  const [transactionsTotal, setTransactionsTotal] = useState(0);
  const [transactionsTotalPages, setTransactionsTotalPages] = useState(1);
  const [transactionSearch, setTransactionSearch] = useState("");
  const [transactionStatus, setTransactionStatus] = useState("");
  const [transactionCategory, setTransactionCategory] = useState("");
  const [transactionType, setTransactionType] = useState("");
  const [transactionFrom, setTransactionFrom] = useState("");
  const [transactionTo, setTransactionTo] = useState("");

  // Load all customer transactions through the admin-only endpoint.
  const loadAdminTransactions = async (
    requestedPage = 1,
    overrides?: {
      search?: string;
      status?: string;
      category?: string;
      type?: string;
      from?: string;
      to?: string;
    }
  ) => {
    try {
      setTransactionsLoading(true);
      setTransactionsError("");

      const filters = {
        search: overrides?.search ?? transactionSearch,
        status: overrides?.status ?? transactionStatus,
        category: overrides?.category ?? transactionCategory,
        type: overrides?.type ?? transactionType,
        from: overrides?.from ?? transactionFrom,
        to: overrides?.to ?? transactionTo,
      };

      const params = new URLSearchParams({
        page: String(requestedPage),
        limit: "20",
      });

      if (filters.search.trim()) params.set("search", filters.search.trim());
      if (filters.status) params.set("status", filters.status);
      if (filters.category) params.set("category", filters.category);
      if (filters.type) params.set("type", filters.type);
      if (filters.from) params.set("from", filters.from);
      if (filters.to) params.set("to", filters.to);

      const response = await fetch(
        `${API_URL}/admin/transactions?${params.toString()}`,
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        }
      );

      const result: AdminTransactionsResponse = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to load transactions.");
      }

      setAdminTransactions(
        Array.isArray(result.transactions) ? result.transactions : []
      );
      setTransactionsTotal(Number(result.total ?? 0));
      setTransactionsPage(Number(result.page ?? requestedPage));
      setTransactionsTotalPages(
        Math.max(1, Number(result.totalPages ?? 1))
      );
    } catch (err) {
      console.error("Admin transactions error:", err);
      setTransactionsError(
        err instanceof Error ? err.message : "Unable to load transactions."
      );
    } finally {
      setTransactionsLoading(false);
    }
  };

  // Financial data
  const loadFinancialData = async () => {
    try {
      const response = await fetch(`${API_URL}/financial-ledger/summary`, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to load financial data.");
      }

      setFinancialData(normalizeFinancialData(result.data));
      setError("");
    } catch (err) {
      console.error("Financial dashboard error:", err);
      setError(err instanceof Error ? err.message : "Unable to load financial data.");
    }
  };

  // Provider list and mapping drafts
  const loadMappingProviders = async (plans: DataPricingPlan[]) => {
    try {
      const response = await fetch(`${API_URL}/data-pricing/providers`, {
        credentials: "include",
        cache: "no-store",
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Could not load providers.");
      }

      const providers: DataPricingProvider[] = Array.isArray(result.data)
        ? result.data
        : [];

      setPricingProviders(providers);

      setMappingProviderDrafts((previous) => {
        const next = { ...previous };
        for (const plan of plans) {
          if (next[plan.id] === undefined || next[plan.id] === "") {
            next[plan.id] =
              providers.find((p) => p.key === plan.provider?.key)?.key ||
              providers[0]?.key ||
              "";
          }
        }
        return next;
      });

      setMappingCosts((previous) => {
        const next = { ...previous };
        for (const plan of plans) {
          if (next[plan.id] === undefined) {
            next[plan.id] =
              plan.providerCost == null ? "" : String(plan.providerCost);
          }
        }
        return next;
      });

      setMappingSelectedCodes((previous) => {
        const next = { ...previous };
        for (const plan of plans) {
          if (next[plan.id] === undefined && plan.providerPlan?.code) {
            next[plan.id] = plan.providerPlan.code;
          }
        }
        return next;
      });
    } catch (err) {
      setMappingError(err instanceof Error ? err.message : "Could not load providers.");
    }
  };

  // Load the selected provider's live catalogue
  const loadProviderCatalogue = async (plan: DataPricingPlan) => {
    const providerKey = mappingProviderDrafts[plan.id];

    if (!providerKey) {
      setMappingError("Select a provider first.");
      return;
    }

    setMappingLoading(plan.id);
    setMappingError("");
    setMappingMessage("");

    try {
      const response = await fetch(
        `${API_URL}/data-pricing/providers/${encodeURIComponent(providerKey)}/catalogue?network=${encodeURIComponent(plan.network)}`,
        { credentials: "include", cache: "no-store" }
      );
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Could not load provider catalogue.");
      }

      const catalogue: ProviderCataloguePlan[] = Array.isArray(result.data?.plans)
        ? result.data.plans
        : [];

      setMappingCatalogues((previous) => ({
        ...previous,
        [plan.id]: catalogue,
      }));

      const currentCode =
        plan.provider?.key === providerKey ? plan.providerPlan?.code : "";

      setMappingSelectedCodes((previous) => ({
        ...previous,
        [plan.id]:
          currentCode && catalogue.some((item) => item.code === currentCode)
            ? currentCode
            : "",
      }));

      setMappingMessage(
        catalogue.length
          ? `Loaded ${catalogue.length} catalogue plan(s).`
          : "The provider returned no plans for this network."
      );
    } catch (err) {
      setMappingError(err instanceof Error ? err.message : "Could not load catalogue.");
    } finally {
      setMappingLoading(null);
    }
  };

  // Save mapping; do not change the customer selling price.
  const saveProviderMapping = async (plan: DataPricingPlan) => {
    const providerKey = mappingProviderDrafts[plan.id];
    const providerPlanCode = mappingSelectedCodes[plan.id];
    const rawCost = mappingCosts[plan.id];
    const providerCost = Number(rawCost);

    if (!providerKey || !providerPlanCode) {
      setMappingError("Select a provider and a catalogue plan.");
      return;
    }

    if (
      rawCost === undefined ||
      rawCost.trim() === "" ||
      !Number.isFinite(providerCost) ||
      providerCost < 0
    ) {
      setMappingError("Enter a valid provider buying cost.");
      return;
    }

    if (mappingCostConfirmed[plan.id] !== true) {
      setMappingError("Confirm that you have verified the actual buying cost.");
      return;
    }

    setMappingSaving(plan.id);
    setMappingError("");
    setMappingMessage("");

    try {
      const response = await fetch(
        `${API_URL}/data-pricing/plans/${encodeURIComponent(plan.id)}/mapping`,
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            providerKey,
            providerPlanCode,
            providerCost,
            costConfirmed: true,
          }),
        }
      );
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Could not save provider mapping.");
      }

      setMappingCostConfirmed((previous) => ({
        ...previous,
        [plan.id]: false,
      }));

      setMappingMessage(
        "Provider mapping saved. The customer selling price was not changed."
      );

      await loadDataPricing();
    } catch (err) {
      setMappingError(err instanceof Error ? err.message : "Could not save mapping.");
    } finally {
      setMappingSaving(null);
    }
  };

  // Load pricing plans
  const loadDataPricing = async () => {
    try {
      setPricingLoading(true);
      setPricingError("");

      const response = await fetch(`${API_URL}/data-pricing/plans`, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to load data pricing.");
      }

      const plans: DataPricingPlan[] = Array.isArray(result.data) ? result.data : [];
      setPricingPlans(plans);
      await loadMappingProviders(plans);

      setPricingDrafts((previous) => {
        const next = { ...previous };
        for (const plan of plans) {
          if (next[plan.id] === undefined) {
            next[plan.id] = {
              sellingPrice: String(plan.sellingPrice),
              providerCost:
                plan.providerCost === null ? "" : String(plan.providerCost),
            };
          }
        }
        return next;
      });
    } catch (err) {
      setPricingError(err instanceof Error ? err.message : "Unable to load data pricing.");
    } finally {
      setPricingLoading(false);
    }
  };

  // Save independent selling price and cost
  const saveDataPricing = async (plan: DataPricingPlan) => {
    const draft = pricingDrafts[plan.id];
    if (!draft) return;

    const sellingPrice = Number(draft.sellingPrice);
    const providerCost = Number(draft.providerCost);

    if (!Number.isFinite(sellingPrice) || sellingPrice <= 0) {
      setPricingError("Enter a selling price greater than zero.");
      return;
    }

    if (
      draft.providerCost.trim() === "" ||
      !Number.isFinite(providerCost) ||
      providerCost < 0
    ) {
      setPricingError("Enter a valid provider cost before saving.");
      return;
    }

    try {
      setPricingSaving(plan.id);
      setPricingError("");
      setPricingMessage("");

      const response = await fetch(
        `${API_URL}/data-pricing/plans/${encodeURIComponent(plan.id)}`,
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sellingPrice, providerCost }),
        }
      );
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to save pricing.");
      }

      setPricingMessage(`Pricing saved for ${plan.name}.`);
      await loadDataPricing();
    } catch (err) {
      setPricingError(err instanceof Error ? err.message : "Unable to save pricing.");
    } finally {
      setPricingSaving(null);
    }
  };

  // Enable or disable a data plan
  const toggleDataPlan = async (plan: DataPricingPlan) => {
    try {
      setPricingSaving(plan.id);
      setPricingError("");
      setPricingMessage("");

      const response = await fetch(
        `${API_URL}/data-pricing/plans/${encodeURIComponent(plan.id)}`,
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ active: !plan.active }),
        }
      );
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to update plan availability.");
      }

      setPricingMessage(`${plan.name} is now ${plan.active ? "disabled" : "enabled"}.`);
      await loadDataPricing();
    } catch (err) {
      setPricingError(err instanceof Error ? err.message : "Unable to update plan availability.");
    } finally {
      setPricingSaving(null);
    }
  };

  // Announcements
  const loadAnnouncements = async () => {
    try {
      setAnnouncementsLoading(true);
      setAnnouncementError("");

      const response = await fetch(`${API_URL}/announcements/admin/all`, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to load announcements.");
      }

      setAnnouncements(result.announcements || []);
    } catch (err) {
      console.error("Announcements error:", err);
      setAnnouncementError(err instanceof Error ? err.message : "Unable to load announcements.");
    } finally {
      setAnnouncementsLoading(false);
    }
  };

  const resetAnnouncementForm = () => {
    setAnnouncementTitle("");
    setAnnouncementMessage("");
    setAnnouncementType("INFO");
    setAnnouncementActive(true);
    setAnnouncementStartDate("");
    setAnnouncementEndDate("");
    setEditingAnnouncement(null);
    setShowAnnouncementForm(false);
    setAnnouncementError("");
  };

  const handleAnnouncementSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!announcementTitle.trim()) {
      setAnnouncementError("Please enter an announcement title.");
      return;
    }

    if (!announcementMessage.trim()) {
      setAnnouncementError("Please enter an announcement message.");
      return;
    }

    if (
      announcementStartDate &&
      announcementEndDate &&
      announcementEndDate < announcementStartDate
    ) {
      setAnnouncementError("End date cannot be earlier than start date.");
      return;
    }

    try {
      setAnnouncementSaving(true);
      setAnnouncementError("");

      const isEditing = Boolean(editingAnnouncement);
      const url = isEditing
        ? `${API_URL}/announcements/${editingAnnouncement?._id}`
        : `${API_URL}/announcements`;

      const response = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: announcementTitle.trim(),
          message: announcementMessage.trim(),
          type: announcementType,
          isActive: announcementActive,
          startDate: announcementStartDate || null,
          endDate: announcementEndDate || null,
        }),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to save announcement.");
      }

      resetAnnouncementForm();
      await loadAnnouncements();
    } catch (err) {
      setAnnouncementError(err instanceof Error ? err.message : "Unable to save announcement.");
    } finally {
      setAnnouncementSaving(false);
    }
  };

  const handleEditAnnouncement = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setAnnouncementTitle(announcement.title);
    setAnnouncementMessage(announcement.message);
    setAnnouncementType(announcement.type);
    setAnnouncementActive(announcement.isActive);
    setAnnouncementStartDate(announcement.startDate?.slice(0, 10) || "");
    setAnnouncementEndDate(announcement.endDate?.slice(0, 10) || "");
    setShowAnnouncementForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleToggleAnnouncement = async (announcement: Announcement) => {
    try {
      setAnnouncementError("");

      const response = await fetch(
        `${API_URL}/announcements/${announcement._id}/status`,
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive: !announcement.isActive }),
        }
      );
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to update announcement.");
      }

      await loadAnnouncements();
    } catch (err) {
      setAnnouncementError(err instanceof Error ? err.message : "Unable to update announcement.");
    }
  };

  const handleDeleteAnnouncement = async (announcement: Announcement) => {
    const confirmed = window.confirm(
      `Delete "${announcement.title}"?\n\nThis action cannot be undone.`
    );
    if (!confirmed) return;

    try {
      setAnnouncementError("");

      const response = await fetch(`${API_URL}/announcements/${announcement._id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to delete announcement.");
      }

      await loadAnnouncements();
    } catch (err) {
      setAnnouncementError(err instanceof Error ? err.message : "Unable to delete announcement.");
    }
  };

  // Change password
  const handleChangePassword = async (event: FormEvent) => {
    event.preventDefault();
    setPasswordMessage("");
    setPasswordError("");

    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    try {
      setChangePasswordLoading(true);

      const response = await fetch(`${API_URL}/auth/change-password`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to change password.");
      }

      setPasswordMessage("Password changed successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : "Unable to change password.");
    } finally {
      setChangePasswordLoading(false);
    }
  };

  // Login/session check
  const checkLogin = async () => {
    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      if (!response.ok) {
        setUser(null);
        return;
      }

      const result = await response.json();

      if (result.success && result.user) {
        setUser(result.user);
        await Promise.all([
          loadFinancialData(),
          loadAnnouncements(),
          loadDataPricing(),
          loadAdminTransactions(1),
        ]);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error("Login check error:", err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();

    try {
      setLoginLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/auth/admin-login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Login failed.");
      }

      setUser(result.user);

      await Promise.all([
        loadFinancialData(),
        loadAnnouncements(),
        loadDataPricing(),
        loadAdminTransactions(1),
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to login.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("Logout error:", err);
    }

    setUser(null);
    setFinancialData(null);
    setAnnouncements([]);
    setAdminTransactions([]);
    setError("");
  };

  useEffect(() => {
    checkLogin();
  }, []);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-slate-700 border-t-blue-500" />
          <p className="text-sm font-medium text-slate-300">Loading AbuPay Admin...</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-6">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-blue-600/20 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-indigo-600/20 blur-3xl" />

        <div className="relative w-full max-w-md">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-xl shadow-blue-900/30">
              <span className="text-2xl font-black text-white">A</span>
            </div>
            <p className="text-sm font-bold tracking-widest text-blue-400">ABUPAY</p>
            <h1 className="mt-3 text-3xl font-bold text-white">Admin Portal</h1>
            <p className="mt-2 text-sm text-slate-400">
              Secure access to your financial dashboard
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-8 shadow-2xl backdrop-blur-xl">
            {error && (
              <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4">
                <p className="text-sm font-medium text-red-400">{error}</p>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  placeholder="admin@example.com"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-white outline-none placeholder:text-slate-600 focus:border-blue-500 focus:bg-white/10"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  placeholder="Enter your password"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-white outline-none placeholder:text-slate-600 focus:border-blue-500 focus:bg-white/10"
                />
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3.5 font-semibold text-white shadow-lg transition hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50"
              >
                {loginLoading ? "Signing in..." : "Sign in to Admin"}
              </button>
            </form>
          </div>

          <p className="mt-6 text-center text-xs text-slate-600">
            AbuPay secure administration portal
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      {/* HEADER */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-5">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg shadow-blue-200">
              <span className="font-black text-white">A</span>
            </div>
            <div>
              <p className="text-sm font-bold tracking-wide text-blue-600">ABUPAY</p>
              <h1 className="text-xl font-bold">Admin Dashboard</h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold">{user.name}</p>
              <p className="text-xs text-slate-500">Administrator</p>
            </div>

            <button
              onClick={() => {
                setShowChangePassword(!showChangePassword);
                setPasswordMessage("");
                setPasswordError("");
              }}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Change Password
            </button>

            <button
              onClick={() => {
                loadFinancialData();
                loadAnnouncements();
                loadDataPricing();
                loadAdminTransactions(1);
              }}
              className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700"
            >
              Refresh
            </button>

            <button
              onClick={handleLogout}
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-100"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* NAVIGATION */}
      <nav
        aria-label="Admin sections"
        className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur"
      >
        <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-6 py-3">
          <a href="#admin-financial-overview" className="shrink-0 rounded-lg bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100">
            Financial Overview
          </a>
          <a href="#admin-transactions" className="shrink-0 rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">
            Transactions
          </a>
          <a href="#admin-data-pricing" className="shrink-0 rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">
            Data Plan Pricing
          </a>
          <a href="#admin-announcements" className="shrink-0 rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">
            Announcements
          </a>
        </div>
      </nav>

      {/* CHANGE PASSWORD */}
      {showChangePassword && (
        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-6 py-8">
            <div className="max-w-2xl rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <h2 className="text-xl font-bold">Change Password</h2>
              <p className="mt-1 text-sm text-slate-500">
                Update the password for your AbuPay administrator account.
              </p>

              {passwordMessage && (
                <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
                  {passwordMessage}
                </p>
              )}
              {passwordError && (
                <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
                  {passwordError}
                </p>
              )}

              <form onSubmit={handleChangePassword} className="mt-5 space-y-5">
                <label className="block text-sm font-semibold">
                  Current Password
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(event) => setCurrentPassword(event.target.value)}
                    required
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3"
                  />
                </label>
                <label className="block text-sm font-semibold">
                  New Password
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    required
                    minLength={6}
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3"
                  />
                </label>
                <label className="block text-sm font-semibold">
                  Confirm New Password
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    required
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3"
                  />
                </label>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="submit"
                    disabled={changePasswordLoading}
                    className="rounded-xl bg-slate-900 px-6 py-3 font-semibold text-white disabled:opacity-50"
                  >
                    {changePasswordLoading ? "Changing..." : "Change Password"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowChangePassword(false)}
                    className="rounded-xl border border-slate-300 bg-white px-6 py-3 font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </section>
      )}

      <section className="mx-auto max-w-7xl space-y-12 px-6 py-8">
        {/* FINANCIAL OVERVIEW */}
        <div id="admin-financial-overview" className="scroll-mt-24">
          <div className="mb-8">
            <p className="text-sm font-semibold text-blue-600">Dashboard / Financial Overview</p>
            <h2 className="mt-2 text-3xl font-bold">Financial Overview</h2>
            <p className="mt-2 text-slate-500">
              Monitor AbuPay revenue, expenses, provider costs and transaction activity.
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="text-sm font-medium text-red-700">{error}</p>
              <button
                onClick={loadFinancialData}
                className="mt-3 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-700"
              >
                Retry financial data
              </button>
            </div>
          )}

          {!financialData && !error && (
            <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
              <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
              <p className="text-slate-500">Loading financial data...</p>
            </div>
          )}

          {financialData && (
            <>
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <p className="text-sm font-medium text-slate-500">Recorded Revenue</p>
                  <p className="mt-3 text-3xl font-bold">{formatMoney(financialData.revenue.total)}</p>
                  <p className="mt-2 text-xs text-slate-500">{financialData.revenue.transactions} revenue transactions</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <p className="text-sm font-medium text-slate-500">Recorded Expenses</p>
                  <p className="mt-3 text-3xl font-bold">{formatMoney(financialData.expenses.total)}</p>
                  <p className="mt-2 text-xs text-slate-500">{financialData.expenses.transactions} expense transactions</p>
                </div>
<div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
  <p className="text-sm font-medium text-slate-500">
    Financial Result (Provisional)
  </p>
  <p className="mt-3 text-3xl font-bold">
    {financialData.financialResult === null
      ? "Not available"
      : formatMoney(financialData.financialResult)}
  </p>
  <p className="mt-2 text-xs text-amber-700">
    {financialData.financialResult === null
      ? "A reliable financial result cannot be calculated until every service sale has a verified provider cost."
      : "This result uses the financial records currently available and is not necessarily confirmed net profit."}
  </p>
</div>
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <p className="text-sm font-medium text-slate-500">Paystack Fees</p>
                  <p className="mt-3 text-3xl font-bold">
  {financialData.financialResult === null
    ? "Not available"
    : formatMoney(financialData.financialResult)}
</p>
                  <p className="mt-2 text-xs text-slate-500">{financialData.paystackFees.transactions} recorded fees</p>
                </div>
              </div>

              <div className="mt-8">
                <h3 className="text-xl font-bold">Service Revenue</h3>
                <p className="mt-1 text-sm text-slate-500">Revenue generated from AbuPay services.</p>
                <div className="mt-4 grid gap-5 md:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <p className="text-sm font-medium text-slate-500">Airtime</p>
                    <p className="mt-2 text-2xl font-bold">{formatMoney(financialData.airtime.revenue)}</p>
                    <p className="mt-2 text-sm text-slate-500">{financialData.airtime.transactions} transactions</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <p className="text-sm font-medium text-slate-500">Data</p>
                    <p className="mt-2 text-2xl font-bold">{formatMoney(financialData.data.revenue)}</p>
                    <p className="mt-2 text-sm text-slate-500">{financialData.data.transactions} transactions</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-xl font-bold">Provider Costs</h3>
                <p className="mt-1 text-sm text-slate-500">Costs recorded from service providers.</p>
                <p className="mt-4 text-3xl font-bold">{formatMoney(financialData.providerCosts.total)}</p>
                <p className="mt-2 text-sm text-slate-500">
                  {financialData.providerCosts.transactions} recorded provider-cost transactions
                </p>
                {!financialData.providerCostsComplete && (
                  <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                    Provider-cost records are not confirmed complete. This figure may not represent all service costs.
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        {/* ALL TRANSACTIONS */}
        <div id="admin-transactions" className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-blue-600">Administration / Records</p>
                <h2 className="mt-1 text-2xl font-bold">All Transactions</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Search customer transactions and review their references, amounts and statuses.
                </p>
              </div>
              <button
                onClick={() => loadAdminTransactions(1)}
                disabled={transactionsLoading}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50"
              >
                {transactionsLoading ? "Loading..." : "Refresh transactions"}
              </button>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <label className="text-sm font-medium text-slate-700">
                Search
                <input
                  type="search"
                  value={transactionSearch}
                  onChange={(event) => setTransactionSearch(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") loadAdminTransactions(1);
                  }}
                  placeholder="Reference, customer, email or phone"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </label>

              <label className="text-sm font-medium text-slate-700">
                Status
                <select
                  value={transactionStatus}
                  onChange={(event) => setTransactionStatus(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
                >
                  <option value="">Any status</option>
                  <option value="SUCCESS">Success</option>
                  <option value="PENDING">Pending</option>
                  <option value="FAILED">Failed</option>
                </select>
              </label>

              <label className="text-sm font-medium text-slate-700">
                Category
                <select
                  value={transactionCategory}
                  onChange={(event) => setTransactionCategory(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
                >
                  <option value="">Any category</option>
                  <option value="WALLET_FUNDING">Wallet Funding</option>
                  <option value="AIRTIME">Airtime</option>
                  <option value="DATA">Data</option>
                  <option value="CABLE">Cable TV</option>
                  <option value="ELECTRICITY">Electricity</option>
                  <option value="REFUND">Refund</option>
                  <option value="TRANSFER">Transfer</option>
                </select>
              </label>

              <label className="text-sm font-medium text-slate-700">
                Transaction type
                <select
                  value={transactionType}
                  onChange={(event) => setTransactionType(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
                >
                  <option value="">Any type</option>
                  <option value="CREDIT">Credit</option>
                  <option value="DEBIT">Debit</option>
                </select>
              </label>

              <label className="text-sm font-medium text-slate-700">
                From date
                <input
                  type="date"
                  value={transactionFrom}
                  onChange={(event) => setTransactionFrom(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </label>

              <label className="text-sm font-medium text-slate-700">
                To date
                <input
                  type="date"
                  value={transactionTo}
                  onChange={(event) => setTransactionTo(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </label>
            </div>

            {transactionFrom && transactionTo && transactionFrom > transactionTo && (
              <p className="mt-3 text-sm text-red-600">
                The start date cannot be later than the end date.
              </p>
            )}

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                onClick={() => loadAdminTransactions(1)}
                disabled={transactionsLoading || Boolean(transactionFrom && transactionTo && transactionFrom > transactionTo)}
                className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                Apply filters
              </button>
              <button
                onClick={() => {
                  const emptyFilters = {
                    search: "",
                    status: "",
                    category: "",
                    type: "",
                    from: "",
                    to: "",
                  };
                  setTransactionSearch("");
                  setTransactionStatus("");
                  setTransactionCategory("");
                  setTransactionType("");
                  setTransactionFrom("");
                  setTransactionTo("");
                  loadAdminTransactions(1, emptyFilters);
                }}
                disabled={transactionsLoading}
                className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50"
              >
                Clear filters
              </button>
            </div>
          </div>

          {transactionsError && (
            <div className="m-6 rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="text-sm font-semibold text-red-700">{transactionsError}</p>
              <button
                onClick={() => loadAdminTransactions(transactionsPage)}
                className="mt-2 text-sm font-semibold text-red-700 underline"
              >
                Try again
              </button>
            </div>
          )}

          <div className="border-b border-slate-200 px-6 py-4">
            <p className="text-sm text-slate-500">
              {transactionsTotal.toLocaleString("en-NG")} total record(s)
              {" · "}Page {transactionsPage} of {transactionsTotalPages}
            </p>
          </div>

          {transactionsLoading ? (
            <div className="p-10 text-center text-sm text-slate-500">
              Loading transactions...
            </div>
          ) : adminTransactions.length === 0 ? (
            <div className="p-10 text-center">
              <h3 className="font-semibold">No transactions found</h3>
              <p className="mt-1 text-sm text-slate-500">
                Try changing your filters, or refresh to check again.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[1100px] w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-4 font-semibold">Date</th>
                    <th className="px-5 py-4 font-semibold">Customer</th>
                    <th className="px-5 py-4 font-semibold">Reference</th>
                    <th className="px-5 py-4 font-semibold">Category</th>
                    <th className="px-5 py-4 font-semibold">Type</th>
                    <th className="px-5 py-4 font-semibold">Amount</th>
                    <th className="px-5 py-4 font-semibold">Status</th>
                    <th className="px-5 py-4 font-semibold">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {adminTransactions.map((transaction) => {
                    const customer =
                      typeof transaction.user === "object" && transaction.user
                        ? transaction.user
                        : null;

                    return (
                      <tr key={transaction._id} className="hover:bg-slate-50">
                        <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                          {formatDateTime(transaction.createdAt)}
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-semibold text-slate-900">
                            {customer?.name || "Customer"}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {customer?.email || ""}
                          </p>
                          {customer?.phone && (
                            <p className="mt-1 text-xs text-slate-500">{customer.phone}</p>
                          )}
                          {typeof transaction.user === "string" && (
                            <p className="mt-1 text-xs text-slate-500">
                              Customer ID: {transaction.user}
                            </p>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-mono text-xs text-slate-700">
                            {transaction.reference || "—"}
                          </p>
                          {transaction.gatewayReference && (
                            <p className="mt-1 text-xs text-slate-400">
                              Gateway: {transaction.gatewayReference}
                            </p>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          {String(transaction.category || "—").replaceAll("_", " ")}
                        </td>
                        <td className="px-5 py-4">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            transaction.type?.toUpperCase() === "CREDIT"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-slate-100 text-slate-700"
                          }`}>
                            {transaction.type || "—"}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 font-semibold">
                          {formatMoney(Number(transaction.amount || 0))}
                        </td>
                        <td className="px-5 py-4">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(transaction.status || "")}`}>
                            {transaction.status || "UNKNOWN"}
                          </span>
                        </td>
                        <td className="max-w-xs px-5 py-4 text-slate-600">
                          <p className="line-clamp-2">
                            {transaction.description || transaction.gateway || "—"}
                          </p>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-6 py-4">
            <p className="text-sm text-slate-500">
              Showing {adminTransactions.length} record(s) on this page
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => loadAdminTransactions(transactionsPage - 1)}
                disabled={transactionsLoading || transactionsPage <= 1}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>
              <button
                onClick={() => loadAdminTransactions(transactionsPage + 1)}
                disabled={transactionsLoading || transactionsPage >= transactionsTotalPages}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* ABUPAY DATA PLAN PRICING */}
        <div id="admin-data-pricing" className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-blue-600">Admin / Service Configuration</p>
              <h2 className="mt-2 text-2xl font-bold">AbuPay Data Plan Pricing</h2>
              <p className="mt-2 text-sm text-slate-500">
                Provider buying costs and customer selling prices are separate. Catalogue amounts are informational and do not automatically change customer prices.
              </p>
            </div>
            <button
              onClick={loadDataPricing}
              disabled={pricingLoading}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50"
            >
              {pricingLoading ? "Loading..." : "Refresh plans"}
            </button>
          </div>

          {pricingError && (
            <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {pricingError}
            </p>
          )}
          {pricingMessage && (
            <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
              {pricingMessage}
            </p>
          )}
          {mappingError && (
            <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {mappingError}
            </p>
          )}
          {mappingMessage && (
            <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
              {mappingMessage}
            </p>
          )}

          {pricingLoading && pricingPlans.length === 0 && (
            <p className="mt-6 text-sm text-slate-500">Loading mapped plans...</p>
          )}

          {!pricingLoading && pricingPlans.length === 0 && !pricingError && (
            <p className="mt-6 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
              No mapped data plans were returned. No plans have been created automatically. Check the provider catalogue and plan mappings before setting prices.
            </p>
          )}

          {pricingPlans.length > 0 && (
            <div className="mt-6 space-y-4">
              {pricingPlans.map((plan) => {
                const draft = pricingDrafts[plan.id];
                const selling = Number(draft?.sellingPrice);
                const cost = Number(draft?.providerCost);
                const valid = Boolean(
                  draft &&
                  draft.sellingPrice.trim() !== "" &&
                  draft.providerCost.trim() !== "" &&
                  Number.isFinite(selling) &&
                  selling > 0 &&
                  Number.isFinite(cost) &&
                  cost >= 0
                );

                return (
                  <div key={plan.id} className="rounded-xl border border-slate-200 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-slate-900">{plan.name}</h3>
                        <p className="mt-1 text-sm text-slate-500">
                          {plan.network.toUpperCase()} · {plan.dataType}
                          {plan.validity ? ` · ${plan.validity}` : ""}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Provider: {plan.provider?.displayName || "Not mapped"}
                          {" · "}Provider plan: {plan.providerPlan?.name || "Not mapped"}
                        </p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        plan.active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
                      }`}>
                        {plan.active ? "Enabled" : "Disabled"}
                      </span>
                    </div>

                    <div className="mt-4 grid gap-4 sm:grid-cols-3">
                      <label className="block text-sm">
                        <span className="mb-1 block text-slate-600">Provider cost (₦)</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={draft?.providerCost ?? ""}
                          onChange={(event) =>
                            setPricingDrafts((previous) => ({
                              ...previous,
                              [plan.id]: {
                                sellingPrice: previous[plan.id]?.sellingPrice ?? String(plan.sellingPrice),
                                providerCost: event.target.value,
                              },
                            }))
                          }
                          className="w-full rounded-lg border border-slate-300 px-3 py-2"
                        />
                      </label>

                      <label className="block text-sm">
                        <span className="mb-1 block text-slate-600">Customer selling price (₦)</span>
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={draft?.sellingPrice ?? String(plan.sellingPrice)}
                          onChange={(event) =>
                            setPricingDrafts((previous) => ({
                              ...previous,
                              [plan.id]: {
                                sellingPrice: event.target.value,
                                providerCost: previous[plan.id]?.providerCost ??
                                  (plan.providerCost === null ? "" : String(plan.providerCost)),
                              },
                            }))
                          }
                          className="w-full rounded-lg border border-slate-300 px-3 py-2"
                        />
                      </label>

                      <div>
                        <span className="mb-1 block text-sm text-slate-600">Expected gross profit</span>
                        <p className="rounded-lg bg-slate-50 px-3 py-2 font-semibold">
                          {valid ? formatMoney(selling - cost) : "Cost required"}
                        </p>
                      </div>
                    </div>

                    {!plan.providerPlan && (
                      <p className="mt-3 text-sm text-amber-700">
                        This plan has no linked provider plan. Verify its mapping before use.
                      </p>
                    )}

                    {/* Provider mapping */}
                    <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50/50 p-4">
                      <h3 className="text-sm font-bold text-slate-900">Provider mapping</h3>
                      <p className="mt-1 text-xs text-slate-600">
                        Select a provider, load its catalogue, choose the exact plan and confirm the actual buying cost.
                      </p>

                      <div className="mt-3 flex flex-col gap-3">
                        <label className="text-sm font-medium text-slate-700">
                          Provider
                          <select
                            className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2"
                            value={mappingProviderDrafts[plan.id] ?? ""}
                            onChange={(event) => {
                              const nextProvider = event.target.value;
                              setMappingProviderDrafts((previous) => ({
                                ...previous,
                                [plan.id]: nextProvider,
                              }));
                              setMappingCatalogues((previous) => ({
                                ...previous,
                                [plan.id]: [],
                              }));
                              setMappingSelectedCodes((previous) => ({
                                ...previous,
                                [plan.id]: "",
                              }));
                              setMappingCosts((previous) => ({
                                ...previous,
                                [plan.id]: "",
                              }));
                              setMappingCostConfirmed((previous) => ({
                                ...previous,
                                [plan.id]: false,
                              }));
                              setMappingError("");
                              setMappingMessage("");
                            }}
                          >
                            <option value="">Select provider</option>
                            {pricingProviders.map((provider) => (
                              <option key={provider.key} value={provider.key}>
                                {provider.displayName}
                              </option>
                            ))}
                          </select>
                        </label>

                        <button
                          type="button"
                          onClick={() => loadProviderCatalogue(plan)}
                          disabled={!mappingProviderDrafts[plan.id] || mappingLoading !== null}
                          className="self-start rounded-lg border border-blue-300 bg-white px-3 py-2 text-sm font-semibold text-blue-700 disabled:opacity-50"
                        >
                          {mappingLoading === plan.id ? "Loading catalogue..." : "Load live catalogue"}
                        </button>

                        {mappingCatalogues[plan.id] !== undefined && (
                          <label className="text-sm font-medium text-slate-700">
                            Provider plan
                            <select
                              className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2"
                              value={mappingSelectedCodes[plan.id] ?? ""}
                              onChange={(event) =>
                                setMappingSelectedCodes((previous) => ({
                                  ...previous,
                                  [plan.id]: event.target.value,
                                }))
                              }
                            >
                              <option value="">Select exact catalogue plan</option>
                              {mappingCatalogues[plan.id].map((item) => (
                                <option key={item.code} value={item.code}>
                                  {item.name} — {item.code}
                                  {item.validity ? ` — ${item.validity}` : ""}
                                  {item.catalogueAmount != null
                                    ? ` — catalogue amount ₦${item.catalogueAmount}`
                                    : ""}
                                </option>
                              ))}
                            </select>
                          </label>
                        )}

                        <label className="text-sm font-medium text-slate-700">
                          Verified provider buying cost (₦)
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={mappingCosts[plan.id] ?? ""}
                            onChange={(event) => {
                              setMappingCosts((previous) => ({
                                ...previous,
                                [plan.id]: event.target.value,
                              }));
                              setMappingCostConfirmed((previous) => ({
                                ...previous,
                                [plan.id]: false,
                              }));
                            }}
                            className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2"
                            placeholder="Enter actual provider cost"
                          />
                        </label>

                        <label className="flex items-start gap-2 text-xs text-slate-700">
                          <input
                            type="checkbox"
                            className="mt-0.5"
                            checked={mappingCostConfirmed[plan.id] === true}
                            onChange={(event) =>
                              setMappingCostConfirmed((previous) => ({
                                ...previous,
                                [plan.id]: event.target.checked,
                              }))
                            }
                          />
                          I have verified this buying cost against the selected provider account.
                        </label>

                        <button
                          type="button"
                          onClick={() => saveProviderMapping(plan)}
                          disabled={
                            mappingSaving !== null ||
                            !mappingSelectedCodes[plan.id] ||
                            !mappingCosts[plan.id]?.trim() ||
                            !Number.isFinite(Number(mappingCosts[plan.id])) ||
                            Number(mappingCosts[plan.id]) < 0 ||
                            mappingCostConfirmed[plan.id] !== true
                          }
                          className="self-start rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
                        >
                          {mappingSaving === plan.id ? "Saving mapping..." : "Save provider mapping"}
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        onClick={() => saveDataPricing(plan)}
                        disabled={pricingSaving !== null || !valid}
                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                      >
                        {pricingSaving === plan.id ? "Saving..." : "Save pricing"}
                      </button>
                      <button
                        onClick={() => toggleDataPlan(plan)}
                        disabled={pricingSaving !== null}
                        className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50"
                      >
                        {plan.active ? "Disable plan" : "Enable plan"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ANNOUNCEMENTS */}
        <div id="admin-announcements" className="scroll-mt-24">
          <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-semibold text-blue-600">Communications</p>
              <h2 className="mt-1 text-2xl font-bold">Announcements</h2>
              <p className="mt-1 text-sm text-slate-500">
                Create and manage messages displayed to AbuPay customers.
              </p>
            </div>
            <button
              onClick={() => {
                if (showAnnouncementForm) resetAnnouncementForm();
                else {
                  setShowAnnouncementForm(true);
                  setAnnouncementError("");
                }
              }}
              className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
            >
              {showAnnouncementForm ? "Cancel" : "+ New Announcement"}
            </button>
          </div>

          {showAnnouncementForm && (
            <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-xl font-bold">
                {editingAnnouncement ? "Edit Announcement" : "Create Announcement"}
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                This announcement can be displayed to AbuPay customers.
              </p>

              {announcementError && (
                <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
                  {announcementError}
                </p>
              )}

              <form onSubmit={handleAnnouncementSubmit} className="mt-5 space-y-5">
                <label className="block text-sm font-semibold">
                  Title
                  <input
                    type="text"
                    value={announcementTitle}
                    onChange={(event) => setAnnouncementTitle(event.target.value)}
                    placeholder="e.g. Welcome to AbuPay"
                    maxLength={150}
                    required
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3"
                  />
                </label>

                <label className="block text-sm font-semibold">
                  Message
                  <textarea
                    value={announcementMessage}
                    onChange={(event) => setAnnouncementMessage(event.target.value)}
                    placeholder="Enter the announcement message..."
                    maxLength={2000}
                    rows={5}
                    required
                    className="mt-2 w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3"
                  />
                  <span className="mt-1 block text-xs text-slate-400">
                    {announcementMessage.length} / 2000 characters
                  </span>
                </label>

                <div className="grid gap-5 md:grid-cols-3">
                  <label className="block text-sm font-semibold">
                    Announcement Type
                    <select
                      value={announcementType}
                      onChange={(event) => setAnnouncementType(event.target.value as AnnouncementType)}
                      className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3"
                    >
                      <option value="INFO">Info</option>
                      <option value="SUCCESS">Success</option>
                      <option value="WARNING">Warning</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                  </label>

                  <label className="block text-sm font-semibold">
                    Start Date
                    <input
                      type="date"
                      value={announcementStartDate}
                      onChange={(event) => setAnnouncementStartDate(event.target.value)}
                      className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3"
                    />
                  </label>

                  <label className="block text-sm font-semibold">
                    End Date
                    <input
                      type="date"
                      value={announcementEndDate}
                      onChange={(event) => setAnnouncementEndDate(event.target.value)}
                      className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3"
                    />
                  </label>
                </div>

                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <input
                    type="checkbox"
                    checked={announcementActive}
                    onChange={(event) => setAnnouncementActive(event.target.checked)}
                    className="h-5 w-5 rounded border-slate-300 text-blue-600"
                  />
                  <span>
                    <span className="block font-semibold">Publish announcement</span>
                    <span className="block text-sm text-slate-500">
                      Active announcements can be displayed to customers.
                    </span>
                  </span>
                </label>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="submit"
                    disabled={announcementSaving}
                    className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {announcementSaving
                      ? "Saving..."
                      : editingAnnouncement
                      ? "Update Announcement"
                      : "Publish Announcement"}
                  </button>
                  <button
                    type="button"
                    onClick={resetAnnouncementForm}
                    className="rounded-xl border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-700"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 p-6">
              <div>
                <h3 className="text-lg font-bold">All Announcements</h3>
                <p className="mt-1 text-sm text-slate-500">
                  {announcements.length} announcement{announcements.length === 1 ? "" : "s"}
                </p>
              </div>
              <button
                onClick={loadAnnouncements}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold hover:bg-slate-50"
              >
                Refresh
              </button>
            </div>

            {announcementError && (
              <p className="m-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
                {announcementError}
              </p>
            )}

            {announcementsLoading ? (
              <div className="p-10 text-center text-sm text-slate-500">Loading announcements...</div>
            ) : announcements.length === 0 ? (
              <div className="p-12 text-center">
                <h4 className="font-semibold">No announcements yet</h4>
                <p className="mt-1 text-sm text-slate-500">
                  Create your first AbuPay announcement.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {announcements.map((announcement) => (
                  <div key={announcement._id} className="p-6">
                    <div className="flex flex-col justify-between gap-5 lg:flex-row">
                      <div className="min-w-0 flex-1">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                            announcement.type === "INFO"
                              ? "bg-blue-100 text-blue-700"
                              : announcement.type === "SUCCESS"
                              ? "bg-emerald-100 text-emerald-700"
                              : announcement.type === "WARNING"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-red-100 text-red-700"
                          }`}>
                            {announcement.type}
                          </span>
                          <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                            announcement.isActive
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-100 text-slate-500"
                          }`}>
                            {announcement.isActive ? "ACTIVE" : "INACTIVE"}
                          </span>
                        </div>

                        <h4 className="text-lg font-bold">{announcement.title}</h4>
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                          {announcement.message}
                        </p>
                        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
                          <span>Created: {formatDate(announcement.createdAt)}</span>
                          {announcement.startDate && <span>Starts: {formatDate(announcement.startDate)}</span>}
                          {announcement.endDate && <span>Ends: {formatDate(announcement.endDate)}</span>}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-start gap-2">
                        <button
                          onClick={() => handleEditAnnouncement(announcement)}
                          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleToggleAnnouncement(announcement)}
                          className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                            announcement.isActive
                              ? "border border-amber-200 bg-amber-50 text-amber-700"
                              : "border border-emerald-200 bg-emerald-50 text-emerald-700"
                          }`}
                        >
                          {announcement.isActive ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          onClick={() => handleDeleteAnnouncement(announcement)}
                          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-100"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}