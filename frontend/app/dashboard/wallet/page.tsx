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
  getWallet,
  initializeFunding,
  verifyFunding,
} from "@/services/wallet.service";
import CountUp from "react-countup";
import useAuth from "@/hooks/useAuth";
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

  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showBalance, setShowBalance] = useState(true);

  const [amount, setAmount] = useState("");
  const [funding, setFunding] = useState(false);
  const [savingPdf, setSavingPdf] = useState(false);

  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [receipt, setReceipt] = useState<ReceiptData | null>(null);

  const PAYSTACK_PUBLIC_KEY =
    process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY ||
    "pk_test_c6f342365ea342d44c498bc68ecf3bb01b28be24";

  // ==========================================
  // CUSTOMER DETAILS
  // ==========================================

  const customerName =
    (user as any)?.name ||
    (user as any)?.fullName ||
    (user as any)?.username ||
    (user as any)?.email ||
    "AbuPay Customer";

  // ==========================================
  // FETCH WALLET
  // ==========================================

  const fetchWallet = async () => {
    try {
      setLoading(true);

      const res = await getWallet();

      const walletBalance = Number(
        res?.data?.balance ??
          res?.balance ??
          0
      );

      setBalance(walletBalance);
    } catch (error) {
      console.error("Failed to fetch wallet:", error);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // LOAD PAYSTACK
  // ==========================================

  useEffect(() => {
    fetchWallet();

    if (!document.getElementById("paystack-script")) {
      const script = document.createElement("script");

      script.id = "paystack-script";
      script.src = "https://js.paystack.co/v1/inline.js";
      script.async = true;

      document.body.appendChild(script);
    }
  }, []);

  // ==========================================
  // FUND WALLET
  // ==========================================

  const handleFund = async () => {
    const value = Number(amount);

    if (!value || value < 100) {
      setMessage({
        type: "error",
        text: "Minimum funding amount is ₦100",
      });

      return;
    }

    // Capture balance BEFORE funding
    const previousBalance = Number(balance);

    try {
      setFunding(true);
      setMessage(null);

      // ========================================
      // INITIALIZE PAYMENT
      // ========================================

      const result = await initializeFunding(value);

      if (
        !result.success ||
        !result.data?.reference
      ) {
        setMessage({
          type: "error",
          text:
            result.message ||
            "Unable to start payment",
        });

        setFunding(false);
        return;
      }

      const {
        reference,
        email,
      } = result.data;

      // ========================================
      // WAIT FOR PAYSTACK
      // ========================================

      if (!window.PaystackPop) {
        setMessage({
          type: "error",
          text:
            "Paystack is still loading. Please try again in 2 seconds.",
        });

        setFunding(false);
        return;
      }

      // ========================================
      // PAYSTACK POPUP
      // ========================================

      const handler =
        window.PaystackPop.setup({
          key: PAYSTACK_PUBLIC_KEY,

          email:
            email ||
            (user as any)?.email ||
            "",

          amount: value * 100,

          ref: reference,

          currency: "NGN",

          // ====================================
          // PAYMENT SUCCESS
          // ====================================

          callback: function (
            response: any
          ) {
            (async () => {
              try {
                const verifyResult =
                  await verifyFunding(
                    response.reference
                  );

                if (
                  !verifyResult.success
                ) {
                  setMessage({
                    type: "error",
                    text:
                      verifyResult.message ||
                      "Payment verification failed",
                  });

                  return;
                }

                // =================================
                // GET NEW BALANCE
                // =================================

                let newBalance = 0;

                newBalance = Number(
                  verifyResult?.data
                    ?.walletBalance ??
                    verifyResult?.data
                      ?.balance ??
                    verifyResult?.walletBalance ??
                    verifyResult?.balance ??
                    previousBalance + value
                );

                // Safety fallback
                if (
                  !newBalance ||
                  newBalance <
                    previousBalance
                ) {
                  newBalance =
                    previousBalance +
                    value;
                }

                // =================================
                // TRANSACTION INFORMATION
                // =================================

                const transaction =
                  verifyResult?.transaction ||
                  verifyResult?.data
                    ?.transaction;

                const receiptReference =
                  transaction?.reference ||
                  response.reference ||
                  reference ||
                  `ABP-${Date.now()}`;

                const transactionDate =
                  transaction?.createdAt
                    ? new Date(
                        transaction.createdAt
                      ).toLocaleString()
                    : new Date().toLocaleString();

                // =================================
                // CREATE RECEIPT
                // =================================

                setReceipt({
                  reference:
                    receiptReference,

                  date:
                    transactionDate,

                  customerName,

                  amount: value,

                  previousBalance,

                  newBalance,

                  status:
                    transaction?.status ||
                    "SUCCESS",
                });

                // =================================
                // UPDATE BALANCE
                // =================================

                setBalance(newBalance);

                setAmount("");

                setMessage({
                  type: "success",
                  text: `Wallet funded successfully with ₦${value.toLocaleString()}`,
                });

                // Refresh wallet
                await fetchWallet();

              } catch (error: any) {
                console.error(
                  "Wallet verification error:",
                  error
                );

                setMessage({
                  type: "error",
                  text:
                    error?.response
                      ?.data?.message ||
                    "Payment verification failed",
                });
              } finally {
                setFunding(false);
              }
            })();
          },

          // ====================================
          // PAYSTACK CLOSED
          // ====================================

          onClose: function () {
            setFunding(false);

            setMessage({
              type: "error",
              text: "Payment cancelled",
            });
          },
        });

      handler.openIframe();

    } catch (error: any) {
      console.error(
        "Fund Wallet Error:",
        error
      );

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
    if (!receipt) {
      return;
    }

    try {
      setSavingPdf(true);

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth =
        pdf.internal.pageSize.getWidth();

      const leftMargin = 25;
      const rightMargin = 25;

      const contentWidth =
        pageWidth -
        leftMargin -
        rightMargin;

      let y = 20;

      // ========================================
      // LOGO
      // ========================================

      const logo = new Image();

      logo.src =
        "/images/abupay-logo.png";

      await new Promise<void>(
        (resolve) => {
          logo.onload = () =>
            resolve();

          logo.onerror = () =>
            resolve();
        }
      );

      if (
        logo.complete &&
        logo.naturalWidth > 0
      ) {
        const logoWidth = 38;

        const logoHeight =
          (logo.naturalHeight /
            logo.naturalWidth) *
          logoWidth;

        pdf.addImage(
          logo,
          "PNG",
          (pageWidth -
            logoWidth) /
            2,
          y,
          logoWidth,
          logoHeight
        );

        y += logoHeight + 8;
      } else {
        y += 5;
      }

      // ========================================
      // ABUPAY
      // ========================================

      pdf.setFont(
        "helvetica",
        "bold"
      );

      pdf.setFontSize(23);

      pdf.setTextColor(
        20,
        20,
        20
      );

      pdf.text(
        "AbuPay",
        pageWidth / 2,
        y,
        {
          align: "center",
        }
      );

      y += 8;

      // ========================================
      // RECEIPT TITLE
      // ========================================

      pdf.setFont(
        "helvetica",
        "normal"
      );

      pdf.setFontSize(10);

      pdf.setTextColor(
        100,
        100,
        100
      );

      pdf.text(
        "TRANSACTION RECEIPT",
        pageWidth / 2,
        y,
        {
          align: "center",
        }
      );

      y += 12;

      // ========================================
      // SUCCESS BOX
      // ========================================

      pdf.setFillColor(
        236,
        253,
        245
      );

      pdf.roundedRect(
        leftMargin,
        y,
        contentWidth,
        14,
        3,
        3,
        "F"
      );

      pdf.setFont(
        "helvetica",
        "bold"
      );

      pdf.setFontSize(10);

      pdf.setTextColor(
        5,
        150,
        105
      );

      pdf.text(
        "TRANSACTION SUCCESSFUL",
        pageWidth / 2,
        y + 9,
        {
          align: "center",
        }
      );

      y += 24;

      // ========================================
      // RECEIPT ROW
      // ========================================

      const addRow = (
        label: string,
        value: string,
        bold = false
      ) => {
        pdf.setFont(
          "helvetica",
          "normal"
        );

        pdf.setFontSize(10);

        pdf.setTextColor(
          110,
          110,
          110
        );

        pdf.text(
          label,
          leftMargin,
          y
        );

        pdf.setFont(
          "helvetica",
          bold
            ? "bold"
            : "normal"
        );

        pdf.setTextColor(
          30,
          30,
          30
        );

        pdf.text(
          value,
          pageWidth -
            rightMargin,
          y,
          {
            align: "right",
          }
        );

        y += 10;
      };

      // ========================================
      // TRANSACTION DETAILS
      // ========================================

      addRow(
        "Receipt Number",
        receipt.reference
      );

      addRow(
        "Date & Time",
        receipt.date
      );

      addRow(
        "Customer",
        receipt.customerName
      );

      // PHONE REMOVED FROM WALLET RECEIPT

      addRow(
        "Service",
        "Wallet Funding"
      );

      addRow(
        "Payment Reference",
        receipt.reference
      );

      // ========================================
      // DIVIDER
      // ========================================

      y += 4;

      pdf.setDrawColor(
        190,
        190,
        190
      );

      pdf.setLineDashPattern(
        [2, 2],
        0
      );

      pdf.line(
        leftMargin,
        y,
        pageWidth -
          rightMargin,
        y
      );

      pdf.setLineDashPattern(
        [],
        0
      );

      y += 13;

      // ========================================
      // WALLET DETAILS
      // ========================================

      addRow(
        "Previous Wallet Balance",
        `₦${receipt.previousBalance.toLocaleString()}`
      );

      addRow(
        "Amount Funded",
        `₦${receipt.amount.toLocaleString()}`,
        true
      );

      addRow(
        "New Wallet Balance",
        `₦${receipt.newBalance.toLocaleString()}`,
        true
      );

      // ========================================
      // STATUS
      // ========================================

      addRow(
        "Status",
        receipt.status ===
          "SUCCESS"
          ? "SUCCESSFUL"
          : receipt.status
      );

      // ========================================
      // FOOTER DIVIDER
      // ========================================

      y += 10;

      pdf.setDrawColor(
        230,
        230,
        230
      );

      pdf.line(
        leftMargin,
        y,
        pageWidth -
          rightMargin,
        y
      );

      y += 16;

      // ========================================
      // THANK YOU
      // ========================================

      pdf.setFont(
        "helvetica",
        "bold"
      );

      pdf.setFontSize(11);

      pdf.setTextColor(
        40,
        40,
        40
      );

      pdf.text(
        "Thank you for using AbuPay",
        pageWidth / 2,
        y,
        {
          align: "center",
        }
      );

      y += 8;

      // ========================================
      // POWERED BY
      // ========================================

      pdf.setFont(
        "helvetica",
        "normal"
      );

      pdf.setFontSize(8);

      pdf.setTextColor(
        150,
        150,
        150
      );

      pdf.text(
        "Powered by Abu Niematullah Ventures",
        pageWidth / 2,
        y,
        {
          align: "center",
        }
      );

      // ========================================
      // SAVE
      // ========================================

      pdf.save(
        `AbuPay-Receipt-${receipt.reference}.pdf`
      );

    } catch (error) {
      console.error(
        "PDF generation failed:",
        error
      );

      setMessage({
        type: "error",
        text:
          "Unable to save receipt. Please try again.",
      });

    } finally {
      setSavingPdf(false);
    }
  };

  // ==========================================
  // SHARE RECEIPT
  // ==========================================

  const shareReceipt = async () => {
    if (!receipt) {
      return;
    }

    const shareText = `
AbuPay Transaction Receipt

Receipt Number:
${receipt.reference}

Date & Time:
${receipt.date}

Customer:
${receipt.customerName}

Service:
Wallet Funding

Amount Funded:
₦${receipt.amount.toLocaleString()}

Previous Wallet Balance:
₦${receipt.previousBalance.toLocaleString()}

New Wallet Balance:
₦${receipt.newBalance.toLocaleString()}

Status:
${
  receipt.status === "SUCCESS"
    ? "SUCCESSFUL"
    : receipt.status
}

Payment Reference:
${receipt.reference}

Thank you for using AbuPay.

Powered by Abu Niematullah Ventures
    `.trim();

    try {
      // ========================================
      // NATIVE SHARE
      // ========================================

      if (
        typeof navigator !==
          "undefined" &&
        navigator.share
      ) {
        await navigator.share({
          title:
            "AbuPay Transaction Receipt",
          text: shareText,
        });

        return;
      }

      // ========================================
      // COPY FALLBACK
      // ========================================

      if (navigator.clipboard) {
        await navigator.clipboard.writeText(
          shareText
        );

        setMessage({
          type: "success",
          text:
            "Receipt copied. You can paste it into WhatsApp or another app.",
        });

        return;
      }

      setMessage({
        type: "error",
        text:
          "Sharing is not supported on this browser.",
      });

    } catch (error) {
      console.log(
        "Share cancelled:",
        error
      );
    }
  };

  // ==========================================
  // CLOSE RECEIPT
  // ==========================================

  const closeReceipt = () => {
    setReceipt(null);
    setMessage(null);
  };

  // ==========================================
  // PAGE
  // ==========================================

  return (
    <DashboardLayout>
      <div className="space-y-8">

        {/* HEADER */}

        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            My Wallet
          </h1>

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

                <span className="text-sm font-medium">
                  Available Balance
                </span>

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
                  onClick={() =>
                    setShowBalance(
                      !showBalance
                    )
                  }
                  className="rounded-full bg-white/15 p-2 transition hover:bg-white/25"
                >
                  {showBalance ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>

              </div>

            </div>

            <Wallet
              size={80}
              className="hidden opacity-20 md:block"
            />

          </div>

        </div>

        {/* FUND WALLET */}

        <div className="rounded-2xl border bg-white p-6 shadow-sm md:p-8">

          <div className="mb-6 flex items-center gap-3">

            <div className="rounded-xl bg-emerald-100 p-2.5">
              <Plus
                className="text-emerald-600"
                size={20}
              />
            </div>

            <div>

              <h2 className="text-lg font-semibold text-gray-900">
                Fund Wallet
              </h2>

              <p className="text-sm text-gray-500">
                Pay securely with card, bank transfer or USSD
              </p>

            </div>

          </div>

          {/* QUICK AMOUNTS */}

          <div className="mb-6 grid grid-cols-3 gap-3 sm:grid-cols-6">

            {quickAmounts.map(
              (value) => (

                <button
                  key={value}
                  type="button"
                  onClick={() =>
                    setAmount(
                      String(value)
                    )
                  }
                  className={`rounded-xl border py-3 text-sm font-medium transition ${
                    amount ===
                    String(value)
                      ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                      : "hover:border-emerald-300 hover:bg-emerald-50"
                  }`}
                >
                  ₦
                  {value.toLocaleString()}
                </button>

              )
            )}

          </div>

          {/* AMOUNT */}

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
                  value={amount}
                  onChange={(e) =>
                    setAmount(
                      e.target.value
                    )
                  }
                  placeholder="0.00"
                  className="w-full rounded-xl border py-3.5 pr-4 pl-9 text-lg outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />

              </div>

              <p className="mt-2 text-xs text-gray-400">
                Minimum amount: ₦100
              </p>

            </div>

            {/* FUND BUTTON */}

            <button
              type="button"
              onClick={handleFund}
              disabled={
                funding ||
                !amount
              }
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >

              {funding ? (
                <>
                  <Loader2
                    className="animate-spin"
                    size={18}
                  />

                  Processing...
                </>
              ) : (
                "Fund Wallet"
              )}

            </button>

            {/* MESSAGE */}

            {message && (
              <div
                className={`rounded-xl px-4 py-3 text-center text-sm font-medium ${
                  message.type ===
                  "success"
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-red-50 text-red-600"
                }`}
              >
                {message.text}
              </div>
            )}

          </div>

        </div>

        {/* ======================================
            RECEIPT MODAL
        ======================================= */}

        {receipt && (

          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4">

            <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">

              {/* RECEIPT */}

              <div className="overflow-hidden rounded-t-2xl bg-white">

                {/* LOGO */}

                <div className="border-b px-6 py-7 text-center">

                  <img
                    src="/images/abupay-logo.png"
                    alt="AbuPay"
                    className="mx-auto mb-3 h-16 w-auto object-contain"
                  />

                  <h2 className="text-2xl font-bold tracking-tight text-gray-900">
                    AbuPay
                  </h2>

                  <p className="mt-1 text-sm font-medium uppercase tracking-widest text-gray-500">
                    Transaction Receipt
                  </p>

                </div>

                {/* SUCCESS */}

                <div className="flex items-center justify-center gap-2 border-b bg-emerald-50 px-6 py-4">

                  <CheckCircle
                    size={20}
                    className="text-emerald-600"
                  />

                  <span className="font-bold text-emerald-700">
                    TRANSACTION SUCCESSFUL
                  </span>

                </div>

                {/* DETAILS */}

                <div className="space-y-4 px-6 py-6">

                  <ReceiptRow
                    label="Receipt Number"
                    value={
                      receipt.reference
                    }
                  />

                  <ReceiptRow
                    label="Date & Time"
                    value={
                      receipt.date
                    }
                  />

                  <ReceiptRow
                    label="Customer"
                    value={
                      receipt.customerName
                    }
                  />

                  {/* PHONE REMOVED */}

                  <ReceiptRow
                    label="Service"
                    value="Wallet Funding"
                  />

                  <ReceiptRow
                    label="Payment Reference"
                    value={
                      receipt.reference
                    }
                  />

                  <div className="my-5 border-t border-dashed" />

                  <ReceiptRow
                    label="Previous Wallet Balance"
                    value={`₦${receipt.previousBalance.toLocaleString()}`}
                  />

                  <ReceiptRow
                    label="Amount Funded"
                    value={`₦${receipt.amount.toLocaleString()}`}
                    bold
                  />

                  <ReceiptRow
                    label="New Wallet Balance"
                    value={`₦${receipt.newBalance.toLocaleString()}`}
                    bold
                  />

                  <ReceiptRow
                    label="Status"
                    value={
                      receipt.status ===
                      "SUCCESS"
                        ? "SUCCESSFUL"
                        : receipt.status
                    }
                  />

                </div>

                {/* FOOTER */}

                <div className="border-t px-6 py-6 text-center">

                  <p className="font-medium text-gray-800">
                    Thank you for using AbuPay
                  </p>

                  <p className="mt-2 text-xs text-gray-400">
                    Powered by Abu
                    Niematullah Ventures
                  </p>

                </div>

              </div>

              {/* BUTTONS */}

              <div className="flex gap-3 rounded-b-2xl border-t bg-gray-50 p-5">

                {/* SAVE PDF */}

                <button
                  type="button"
                  onClick={
                    saveReceipt
                  }
                  disabled={
                    savingPdf
                  }
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >

                  {savingPdf ? (
                    <>
                      <Loader2
                        size={18}
                        className="animate-spin"
                      />

                      Saving...
                    </>
                  ) : (
                    <>
                      <Download
                        size={18}
                      />

                      Save PDF
                    </>
                  )}

                </button>

                {/* SHARE */}

                <button
                  type="button"
                  onClick={
                    shareReceipt
                  }
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-3 font-semibold text-gray-700 transition hover:bg-gray-100"
                >

                  <Share2
                    size={18}
                  />

                  Share

                </button>

                {/* CLOSE */}

                <button
                  type="button"
                  onClick={
                    closeReceipt
                  }
                  className="rounded-xl border border-gray-200 bg-white px-4 py-3 font-semibold text-gray-600 transition hover:bg-gray-100"
                  aria-label="Close receipt"
                >

                  <X size={18} />

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
    <div className="flex items-start justify-between gap-4">

      <span className="text-sm text-gray-500">
        {label}
      </span>

      <span
        className={`max-w-[60%] break-words text-right text-sm text-gray-900 ${
          bold
            ? "font-bold"
            : "font-medium"
        }`}
      >
        {value}
      </span>

    </div>
  );
}