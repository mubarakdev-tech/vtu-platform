"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import {
  Wifi,
  Loader2,
  Check,
  X,
  Download,
  Share2,
  CheckCircle,
  ChevronDown,
} from "lucide-react";
import { getDataPlans, buyData } from "@/services/data";
import { PROVIDERS, ProviderId } from "@/lib/providers";
import { jsPDF } from "jspdf";

const networks = [
  {
    id: "mtn",
    name: "MTN",
    color: "bg-yellow-400",
    text: "text-black",
  },
  {
    id: "airtel",
    name: "Airtel",
    color: "bg-red-500",
    text: "text-white",
  },
  {
    id: "glo",
    name: "Glo",
    color: "bg-green-600",
    text: "text-white",
  },
  {
    id: "9mobile",
    name: "9mobile",
    color: "bg-emerald-700",
    text: "text-white",
  },
];

interface Plan {
  name: string;
  variation_code: string;
  amount: number;
}

interface ReceiptData {
  amount: number;
  phone: string;
  network: string;
  planName: string;
  reference: string;
  date: string;
  status: string;
  balanceBefore: number;
  balanceAfter: number;
}

export default function DataPage() {
  const [provider, setProvider] = useState<ProviderId>("vtpass");
  const [network, setNetwork] = useState("mtn");

  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

  const [phone, setPhone] = useState("");

  const [loadingPlans, setLoadingPlans] = useState(false);
  const [loadingPurchase, setLoadingPurchase] = useState(false);

  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [receipt, setReceipt] = useState<ReceiptData | null>(null);

  /*
   * LOAD DATA PLANS
   */
  useEffect(() => {
    loadPlans();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [network, provider]);

  const loadPlans = async () => {
    try {
      setLoadingPlans(true);
      setSelectedPlan(null);
      setMessage(null);
      setPlans([]);

      const result = await getDataPlans(network, provider);

      console.log("DATA PLANS RESPONSE:", result);

      let plansData: any[] = [];

      if (Array.isArray(result)) {
        plansData = result;
      } else if (Array.isArray(result?.data)) {
        plansData = result.data;
      } else if (Array.isArray(result?.plans)) {
        plansData = result.plans;
      } else if (Array.isArray(result?.data?.plans)) {
        plansData = result.data.plans;
      }

      const normalized: Plan[] = plansData
        .map((plan: any) => ({
          name:
            plan.name ||
            plan.plan_name ||
            plan.variation_name ||
            "Data Plan",

          variation_code: String(
            plan.variation_code ||
              plan.plan_id ||
              plan.code ||
              plan.id ||
              ""
          ),

          amount: Number(
            plan.amount ||
              plan.price ||
              plan.variation_amount ||
              0
          ),
        }))
        .filter(
          (plan) =>
            plan.variation_code &&
            plan.amount > 0
        );

      setPlans(normalized);

      if (normalized.length === 0) {
        setMessage({
          type: "error",
          text:
            "No data plans available for this network.",
        });
      }
    } catch (error: any) {
      console.error(
        "LOAD DATA PLANS ERROR:",
        error?.response?.data || error
      );

      setPlans([]);

      setMessage({
        type: "error",
        text:
          error?.response?.data?.message ||
          "Failed to load data plans. Please try again.",
      });
    } finally {
      setLoadingPlans(false);
    }
  };

  /*
   * PURCHASE DATA
   */
  const handlePurchase = async () => {
    if (!phone || phone.length < 11) {
      setMessage({
        type: "error",
        text: "Please enter a valid phone number.",
      });
      return;
    }

    if (!selectedPlan) {
      setMessage({
        type: "error",
        text: "Please select a data plan.",
      });
      return;
    }

    try {
      setLoadingPurchase(true);
      setMessage(null);

      const result = await buyData({
        network,
        phone,
        plan: selectedPlan.variation_code,
        amount: selectedPlan.amount,
        provider,
      });

      console.log("BUY DATA RESULT:", result);

      if (!result?.success) {
        setMessage({
          type: "error",
          text:
            result?.message ||
            "Data purchase failed. Please try again.",
        });
        return;
      }

      /*
       * Get transaction reference.
       */
      const reference =
        result.providerResponse?.request_id ||
        result.providerResponse?.data?.request_id ||
        result.transaction?._id ||
        result.transaction?.id ||
        "DATA-" + Date.now();

      /*
       * Get wallet balances returned by backend.
       */
      const balanceBefore = Number(
        result.balanceBefore ?? 0
      );

      const balanceAfter = Number(
        result.balanceAfter ??
          result.walletBalance ??
          balanceBefore - selectedPlan.amount
      );

      setReceipt({
        amount: selectedPlan.amount,
        phone,
        network,
        planName: selectedPlan.name,
        reference: String(reference),
        date: new Date().toLocaleString("en-NG"),
        status: "SUCCESS",
        balanceBefore,
        balanceAfter,
      });

      setMessage({
        type: "success",
        text:
          selectedPlan.name +
          " sent successfully to " +
          phone,
      });

      setPhone("");
      setSelectedPlan(null);
    } catch (error: any) {
      console.error(
        "BUY DATA ERROR:",
        error?.response?.data || error
      );

      setMessage({
        type: "error",
        text:
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Something went wrong. Please try again.",
      });
    } finally {
      setLoadingPurchase(false);
    }
  };

  /*
   * DOWNLOAD PDF RECEIPT
   */
  const downloadPdf = (tx: ReceiptData) => {
    const doc = new jsPDF();

    /*
     * Header
     */
    doc.setFillColor(5, 150, 105);
    doc.rect(0, 0, 210, 38, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("AbuPay", 20, 18);

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text("Data Purchase Receipt", 20, 29);

    /*
     * Success
     */
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Data Purchase Successful", 20, 52);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120, 120, 120);
    doc.text("Your data has been processed successfully.", 20, 60);

    /*
     * Amount
     */
    doc.setTextColor(120, 120, 120);
    doc.text("Amount Paid", 20, 75);

    doc.setTextColor(5, 150, 105);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text(
      `NGN ${tx.amount.toLocaleString()}`,
      20,
      87
    );

    /*
     * Status
     */
    doc.setFontSize(11);
    doc.setTextColor(5, 150, 105);
    doc.text("SUCCESS", 155, 87);

    /*
     * Main transaction details
     */
    let y = 105;

    const rows = [
      ["Before Balance", `NGN ${tx.balanceBefore.toLocaleString()}`],
      ["Amount Paid", `NGN ${tx.amount.toLocaleString()}`],
      ["After Balance", `NGN ${tx.balanceAfter.toLocaleString()}`],
      ["Plan", tx.planName],
      ["Network", tx.network.toUpperCase()],
      ["Phone Number", tx.phone],
      ["Reference", tx.reference],
      ["Date", tx.date],
      ["Status", tx.status],
    ];

    rows.forEach(([label, value]) => {
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");

      doc.setTextColor(120, 120, 120);
      doc.text(label, 20, y);

      doc.setTextColor(30, 30, 30);
      doc.setFont("helvetica", "bold");

      doc.text(String(value), 75, y);

      y += 10;
    });

    /*
     * Footer
     */
    doc.setDrawColor(220, 220, 220);
    doc.line(20, y + 5, 190, y + 5);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120, 120, 120);

    doc.text(
      "Powered by Abu Niematullah Ventures",
      20,
      y + 17
    );

    doc.text(
      "Fast • Secure • Reliable",
      20,
      y + 25
    );

    doc.save(
      `AbuPay-Data-${tx.reference}.pdf`
    );
  };

  /*
   * SHARE RECEIPT
   */
  const shareReceipt = async (tx: ReceiptData) => {
    const text = `AbuPay

DATA PURCHASE SUCCESSFUL

Amount Paid: ₦${tx.amount.toLocaleString()}

Before Balance: ₦${tx.balanceBefore.toLocaleString()}
Paid: ₦${tx.amount.toLocaleString()}
After Balance: ₦${tx.balanceAfter.toLocaleString()}

Plan: ${tx.planName}
Network: ${tx.network.toUpperCase()}
Phone Number: ${tx.phone}

Reference: ${tx.reference}
Date: ${tx.date}
Status: ${tx.status}

Powered by Abu Niematullah Ventures
Fast • Secure • Reliable`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "AbuPay Data Receipt",
          text,
        });

        return;
      } catch {
        // Continue to WhatsApp fallback.
      }
    }

    window.open(
      "https://wa.me/?text=" +
        encodeURIComponent(text),
      "_blank"
    );
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-2xl space-y-6">

        {/* PAGE HEADER */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Buy Data
          </h1>

          <p className="mt-1 text-gray-500">
            Choose network and data plan
          </p>
        </div>

        {/* PURCHASE CARD */}
        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">

          {/* PROVIDER DROPDOWN */}
          <div className="border-b p-5">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Select Package
            </label>

            <div className="relative">
              <select
                value={provider}
                onChange={(e) =>
                  setProvider(
                    e.target.value as ProviderId
                  )
                }
                className="w-full appearance-none rounded-xl border bg-white px-4 py-3.5 pr-10 text-sm font-medium text-gray-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              >
                {PROVIDERS.map((item) => (
                  <option
                    key={item.id}
                    value={item.id}
                  >
                    {item.label}
                    {item.description
                      ? ` — ${item.description}`
                      : ""}
                  </option>
                ))}
              </select>

              <ChevronDown
                size={18}
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
              />
            </div>

            <p className="mt-2 text-xs text-gray-400">
              Choose your preferred package source.
            </p>
          </div>

          {/* NETWORK */}
          <div className="border-b p-5">
            <p className="mb-3 text-sm font-medium text-gray-700">
              Select Network
            </p>

            <div className="space-y-2">
              {networks.map((net) => (
                <button
                  key={net.id}
                  type="button"
                  onClick={() =>
                    setNetwork(net.id)
                  }
                  className={
                    network === net.id
                      ? "flex w-full items-center justify-between rounded-xl border border-emerald-600 bg-emerald-50 px-4 py-3.5 text-left ring-1 ring-emerald-200 transition"
                      : "flex w-full items-center justify-between rounded-xl border px-4 py-3.5 text-left transition hover:bg-gray-50"
                  }
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={
                        "flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold " +
                        net.color +
                        " " +
                        net.text
                      }
                    >
                      {net.name
                        .slice(0, 3)
                        .toUpperCase()}
                    </div>

                    <span className="font-medium text-gray-900">
                      {net.name}
                    </span>
                  </div>

                  {network === net.id && (
                    <div className="rounded-full bg-emerald-600 p-1 text-white">
                      <Check size={14} />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* PHONE + PLAN */}
          <div className="space-y-5 p-5">

            {/* PHONE */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Phone Number
              </label>

              <input
                type="tel"
                value={phone}
                onChange={(e) =>
                  setPhone(e.target.value)
                }
                placeholder="08012345678"
                maxLength={11}
                className="w-full rounded-xl border px-4 py-3.5 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            {/* DATA PLAN */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Select Data Plan
              </label>

              {loadingPlans ? (
                <div className="flex items-center justify-center rounded-xl border py-10">
                  <Loader2
                    className="animate-spin text-emerald-600"
                    size={28}
                  />
                </div>
              ) : plans.length === 0 ? (
                <div className="rounded-xl border border-dashed py-8 text-center text-gray-400">
                  No plans available for this network
                </div>
              ) : (
                <div className="relative">
                  <select
                    value={
                      selectedPlan?.variation_code || ""
                    }
                    onChange={(e) => {
                      const plan =
                        plans.find(
                          (item) =>
                            item.variation_code ===
                            e.target.value
                        ) || null;

                      setSelectedPlan(plan);
                    }}
                    className="w-full appearance-none rounded-xl border bg-white px-4 py-3.5 pr-10 text-sm font-medium text-gray-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  >
                    <option value="">
                      Select a data plan
                    </option>

                    {plans.map((plan, index) => (
                      <option
                        key={
                          plan.variation_code +
                          "-" +
                          plan.amount +
                          "-" +
                          index
                        }
                        value={
                          plan.variation_code
                        }
                      >
                        {plan.name} — ₦
                        {plan.amount.toLocaleString()}
                      </option>
                    ))}
                  </select>

                  <ChevronDown
                    size={18}
                    className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                </div>
              )}
            </div>

            {/* SELECTED PLAN SUMMARY */}
            {selectedPlan && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">
                      Selected Plan
                    </p>

                    <p className="mt-1 font-semibold text-gray-900">
                      {selectedPlan.name}
                    </p>
                  </div>

                  <p className="text-lg font-bold text-emerald-700">
                    ₦
                    {selectedPlan.amount.toLocaleString()}
                  </p>
                </div>
              </div>
            )}

            {/* PURCHASE BUTTON */}
            <button
              type="button"
              onClick={handlePurchase}
              disabled={
                loadingPurchase ||
                !selectedPlan
              }
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loadingPurchase ? (
                <>
                  <Loader2
                    className="animate-spin"
                    size={18}
                  />
                  Processing...
                </>
              ) : (
                <>
                  <Wifi size={18} />
                  Buy Data
                </>
              )}
            </button>

            {/* MESSAGE */}
            {message && (
              <div
                className={
                  message.type === "success"
                    ? "rounded-xl bg-emerald-50 px-4 py-3 text-center text-sm font-medium text-emerald-700"
                    : "rounded-xl bg-red-50 px-4 py-3 text-center text-sm font-medium text-red-600"
                }
              >
                {message.text}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RECEIPT MODAL */}
      {receipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">

          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl">

            {/* RECEIPT HEADER */}
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Data Receipt
              </h3>

              <button
                type="button"
                onClick={() =>
                  setReceipt(null)
                }
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-5 px-5 py-6">

              {/* LOGO */}
              <div className="flex justify-center">
                <img
                  src="/images/abupay-logo.png"
                  alt="AbuPay"
                  className="h-12 w-auto object-contain"
                />
              </div>

              {/* SUCCESS */}
              <div className="text-center">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <CheckCircle size={28} />
                </div>

                <h2 className="text-xl font-bold text-gray-900">
                  Data Purchase Successful
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Your data has been processed
                </p>
              </div>

              {/* AMOUNT */}
              <div className="text-center">
                <p className="text-sm text-gray-500">
                  Amount Paid
                </p>

                <p className="mt-1 text-3xl font-bold text-gray-900">
                  ₦
                  {receipt.amount.toLocaleString()}
                </p>

                <span className="mt-2 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  SUCCESS
                </span>
              </div>

              {/* NETWORK + PHONE */}
              <div className="rounded-xl bg-gray-50 p-4 text-center">
                <p className="font-semibold text-gray-900">
                  {receipt.network.toUpperCase()} •{" "}
                  {receipt.phone}
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  {receipt.planName}
                </p>
              </div>

              {/* BALANCE MOVEMENT */}
              <div className="grid grid-cols-3 gap-2">

                <div className="rounded-xl bg-gray-50 p-3 text-center">
                  <p className="text-xs text-gray-500">
                    Before
                  </p>

                  <p className="mt-1 text-sm font-bold text-gray-900">
                    ₦
                    {receipt.balanceBefore.toLocaleString()}
                  </p>
                </div>

                <div className="rounded-xl bg-emerald-50 p-3 text-center">
                  <p className="text-xs text-emerald-600">
                    Paid
                  </p>

                  <p className="mt-1 text-sm font-bold text-emerald-700">
                    ₦
                    {receipt.amount.toLocaleString()}
                  </p>
                </div>

                <div className="rounded-xl bg-gray-50 p-3 text-center">
                  <p className="text-xs text-gray-500">
                    After
                  </p>

                  <p className="mt-1 text-sm font-bold text-gray-900">
                    ₦
                    {receipt.balanceAfter.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* DETAILS */}
              <div className="space-y-3 rounded-xl bg-gray-50 p-4 text-sm">

                <div className="flex justify-between gap-3">
                  <span className="text-gray-500">
                    Description
                  </span>

                  <span className="text-right font-medium">
                    {receipt.network.toUpperCase()} Data Purchase
                  </span>
                </div>

                <div className="flex justify-between gap-3">
                  <span className="text-gray-500">
                    Plan
                  </span>

                  <span className="max-w-[200px] text-right font-medium">
                    {receipt.planName}
                  </span>
                </div>

                <div className="flex justify-between gap-3">
                  <span className="text-gray-500">
                    Network
                  </span>

                  <span className="font-medium uppercase">
                    {receipt.network}
                  </span>
                </div>

                <div className="flex justify-between gap-3">
                  <span className="text-gray-500">
                    Phone Number
                  </span>

                  <span className="font-medium">
                    {receipt.phone}
                  </span>
                </div>

                <div className="flex justify-between gap-3">
                  <span className="text-gray-500">
                    Reference
                  </span>

                  <span className="max-w-[180px] truncate text-right font-medium">
                    {receipt.reference}
                  </span>
                </div>

                <div className="flex justify-between gap-3">
                  <span className="text-gray-500">
                    Date
                  </span>

                  <span className="text-right font-medium">
                    {receipt.date}
                  </span>
                </div>

                <div className="flex justify-between gap-3">
                  <span className="text-gray-500">
                    Status
                  </span>

                  <span className="font-semibold text-emerald-600">
                    {receipt.status}
                  </span>
                </div>
              </div>

              {/* FOOTER */}
              <div className="text-center">
                <p className="text-xs text-gray-400">
                  Powered by Abu Niematullah Ventures
                </p>

                <p className="mt-1 text-xs text-gray-400">
                  Fast • Secure • Reliable
                </p>
              </div>
            </div>

            {/* ACTIONS */}
            <div className="grid grid-cols-2 gap-3 border-t px-5 py-4">

              <button
                type="button"
                onClick={() =>
                  downloadPdf(receipt)
                }
                className="flex items-center justify-center gap-2 rounded-xl border py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                <Download size={16} />
                PDF
              </button>

              <button
                type="button"
                onClick={() =>
                  shareReceipt(receipt)
                }
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