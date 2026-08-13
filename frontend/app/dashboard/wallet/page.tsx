"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Wallet, Eye, EyeOff, Plus, Loader2 } from "lucide-react";
import {
  getWallet,
  initializeFunding,
  verifyFunding,
} from "@/services/wallet.service";
import CountUp from "react-countup";

const quickAmounts = [500, 1000, 2000, 5000, 10000, 20000];

declare global {
  interface Window {
    PaystackPop: any;
  }
}

export default function WalletPage() {
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showBalance, setShowBalance] = useState(true);
  const [amount, setAmount] = useState("");
  const [funding, setFunding] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const PAYSTACK_PUBLIC_KEY =
    process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY ||
    "pk_test_c6f342365ea342d44c498bc68ecf3bb01b28be24";

  const fetchWallet = async () => {
    try {
      setLoading(true);
      const res = await getWallet();
      setBalance(res?.data?.balance || res?.balance || 0);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallet();

    // Load Paystack script only once
    if (!document.getElementById("paystack-script")) {
      const script = document.createElement("script");
      script.id = "paystack-script";
      script.src = "https://js.paystack.co/v1/inline.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  const handleFund = async () => {
    const value = Number(amount);

    if (!value || value < 100) {
      setMessage({
        type: "error",
        text: "Minimum funding amount is ₦100",
      });
      return;
    }

    try {
      setFunding(true);
      setMessage(null);

      // 1. Initialize payment on backend
      const result = await initializeFunding(value);

      if (!result.success || !result.data?.reference) {
        setMessage({
          type: "error",
          text: result.message || "Unable to start payment",
        });
        setFunding(false);
        return;
      }

      const { reference, email, access_code } = result.data;

      // Wait until Paystack script is ready
      if (!window.PaystackPop) {
        setMessage({
          type: "error",
          text: "Paystack is still loading. Please try again in 2 seconds.",
        });
        setFunding(false);
        return;
      }

      // 2. Open Paystack Popup
      const handler = window.PaystackPop.setup({
        key: PAYSTACK_PUBLIC_KEY,
        email: email,
        amount: value * 100, // kobo
        ref: reference,
        currency: "NGN",
        // Use normal function (not async) — required by Paystack
        callback: function (response: any) {
          // Call async logic inside
          (async () => {
            try {
              const verifyResult = await verifyFunding(response.reference);

              if (verifyResult.success) {
                setMessage({
                  type: "success",
                  text: `Wallet funded successfully with ₦${value.toLocaleString()}`,
                });
                setAmount("");
                await fetchWallet();
              } else {
                setMessage({
                  type: "error",
                  text: verifyResult.message || "Verification failed",
                });
              }
            } catch (error: any) {
              setMessage({
                type: "error",
                text:
                  error?.response?.data?.message ||
                  "Payment verification failed",
              });
            } finally {
              setFunding(false);
            }
          })();
        },
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

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Wallet</h1>
          <p className="mt-1 text-gray-500">
            Fund your wallet securely with Paystack
          </p>
        </div>

        {/* Balance Card */}
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

        {/* Fund Wallet Section */}
        <div className="rounded-2xl border bg-white p-6 shadow-sm md:p-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-xl bg-emerald-100 p-2.5">
              <Plus className="text-emerald-600" size={20} />
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

          {/* Quick Amounts */}
          <div className="mb-6 grid grid-cols-3 gap-3 sm:grid-cols-6">
            {quickAmounts.map((value) => (
              <button
                key={value}
                onClick={() => setAmount(String(value))}
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

          {/* Amount Input */}
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
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-xl border py-3.5 pr-4 pl-9 text-lg outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>
              <p className="mt-2 text-xs text-gray-400">
                Minimum amount: ₦100
              </p>
            </div>

            <button
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
      </div>
    </DashboardLayout>
  );
}