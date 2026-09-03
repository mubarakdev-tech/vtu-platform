"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import {
  Wallet,
  Eye,
  EyeOff,
  Plus,
  Loader2,
  Download,
  Share2,
  X,
  CheckCircle,
} from "lucide-react";

import {
  calculateFundingFee,
  initializeFunding,
  verifyFunding,
} from "@/services/wallet.service";

import CountUp from "react-countup";
import useAuth from "@/hooks/useAuth";
import useWallet from "@/hooks/useWallet";
import jsPDF from "jspdf";

const quickAmounts = [500, 1000, 2000, 5000, 10000, 20000];

declare global {
  interface Window {
    PaystackPop: any;
  }
}

interface ReceiptData {
  reference: string;
  date: string;
  customerName: string;
  amount: number;
  previousBalance: number;
  newBalance: number;
  status: string;
}

export default function WalletPage() {
  const { user } = useAuth();
  const { balance, loading, refreshWallet } = useWallet();

  const [showBalance, setShowBalance] = useState(true);
  const [amount, setAmount] = useState("");
  const [fundingFee, setFundingFee] = useState(0);
  const [fundingTotal, setFundingTotal] = useState(0);
  const [calculatingFee, setCalculatingFee] = useState(false);
  const [funding, setFunding] = useState(false);
  const [savingPdf, setSavingPdf] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);

  const PAYSTACK_PUBLIC_KEY =
    process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "";

  const customerName =
    (user as any)?.name ||
    (user as any)?.fullName ||
    (user as any)?.username ||
    (user as any)?.email ||
    "AbuPay Customer";

  // ==========================================
  // CALCULATE FUNDING FEE
  // ==========================================
  const updateFundingFee = async (rawAmount: string | number) => {
    const value = Number(rawAmount);

    if (rawAmount === "" || !Number.isFinite(value) || value <= 0) {
      setFundingFee(0);
      setFundingTotal(0);
      return;
    }

    if (value < 100 || !Number.isInteger(value)) {
      setFundingFee(0);
      setFundingTotal(0);
      return;
    }

    try {
      setCalculatingFee(true);
      const result = await calculateFundingFee(value);

      const fee = Number(result?.data?.estimatedFee ?? 0);
      const total = Number(result?.data?.estimatedTotal ?? value + fee);

      setFundingFee(Number.isFinite(fee) ? fee : 0);
      setFundingTotal(Number.isFinite(total) ? total : value);
    } catch (error) {
      console.error("Failed to calculate funding fee:", error);
      setFundingFee(0);
      setFundingTotal(0);
    } finally {
      setCalculatingFee(false);
    }
  };

  // ==========================================
  // LOAD PAYSTACK SCRIPT ONLY
  // ==========================================
  useEffect(() => {
    if (!document.getElementById("paystack-script")) {
      const script = document.createElement("script");
      script.id = "paystack-script";
      script.src = "https://js.paystack.co/v1/inline.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  const handleAmountChange = (value: string) => {
    setAmount(value);
    updateFundingFee(value);
  };

  // ==========================================
  // FUND WALLET
  // ==========================================
  const handleFund = async () => {
    const value = Number(amount);

    if (!Number.isFinite(value) || value < 100) {
      setMessage({ type: "error", text: "Minimum funding amount is ₦100" });
      return;
    }

    if (!Number.isInteger(value)) {
      setMessage({ type: "error", text: "Please enter a whole number amount." });
      return;
    }

    const previousBalance = Number(balance);

    try {
      setFunding(true);
      setMessage(null);

      const result = await initializeFunding(value);

      if (!result?.success || !result?.data?.reference) {
        setMessage({
          type: "error",
          text: result?.message || "Unable to start payment",
        });
        setFunding(false);
        return;
      }

      const reference = result.data.reference;
      const email = result.data.email || (user as any)?.email || "";
      const initializedAmount = Number(result.data.amount);
      const initializedAmountInKobo = Number(result.data.amountInKobo);

      if (!Number.isFinite(initializedAmount) || initializedAmount <= 0) {
        setMessage({ type: "error", text: "Invalid amount returned by payment server." });
        setFunding(false);
        return;
      }

      if (!Number.isInteger(initializedAmountInKobo) || initializedAmountInKobo <= 0) {
        setMessage({ type: "error", text: "Invalid Paystack amount returned by payment server." });
        setFunding(false);
        return;
      }

      if (!window.PaystackPop) {
        setMessage({
          type: "error",
          text: "Paystack is still loading. Please try again in 2 seconds.",
        });
        setFunding(false);
        return;
      }

      if (!PAYSTACK_PUBLIC_KEY) {
        setMessage({ type: "error", text: "Paystack public key is not configured." });
        setFunding(false);
        return;
      }

      const handler = window.PaystackPop.setup({
        key: PAYSTACK_PUBLIC_KEY,
        email,
        amount: initializedAmountInKobo,
        ref: reference,
        currency: "NGN",

        callback: function (response: any) {
          (async () => {
            try {
              const callbackReference = response?.reference || reference;
              const verifyResult = await verifyFunding(callbackReference);

              if (!verifyResult?.success) {
                setMessage({
                  type: "error",
                  text: verifyResult?.message || "Payment verification failed",
                });
                return;
              }

              const transaction = verifyResult?.data?.transaction;
              const transactionAmount = Number(
                transaction?.amount ??
                  verifyResult?.data?.amount ??
                  initializedAmount
              );

              const previousWalletBalance = Number(
                transaction?.balanceBefore ?? previousBalance
              );

              const verifiedBalance = Number(
                verifyResult?.data?.walletBalance ??
                  verifyResult?.data?.balance ??
                  previousWalletBalance + transactionAmount
              );

              const transactionReference =
                transaction?.reference ||
                verifyResult?.data?.transactionReference ||
                callbackReference ||
                reference;

              const transactionDate = transaction?.createdAt
                ? new Date(transaction.createdAt).toLocaleString()
                : new Date().toLocaleString();

              setReceipt({
                reference: transactionReference,
                date: transactionDate,
                customerName,
                amount: transactionAmount,
                previousBalance: previousWalletBalance,
                newBalance: verifiedBalance,
                status: transaction?.status || "SUCCESS",
              });

              // Update Header balance immediately
              await refreshWallet();

              setAmount("");
              setFundingFee(0);
              setFundingTotal(0);

              setMessage({
                type: "success",
                text: `Wallet funded successfully with ₦${transactionAmount.toLocaleString()}`,
              });
            } catch (error: any) {
              console.error("Wallet verification error:", error);
              setMessage({
                type: "error",
                text:
                  error?.response?.data?.message ||
                  error?.message ||
                  "Payment verification failed",
              });
            } finally {
              setFunding(false);
            }
          })();
        },

        onClose: function () {
          setFunding(false);
          setMessage({ type: "error", text: "Payment cancelled" });
        },
      });

      handler.openIframe();
    } catch (error: any) {
      console.error("Fund Wallet Error:", error);
      setMessage({
        type: "error",
        text:
          error?.response?.data?.message ||
          error?.message ||
          "Something went wrong. Please try again.",
      });
      setFunding(false);
    }
  };

  // ==========================================
  // SAVE RECEIPT AS PDF
  // ==========================================
  const saveReceipt = async () => {
    if (!receipt) return;

    try {
      setSavingPdf(true);

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const leftMargin = 25;
      const rightMargin = 25;
      const contentWidth = pageWidth - leftMargin - rightMargin;
      let y = 20;

      const logo = new Image();
      logo.src = "/images/abupay-logo.png";

      await new Promise<void>((resolve) => {
        logo.onload = () => resolve();
        logo.onerror = () => resolve();
      });

      if (logo.complete && logo.naturalWidth > 0) {
        const logoWidth = 38;
        const logoHeight = (logo.naturalHeight / logo.naturalWidth) * logoWidth;
        pdf.addImage(logo, "PNG", (pageWidth - logoWidth) / 2, y, logoWidth, logoHeight);
        y += logoHeight + 8;
      } else {
        y += 5;
      }

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(23);
      pdf.setTextColor(20, 20, 20);
      pdf.text("AbuPay", pageWidth / 2, y, { align: "center" });
      y += 8;

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text("TRANSACTION RECEIPT", pageWidth / 2, y, { align: "center" });
      y += 12;

      pdf.setFillColor(236, 253, 245);
      pdf.roundedRect(leftMargin, y, contentWidth, 14, 3, 3, "F");
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      pdf.setTextColor(5, 150, 105);
      pdf.text("TRANSACTION SUCCESSFUL", pageWidth / 2, y + 9, { align: "center" });
      y += 24;

      const addRow = (label: string, value: string, bold = false) => {
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(10);
        pdf.setTextColor(110, 110, 110);
        pdf.text(label, leftMargin, y);

        pdf.setFont("helvetica", bold ? "bold" : "normal");
        pdf.setTextColor(30, 30, 30);
        pdf.text(value, pageWidth - rightMargin, y, { align: "right" });
        y += 10;
      };

      addRow("Receipt Number", receipt.reference);
      addRow("Date & Time", receipt.date);
      addRow("Customer", receipt.customerName);
      addRow("Service", "Wallet Funding");
      addRow("Payment Reference", receipt.reference);

      y += 4;
      pdf.setDrawColor(190, 190, 190);
      pdf.setLineDashPattern([2, 2], 0);
      pdf.line(leftMargin, y, pageWidth - rightMargin, y);
      pdf.setLineDashPattern([], 0);
      y += 13;

      addRow("Previous Wallet Balance", `₦${receipt.previousBalance.toLocaleString()}`);
      addRow("Amount Funded", `₦${receipt.amount.toLocaleString()}`, true);
      addRow("New Wallet Balance", `₦${receipt.newBalance.toLocaleString()}`, true);
      addRow("Status", receipt.status === "SUCCESS" ? "SUCCESSFUL" : receipt.status);

      y += 10;
      pdf.setDrawColor(230, 230, 230);
      pdf.line(leftMargin, y, pageWidth - rightMargin, y);
      y += 16;

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(11);
      pdf.setTextColor(40, 40, 40);
      pdf.text("Thank you for using AbuPay", pageWidth / 2, y, { align: "center" });
      y += 8;

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.text("Powered by Abu Niematullah Ventures", pageWidth / 2, y, {
        align: "center",
      });

      pdf.save(`AbuPay-Receipt-${receipt.reference}.pdf`);
    } catch (error) {
      console.error("PDF generation failed:", error);
      setMessage({ type: "error", text: "Unable to save receipt. Please try again." });
    } finally {
      setSavingPdf(false);
    }
  };

  const shareReceipt = async () => {
    if (!receipt) return;

    const shareText = `
AbuPay Transaction Receipt

Receipt Number: ${receipt.reference}
Date & Time: ${receipt.date}
Customer: ${receipt.customerName}
Service: Wallet Funding
Amount Funded: ₦${receipt.amount.toLocaleString()}
Previous Balance: ₦${receipt.previousBalance.toLocaleString()}
New Balance: ₦${receipt.newBalance.toLocaleString()}
Status: ${receipt.status === "SUCCESS" ? "SUCCESSFUL" : receipt.status}

Thank you for using AbuPay.
Powered by Abu Niematullah Ventures
    `.trim();

    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({
          title: "AbuPay Transaction Receipt",
          text: shareText,
        });
        return;
      }

      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareText);
        setMessage({
          type: "success",
          text: "Receipt copied. You can paste it into WhatsApp or another app.",
        });
        return;
      }

      setMessage({ type: "error", text: "Sharing is not supported on this browser." });
    } catch (error) {
      console.log("Share cancelled:", error);
    }
  };

  const closeReceipt = () => {
    setReceipt(null);
    setMessage(null);
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Wallet</h1>
          <p className="mt-1 text-gray-500">
            Fund your wallet securely with Paystack
          </p>
        </div>

        {/* BALANCE CARD */}
        <div className="overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600 p-8 text-white shadow-xl">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 text-emerald-100">
                <Wallet size={20} />
                <span className="text-sm font-medium">Available Balance</span>
              </div>

              <div className="mt-4 flex items-center gap-3">
                <h2 className="text-5xl font-bold tracking-tight">
                  {loading ? (
                    "••••••"
                  ) : showBalance ? (
                    <>
                      ₦
                      <CountUp
                        end={balance}
                        duration={1.2}
                        separator=","
                        decimals={2}
                      />
                    </>
                  ) : (
                    "₦ ••••••"
                  )}
                </h2>

                <button
                  type="button"
                  onClick={() => setShowBalance(!showBalance)}
                  className="rounded-full bg-white/15 p-2 transition hover:bg-white/25"
                >
                  {showBalance ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <Wallet size={80} className="hidden opacity-20 md:block" />
          </div>
        </div>

        {/* FUND WALLET */}
        <div className="rounded-2xl border bg-white p-6 shadow-sm md:p-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-xl bg-emerald-100 p-2.5">
              <Plus className="text-emerald-600" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Fund Wallet</h2>
              <p className="text-sm text-gray-500">
                Pay securely with card, bank transfer or USSD
              </p>
            </div>
          </div>

          <div className="mb-6 grid grid-cols-3 gap-3 sm:grid-cols-6">
            {quickAmounts.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setAmount(String(value));
                  updateFundingFee(value);
                }}
                className={`rounded-xl border py-3 text-sm font-medium transition ${
                  amount === String(value)
                    ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                    : "hover:border-emerald-300 hover:bg-emerald-50"
                }`}
              >
                ₦{value.toLocaleString()}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Enter Amount
              </label>
              <div className="relative">
                <span className="absolute top-1/2 left-4 -translate-y-1/2 font-medium text-gray-500">
                  ₦
                </span>
                <input
                  type="number"
                  min="100"
                  step="1"
                  value={amount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  placeholder="0"
                  className="w-full rounded-xl border py-3.5 pr-4 pl-9 text-lg outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>
              <p className="mt-2 text-xs text-gray-400">Minimum amount: ₦100</p>
            </div>

            {Number(amount) >= 100 && Number.isInteger(Number(amount)) && (
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Wallet funding</span>
                    <span className="font-medium text-gray-900">
                      ₦{Number(amount).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Payment processing fee</span>
                    <span className="font-medium text-gray-900">
                      {calculatingFee ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <>₦{fundingFee.toLocaleString()}</>
                      )}
                    </span>
                  </div>

                  <div className="border-t border-dashed border-gray-300" />

                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-800">
                      Total you will pay
                    </span>
                    <span className="text-lg font-bold text-emerald-700">
                      {calculatingFee ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <>₦{fundingTotal.toLocaleString()}</>
                      )}
                    </span>
                  </div>
                </div>

                <p className="mt-3 text-xs text-gray-400">
                  The payment processing fee is displayed before you proceed. Your
                  AbuPay wallet will be credited with the wallet funding amount.
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={handleFund}
              disabled={funding || !amount}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {funding ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Processing...
                </>
              ) : (
                "Fund Wallet"
              )}
            </button>

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

        {/* ====================== SMALLER RECEIPT MODAL ====================== */}
        {receipt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl">
              
              {/* Header */}
              <div className="border-b px-5 py-4 text-center">
                <img
                  src="/images/abupay-logo.png"
                  alt="AbuPay"
                  className="mx-auto mb-2 h-12 w-auto object-contain"
                />
                <h2 className="text-lg font-bold text-gray-900">AbuPay</h2>
                <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                  Transaction Receipt
                </p>
              </div>

              {/* Success Badge */}
              <div className="flex items-center justify-center gap-2 border-b bg-emerald-50 px-5 py-3">
                <CheckCircle size={18} className="text-emerald-600" />
                <span className="text-sm font-bold text-emerald-700">
                  TRANSACTION SUCCESSFUL
                </span>
              </div>

              {/* Details */}
              <div className="space-y-3 px-5 py-4 text-sm">
                <ReceiptRow label="Receipt Number" value={receipt.reference} />
                <ReceiptRow label="Date & Time" value={receipt.date} />
                <ReceiptRow label="Customer" value={receipt.customerName} />
                <ReceiptRow label="Service" value="Wallet Funding" />
                <ReceiptRow label="Payment Reference" value={receipt.reference} />

                <div className="my-3 border-t border-dashed" />

                <ReceiptRow
                  label="Previous Balance"
                  value={`₦${receipt.previousBalance.toLocaleString()}`}
                />
                <ReceiptRow
                  label="Amount Funded"
                  value={`₦${receipt.amount.toLocaleString()}`}
                  bold
                />
                <ReceiptRow
                  label="New Balance"
                  value={`₦${receipt.newBalance.toLocaleString()}`}
                  bold
                />
                <ReceiptRow
                  label="Status"
                  value={receipt.status === "SUCCESS" ? "SUCCESSFUL" : receipt.status}
                />
              </div>

              {/* Footer */}
              <div className="border-t px-5 py-3 text-center">
                <p className="text-sm font-medium text-gray-800">
                  Thank you for using AbuPay
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  Powered by Abu Niematullah Ventures
                </p>
              </div>

              {/* Buttons */}
              <div className="flex gap-2 rounded-b-2xl border-t bg-gray-50 p-4">
                <button
                  type="button"
                  onClick={saveReceipt}
                  disabled={savingPdf}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                >
                  {savingPdf ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Download size={16} />
                      Save PDF
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={shareReceipt}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
                >
                  <Share2 size={16} />
                  Share
                </button>

                <button
                  type="button"
                  onClick={closeReceipt}
                  className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-gray-600 transition hover:bg-gray-100"
                  aria-label="Close receipt"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

// ==========================================
// RECEIPT ROW COMPONENT
// ==========================================
function ReceiptRow({
  label,
  value,
  bold = false,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-gray-500">{label}</span>
      <span
        className={`max-w-[60%] break-words text-right text-gray-900 ${
          bold ? "font-bold" : "font-medium"
        }`}
      >
        {value}
      </span>
    </div>
  );
}