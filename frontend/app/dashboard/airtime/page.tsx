"use client";

import { useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import {
  Smartphone,
  Loader2,
  Download,
  Share2,
  X,
  CheckCircle,
} from "lucide-react";
import { buyAirtime } from "@/services/airtime";
import useAuth from "@/hooks/useAuth";
import jsPDF from "jspdf";

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

const quickAmounts = [
  100,
  200,
  500,
  1000,
  2000,
  5000,
];

interface ReceiptData {
  reference: string;
  date: string;
  customerName: string;
  phone: string;
  network: string;
  amount: number;
  previousBalance: number;
  newBalance: number;
  status: string;
}

export default function AirtimePage() {
  const { user } = useAuth();

  const [network, setNetwork] = useState("mtn");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");

  const [loading, setLoading] = useState(false);
  const [savingPdf, setSavingPdf] = useState(false);

  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [receipt, setReceipt] =
    useState<ReceiptData | null>(null);

  // ==========================================
  // BUY AIRTIME
  // ==========================================

  const handlePurchase = async () => {
    if (!phone || phone.length !== 11) {
      setMessage({
        type: "error",
        text: "Please enter a valid 11-digit phone number",
      });
      return;
    }

    if (!amount || Number(amount) <= 0) {
      setMessage({
        type: "error",
        text: "Please select an airtime amount",
      });
      return;
    }

    try {
      setLoading(true);
      setMessage(null);

      const purchasePhone = phone;
      const purchaseAmount = Number(amount);
      const purchaseNetwork = network;

      const result = await buyAirtime({
        network: purchaseNetwork,
        phone: purchasePhone,
        amount: purchaseAmount,
      });

      if (!result.success) {
        setMessage({
          type: "error",
          text:
            result.message ||
            "Purchase failed. Please try again.",
        });

        return;
      }

      // ========================================
      // TRANSACTION INFORMATION
      // ========================================

      const transaction = result.transaction;

      const newBalance = Number(
        result.walletBalance || 0
      );

      /*
       * Wallet was already debited by the
       * purchase amount.
       *
       * Therefore:
       *
       * Previous balance =
       * New balance + Amount paid
       */

      const previousBalance =
        newBalance + purchaseAmount;

      const customerName =
        (user as any)?.name ||
        (user as any)?.fullName ||
        (user as any)?.username ||
        (user as any)?.email ||
        "AbuPay Customer";

      const reference =
        transaction?.reference ||
        `ABP-${Date.now()}`;

      const transactionDate =
        transaction?.createdAt
          ? new Date(
              transaction.createdAt
            ).toLocaleString()
          : new Date().toLocaleString();

      // ========================================
      // CREATE RECEIPT
      // ========================================

      setReceipt({
        reference,
        date: transactionDate,
        customerName,
        phone: purchasePhone,
        network: purchaseNetwork,
        amount: purchaseAmount,
        previousBalance,
        newBalance,
        status:
          transaction?.status ||
          "SUCCESS",
      });

      setMessage({
        type: "success",
        text: "Airtime purchase successful.",
      });

      // Clear form

      setPhone("");
      setAmount("");
    } catch (error: any) {
      console.error(
        "Airtime purchase error:",
        error
      );

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

      const pageHeight =
        pdf.internal.pageSize.getHeight();

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

      await new Promise<void>((resolve) => {
        logo.onload = () => resolve();
        logo.onerror = () => resolve();
      });

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

      addRow(
        "Phone",
        receipt.phone
      );

      addRow(
        "Service",
        `${receipt.network.toUpperCase()} Airtime`
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
        "Amount Paid",
        `₦${receipt.amount.toLocaleString()}`,
        true
      );

      addRow(
        "New Wallet Balance",
        `₦${receipt.newBalance.toLocaleString()}`,
        true
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
      // SAVE FILE
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

Phone:
${receipt.phone}

Service:
${receipt.network.toUpperCase()} Airtime

Amount Paid:
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
      // FALLBACK COPY
      // ========================================

      if (
        navigator.clipboard
      ) {
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

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-2xl space-y-8">

        {/* ====================================
            PAGE HEADER
        ===================================== */}

        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Buy Airtime
          </h1>

          <p className="mt-1 text-gray-500">
            Instant airtime top-up for all
            networks
          </p>
        </div>

        {/* ====================================
            PURCHASE CARD
        ===================================== */}

        <div className="rounded-2xl border bg-white p-6 shadow-sm md:p-8">

          {/* NETWORK */}

          <div className="mb-6">

            <label className="mb-3 block text-sm font-medium text-gray-700">
              Select Network
            </label>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">

              {networks.map(
                (net) => (
                  <button
                    key={net.id}
                    type="button"
                    onClick={() =>
                      setNetwork(
                        net.id
                      )
                    }
                    className={`rounded-xl py-4 text-sm font-semibold transition ${
                      network ===
                      net.id
                        ? `${net.color} ${net.text} ring-2 ring-offset-2 ring-emerald-500`
                        : "border bg-gray-50 hover:bg-gray-100"
                    }`}
                  >
                    {net.name}
                  </button>
                )
              )}

            </div>
          </div>

          {/* PHONE */}

          <div className="mb-6">

            <label className="mb-2 block text-sm font-medium text-gray-700">
              Phone Number
            </label>

            <input
              type="tel"
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
              className="w-full rounded-xl border px-4 py-3.5 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />

          </div>

          {/* AMOUNT */}

          <div className="mb-6">

            <label className="mb-2 block text-sm font-medium text-gray-700">
              Select Airtime Amount
            </label>

            <select
              value={amount}
              onChange={(e) =>
                setAmount(
                  e.target.value
                )
              }
              className="w-full rounded-xl border bg-white px-4 py-3.5 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            >

              <option value="">
                Select amount
              </option>

              {quickAmounts.map(
                (value) => (
                  <option
                    key={value}
                    value={value}
                  >
                    ₦
                    {value.toLocaleString()}
                  </option>
                )
              )}

            </select>

          </div>

          {/* BUY BUTTON */}

          <button
            type="button"
            onClick={
              handlePurchase
            }
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >

            {loading ? (
              <>
                <Loader2
                  size={18}
                  className="animate-spin"
                />

                Processing...
              </>
            ) : (
              <>
                <Smartphone
                  size={18}
                />

                Buy Airtime
              </>
            )}

          </button>

          {/* MESSAGE */}

          {message &&
            !receipt && (
              <div
                className={`mt-4 rounded-xl px-4 py-3 text-center text-sm font-medium ${
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

        {/* ====================================
            RECEIPT MODAL
        ===================================== */}

        {receipt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4">

            <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">

              {/* =================================
                  RECEIPT
              ================================== */}

              <div
                id="abupay-receipt"
                className="overflow-hidden rounded-t-2xl bg-white"
              >

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
                    TRANSACTION
                    SUCCESSFUL
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

                  <ReceiptRow
                    label="Phone"
                    value={
                      receipt.phone
                    }
                  />

                  <ReceiptRow
                    label="Service"
                    value={`${receipt.network.toUpperCase()} Airtime`}
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
                    label="Amount Paid"
                    value={`₦${receipt.amount.toLocaleString()}`}
                    bold
                  />

                  <ReceiptRow
                    label="New Wallet Balance"
                    value={`₦${receipt.newBalance.toLocaleString()}`}
                    bold
                  />

                </div>

                {/* FOOTER */}

                <div className="border-t px-6 py-6 text-center">

                  <p className="font-medium text-gray-800">
                    Thank you for using
                    AbuPay
                  </p>

                  <p className="mt-2 text-xs text-gray-400">
                    Powered by Abu
                    Niematullah Ventures
                  </p>

                </div>

              </div>

              {/* =================================
                  BUTTONS
              ================================== */}

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

// ============================================
// RECEIPT ROW
// ============================================

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
        className={`max-w-[60%] break-words text-right text-sm ${
          bold
            ? "font-bold text-gray-900"
            : "font-medium text-gray-800"
        }`}
      >
        {value}
      </span>

    </div>
  );
}