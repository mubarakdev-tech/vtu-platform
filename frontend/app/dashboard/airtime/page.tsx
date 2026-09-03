"use client";

import { useState } from "react";
import Image from "next/image";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import {
  Smartphone,
  Loader2,
  Check,
  X,
  Download,
  Share2,
  CheckCircle2,
  Phone,
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
} from "lucide-react";
import { buyAirtime } from "@/services/airtime";
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

const quickAmounts = [100, 200, 500, 1000, 2000, 5000];

interface ReceiptData {
  amount: number;
  phone: string;
  network: string;
  reference: string;
  date: string;
  status: string;
  description: string;
  balanceBefore: number;
  balanceAfter: number;
}

export default function AirtimePage() {
  const [provider, setProvider] =
    useState<ProviderId>("vtpass");

  const [network, setNetwork] = useState("mtn");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [receipt, setReceipt] =
    useState<ReceiptData | null>(null);

  const handlePurchase = async () => {
    if (!phone || phone.length < 11) {
      setMessage({
        type: "error",
        text: "Please enter a valid phone number",
      });
      return;
    }

    if (!amount || Number(amount) <= 0) {
      setMessage({
        type: "error",
        text: "Please enter a valid amount",
      });
      return;
    }

    try {
      setLoading(true);
      setMessage(null);

      const value = Number(amount);

      const result = await buyAirtime({
        network,
        phone,
        amount: value,
        provider,
      });

      if (result.success) {
        const ref =
          result.providerResponse?.request_id ||
          result.providerResponse?.data?.request_id ||
          result.transaction?._id ||
          result.transaction?.id ||
          `AIR-${Date.now()}`;

        const balanceBefore = Number(
          result.balanceBefore ??
            result.transaction?.metadata?.balanceBefore ??
            0
        );

        const balanceAfter = Number(
          result.balanceAfter ??
            result.transaction?.metadata?.balanceAfter ??
            balanceBefore - value
        );

        setReceipt({
          amount: value,
          phone,
          network,
          reference: String(ref),
          date: new Date().toLocaleString("en-NG"),
          status: "SUCCESS",
          description: `${network.toUpperCase()} Airtime Purchase`,
          balanceBefore,
          balanceAfter,
        });

        setMessage({
          type: "success",
          text: `Airtime of ₦${value.toLocaleString()} sent to ${phone}`,
        });

        setPhone("");
        setAmount("");
      } else {
        setMessage({
          type: "error",
          text:
            result.message ||
            "Purchase failed. Please try again.",
        });
      }
    } catch (error: any) {
      setMessage({
        type: "error",
        text:
          error?.response?.data?.message ||
          "Something went wrong. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatMoney = (value: number) =>
    `₦${Number(value || 0).toLocaleString("en-NG")}`;

  const downloadPdf = async (tx: ReceiptData) => {
    const doc = new jsPDF();

    const logoUrl =
      `${window.location.origin}/images/abupay-logo.png`;

    try {
      const imageResponse = await fetch(logoUrl);
      const imageBlob = await imageResponse.blob();

      const reader = new FileReader();

      reader.onloadend = () => {
        const logoData = reader.result as string;

        createPdf(doc, tx, logoData);
      };

      reader.readAsDataURL(imageBlob);
    } catch {
      createPdf(doc, tx);
    }
  };

  const createPdf = (
    doc: jsPDF,
    tx: ReceiptData,
    logoData?: string
  ) => {
    /**
     * HEADER
     */
    doc.setFillColor(16, 185, 129);
    doc.rect(0, 0, 210, 42, "F");

    if (logoData) {
      try {
        doc.addImage(
          logoData,
          "PNG",
          18,
          7,
          28,
          28
        );
      } catch {
        // Continue without logo if image conversion fails
      }
    }

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("AbuPay", 52, 19);

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text("Airtime Purchase Receipt", 52, 29);

    /**
     * SUCCESS
     */
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(
      "Airtime Purchase Successful",
      20,
      60
    );

    /**
     * AMOUNT
     */
    doc.setFontSize(11);
    doc.setTextColor(110, 110, 110);
    doc.text("Amount Paid", 20, 73);

    doc.setFontSize(25);
    doc.setTextColor(16, 185, 129);
    doc.setFont("helvetica", "bold");
    doc.text(
      formatMoney(tx.amount),
      20,
      85
    );

    /**
     * STATUS
     */
    doc.setFontSize(10);
    doc.setTextColor(16, 120, 90);
    doc.text("SUCCESS", 165, 85);

    /**
     * BALANCE SUMMARY
     */
    doc.setFillColor(245, 250, 248);
    doc.roundedRect(
      20,
      96,
      170,
      38,
      4,
      4,
      "F"
    );

    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(
      "BALANCE BEFORE",
      30,
      108
    );

    doc.text(
      "AMOUNT PAID",
      88,
      108
    );

    doc.text(
      "BALANCE AFTER",
      145,
      108
    );

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 30, 30);

    doc.text(
      formatMoney(tx.balanceBefore),
      30,
      121
    );

    doc.text(
      formatMoney(tx.amount),
      88,
      121
    );

    doc.text(
      formatMoney(tx.balanceAfter),
      145,
      121
    );

    /**
     * TRANSACTION DETAILS
     */
    const rows = [
      ["Description", tx.description],
      ["Network", tx.network.toUpperCase()],
      ["Phone Number", tx.phone],
      ["Reference", tx.reference],
      ["Date", tx.date],
      ["Status", tx.status],
    ];

    let y = 150;

    doc.setFontSize(10);

    rows.forEach(([label, value]) => {
      doc.setTextColor(120, 120, 120);
      doc.setFont("helvetica", "normal");
      doc.text(label, 20, y);

      doc.setTextColor(35, 35, 35);
      doc.setFont("helvetica", "bold");
      doc.text(String(value), 70, y);

      y += 10;
    });

    /**
     * FOOTER
     */
    doc.setDrawColor(225, 225, 225);
    doc.line(20, 220, 190, 220);

    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.setFont("helvetica", "normal");

    doc.text(
      "Thank you for using AbuPay.",
      20,
      232
    );

    doc.text(
      "Powered by Abu Niematullah Ventures",
      20,
      241
    );

    doc.text(
      "Fast • Secure • Reliable",
      20,
      250
    );

    doc.save(
      `AbuPay-Airtime-${tx.reference}.pdf`
    );
  };

  const shareReceipt = async (tx: ReceiptData) => {
    const text = `AbuPay Airtime Receipt

Airtime Purchase Successful

Amount Paid: ${formatMoney(tx.amount)}

Network: ${tx.network.toUpperCase()}
Phone Number: ${tx.phone}

Balance Before: ${formatMoney(
      tx.balanceBefore
    )}
Amount Paid: ${formatMoney(tx.amount)}
Balance After: ${formatMoney(
      tx.balanceAfter
    )}

Reference: ${tx.reference}
Date: ${tx.date}
Status: ${tx.status}

Powered by Abu Niematullah Ventures`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "AbuPay Airtime Receipt",
          text,
        });

        return;
      } catch {
        // fallback
      }
    }

    window.open(
      `https://wa.me/?text=${encodeURIComponent(
        text
      )}`,
      "_blank"
    );
  };

  return (
    <DashboardLayout>
      <div className="mx-auto w-full max-w-5xl space-y-6">
        {/* PAGE HEADER */}
        <div className="rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white shadow-sm sm:p-8">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15">
              <Smartphone size={28} />
            </div>

            <div>
              <h1 className="text-2xl font-bold sm:text-3xl">
                Buy Airtime
              </h1>

              <p className="mt-1 text-sm text-emerald-50 sm:text-base">
                Recharge any Nigerian network instantly.
              </p>
            </div>
          </div>
        </div>

        {/* MAIN CARD */}
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          {/* FORM */}
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            {/* PROVIDER */}
            <div className="border-b p-5 sm:p-6">
              <p className="mb-3 text-sm font-semibold text-gray-800">
                Select Package
              </p>

              <div className="grid grid-cols-2 gap-3">
                {PROVIDERS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() =>
                      setProvider(item.id)
                    }
                    className={`rounded-xl border p-3 text-left transition ${
                      provider === item.id
                        ? "border-emerald-500 bg-emerald-50 ring-1 ring-emerald-200"
                        : "border-gray-200 hover:border-emerald-300 hover:bg-gray-50"
                    }`}
                  >
                    <div className="text-sm font-semibold text-gray-900">
                      {item.label}
                    </div>

                    {item.description && (
                      <div className="mt-1 text-xs text-gray-500">
                        {item.description}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* NETWORK */}
            <div className="border-b p-5 sm:p-6">
              <p className="mb-3 text-sm font-semibold text-gray-800">
                Select Network
              </p>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {networks.map((net) => (
                  <button
                    key={net.id}
                    type="button"
                    onClick={() =>
                      setNetwork(net.id)
                    }
                    className={`relative rounded-xl border p-3 transition ${
                      network === net.id
                        ? "border-emerald-500 bg-emerald-50 ring-1 ring-emerald-200"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold ${net.color} ${net.text}`}
                      >
                        {net.name
                          .slice(0, 3)
                          .toUpperCase()}
                      </div>

                      <span className="text-sm font-semibold text-gray-900">
                        {net.name}
                      </span>
                    </div>

                    {network === net.id && (
                      <div className="absolute right-2 top-2 rounded-full bg-emerald-600 p-1 text-white">
                        <Check size={12} />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* PHONE + AMOUNT */}
            <div className="space-y-6 p-5 sm:p-6">
              {/* PHONE */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Phone Number
                </label>

                <div className="relative">
                  <Phone
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    type="tel"
                    inputMode="numeric"
                    value={phone}
                    onChange={(e) =>
                      setPhone(
                        e.target.value.replace(
                          /\D/g,
                          ""
                        )
                      )
                    }
                    placeholder="08012345678"
                    maxLength={11}
                    className="w-full rounded-xl border border-gray-200 py-3.5 pl-11 pr-4 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>
              </div>

              {/* QUICK AMOUNT */}
              <div>
                <label className="mb-3 block text-sm font-semibold text-gray-700">
                  Quick Amount
                </label>

                <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                  {quickAmounts.map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() =>
                        setAmount(String(value))
                      }
                      className={`rounded-xl border py-3 text-sm font-semibold transition ${
                        amount === String(value)
                          ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                          : "border-gray-200 hover:border-emerald-300 hover:bg-emerald-50"
                      }`}
                    >
                      ₦
                      {value.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              {/* CUSTOM AMOUNT */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Enter Amount
                </label>

                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-medium text-gray-500">
                    ₦
                  </span>

                  <input
                    type="number"
                    inputMode="numeric"
                    min="1"
                    value={amount}
                    onChange={(e) =>
                      setAmount(e.target.value)
                    }
                    placeholder="Enter amount"
                    className="w-full rounded-xl border border-gray-200 py-3.5 pl-9 pr-4 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>
              </div>

              {/* PURCHASE BUTTON */}
              <button
                type="button"
                onClick={handlePurchase}
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-4 font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2
                      className="animate-spin"
                      size={19}
                    />
                    Processing purchase...
                  </>
                ) : (
                  <>
                    <Smartphone size={19} />
                    Buy Airtime
                  </>
                )}
              </button>

              {/* MESSAGE */}
              {message && (
                <div
                  className={`rounded-xl px-4 py-3 text-center text-sm font-medium ${
                    message.type === "success"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-red-50 text-red-600"
                  }`}
                >
                  {message.text}
                </div>
              )}
            </div>
          </div>

          {/* SIDE INFORMATION */}
          <div className="hidden space-y-4 lg:block">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <Wallet size={21} />
              </div>

              <h3 className="font-semibold text-gray-900">
                Instant Airtime
              </h3>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                Buy airtime securely and receive your
                recharge instantly.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900">
                Available Networks
              </h3>

              <div className="mt-4 space-y-3">
                {networks.map((net) => (
                  <div
                    key={net.id}
                    className="flex items-center gap-3"
                  >
                    <div
                      className={`h-3 w-3 rounded-full ${net.color}`}
                    />

                    <span className="text-sm text-gray-600">
                      {net.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RECEIPT MODAL */}
      {receipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-3 sm:p-4">
          <div className="my-auto w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl">
            {/* RECEIPT HEADER */}
            <div className="relative bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-4 text-white">
              <button
                type="button"
                onClick={() => setReceipt(null)}
                className="absolute right-3 top-3 rounded-full bg-white/10 p-1.5 hover:bg-white/20"
              >
                <X size={16} />
              </button>

              <div className="flex justify-center">
                <Image
                  src="/images/abupay-logo.png"
                  alt="AbuPay"
                  width={56}
                  height={56}
                  className="rounded-xl bg-white p-1 shadow-lg"
                />
              </div>

              <div className="mt-2.5 text-center">
                <h2 className="text-lg font-bold">
                  Airtime Purchase Successful
                </h2>

                <p className="mt-0.5 text-xs text-emerald-50">
                  Your airtime has been processed
                </p>
              </div>
            </div>

            {/* RECEIPT BODY */}
            <div className="space-y-3.5 px-4 py-4">
              {/* AMOUNT */}
              <div className="text-center">
                <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400">
                  Amount Paid
                </p>

                <p className="mt-0.5 text-3xl font-extrabold tracking-tight text-gray-900">
                  {formatMoney(receipt.amount)}
                </p>

                <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                  <CheckCircle2 size={12} />
                  SUCCESS
                </span>
              </div>

              {/* NETWORK / PHONE */}
              <div className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5 text-center">
                <p className="text-sm font-bold text-gray-900">
                  {receipt.network.toUpperCase()}{" "}
                  <span className="text-gray-300">
                    •
                  </span>{" "}
                  {receipt.phone}
                </p>

                <p className="mt-0.5 text-[11px] text-gray-500">
                  Airtime recharge
                </p>
              </div>

              {/* BALANCE SUMMARY */}
              <div className="grid grid-cols-3 overflow-hidden rounded-xl border border-gray-100">
                <div className="p-2 text-center">
                  <div className="mx-auto mb-1 flex h-7 w-7 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                    <ArrowDownCircle size={14} />
                  </div>

                  <p className="text-[9px] font-medium uppercase text-gray-400">
                    Before
                  </p>

                  <p className="mt-0.5 text-xs font-bold text-gray-900">
                    {formatMoney(
                      receipt.balanceBefore
                    )}
                  </p>
                </div>

                <div className="border-x border-gray-100 bg-emerald-50/50 p-2 text-center">
                  <div className="mx-auto mb-1 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    <Smartphone size={14} />
                  </div>

                  <p className="text-[9px] font-medium uppercase text-gray-400">
                    Paid
                  </p>

                  <p className="mt-0.5 text-xs font-bold text-emerald-700">
                    {formatMoney(receipt.amount)}
                  </p>
                </div>

                <div className="p-2 text-center">
                  <div className="mx-auto mb-1 flex h-7 w-7 items-center justify-center rounded-full bg-purple-50 text-purple-600">
                    <ArrowUpCircle size={14} />
                  </div>

                  <p className="text-[9px] font-medium uppercase text-gray-400">
                    After
                  </p>

                  <p className="mt-0.5 text-xs font-bold text-gray-900">
                    {formatMoney(
                      receipt.balanceAfter
                    )}
                  </p>
                </div>
              </div>

              {/* DETAILS */}
              <div className="space-y-2 rounded-xl bg-gray-50 p-3 text-xs">
                <ReceiptRow
                  label="Description"
                  value={receipt.description}
                />

                <ReceiptRow
                  label="Network"
                  value={receipt.network.toUpperCase()}
                />

                <ReceiptRow
                  label="Phone Number"
                  value={receipt.phone}
                />

                <ReceiptRow
                  label="Reference"
                  value={receipt.reference}
                />

                <ReceiptRow
                  label="Date"
                  value={receipt.date}
                />

                <ReceiptRow
                  label="Status"
                  value="SUCCESS"
                  success
                />
              </div>

              {/* FOOTER */}
              <div className="text-center">
                <p className="text-[11px] text-gray-400">
                  Powered by Abu Niematullah Ventures
                </p>

                <p className="mt-0.5 text-[10px] text-gray-300">
                  Fast • Secure • Reliable
                </p>
              </div>
            </div>

            {/* ACTIONS */}
            <div className="grid grid-cols-2 gap-2.5 border-t border-gray-100 px-4 py-3">
              <button
                type="button"
                onClick={() =>
                  downloadPdf(receipt)
                }
                className="flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 py-2.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                <Download size={15} />
                PDF
              </button>

              <button
                type="button"
                onClick={() =>
                  shareReceipt(receipt)
                }
                className="flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 py-2.5 text-xs font-semibold text-white transition hover:bg-emerald-700"
              >
                <Share2 size={15} />
                Share
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

function ReceiptRow({
  label,
  value,
  success = false,
}: {
  label: string;
  value: string;
  success?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="shrink-0 text-gray-500">
        {label}
      </span>

      <span
        className={`max-w-[65%] text-right font-semibold ${
          success
            ? "text-emerald-600"
            : "break-words text-gray-900"
        }`}
      >
        {value}
      </span>
    </div>
  );
}