"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Wifi, Loader2, Check } from "lucide-react";
import { getDataPlans, buyData } from "@/services/data";

const networks = [
  { id: "mtn", name: "MTN", color: "bg-yellow-400", text: "text-black" },
  { id: "airtel", name: "Airtel", color: "bg-red-500", text: "text-white" },
  { id: "glo", name: "Glo", color: "bg-green-600", text: "text-white" },
  { id: "9mobile", name: "9mobile", color: "bg-emerald-700", text: "text-white" },
];

interface Plan {
  name: string;
  variation_code: string;
  amount: number;
}

export default function DataPage() {
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

  useEffect(() => {
    loadPlans();
  }, [network]);

  const loadPlans = async () => {
    try {
      setLoadingPlans(true);
      setSelectedPlan(null);
      setMessage(null);
      setPlans([]);

      const result = await getDataPlans(network);

      let plansData: any[] = [];

      if (Array.isArray(result)) {
        plansData = result;
      } else if (Array.isArray(result?.data)) {
        plansData = result.data;
      } else if (Array.isArray(result?.data?.content)) {
        plansData = result.data.content;
      } else if (Array.isArray(result?.content)) {
        plansData = result.content;
      } else if (Array.isArray(result?.plans)) {
        plansData = result.plans;
      } else if (Array.isArray(result?.data?.varations)) {
        plansData = result.data.varations;
      } else if (Array.isArray(result?.varations)) {
        plansData = result.varations;
      }

      const normalized: Plan[] = plansData
        .map((plan: any) => ({
          name:
            plan.name ||
            plan.plan_name ||
            plan.variation_name ||
            plan.package ||
            "Data Plan",
          variation_code:
            plan.variation_code ||
            plan.plan_id ||
            plan.code ||
            plan.id ||
            "",
          amount: Number(
            plan.amount ||
              plan.price ||
              plan.variation_amount ||
              plan.fixedPrice ||
              0
          ),
        }))
        .filter((p) => p.variation_code && p.amount > 0);

      setPlans(normalized);

      if (normalized.length === 0) {
        setMessage({
          type: "error",
          text: "No data plans available for this network",
        });
      }
    } catch (error: any) {
      console.error("Failed to load plans:", error);
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

  const handlePurchase = async () => {
    if (!phone || phone.length < 11) {
      setMessage({ type: "error", text: "Please enter a valid phone number" });
      return;
    }

    if (!selectedPlan) {
      setMessage({ type: "error", text: "Please select a data plan" });
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
      });

      if (result.success) {
        setMessage({
          type: "success",
          text: `${selectedPlan.name} sent successfully to ${phone}`,
        });
        setPhone("");
        setSelectedPlan(null);
      } else {
        setMessage({
          type: "error",
          text: result.message || "Purchase failed. Please try again.",
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
      setLoadingPurchase(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-3xl space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Buy Data</h1>
          <p className="mt-1 text-gray-500">
            Choose a network and select a data plan
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-6 shadow-sm md:p-8">
          {/* Network Selection */}
          <div className="mb-8">
            <label className="mb-3 block text-sm font-medium text-gray-700">
              Select Network
            </label>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {networks.map((net) => (
                <button
                  key={net.id}
                  onClick={() => setNetwork(net.id)}
                  className={`rounded-xl py-4 text-sm font-semibold transition ${
                    network === net.id
                      ? `${net.color} ${net.text} ring-2 ring-offset-2 ring-emerald-500`
                      : "border bg-gray-50 hover:bg-gray-100"
                  }`}
                >
                  {net.name}
                </button>
              ))}
            </div>
          </div>

          {/* Phone Number */}
          <div className="mb-8">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="08012345678"
              maxLength={11}
              className="w-full rounded-xl border px-4 py-3.5 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          {/* Data Plans */}
          <div className="mb-8">
            <label className="mb-3 block text-sm font-medium text-gray-700">
              Select Data Plan
            </label>

            {loadingPlans ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="animate-spin text-emerald-600" size={28} />
              </div>
            ) : plans.length === 0 ? (
              <div className="rounded-xl border border-dashed py-10 text-center text-gray-400">
                No plans available for this network
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {plans.map((plan, index) => (
                  <button
                    key={`${plan.variation_code}-${plan.amount}-${index}`}
                    onClick={() => setSelectedPlan(plan)}
                    className={`relative rounded-xl border p-4 text-left transition ${
                      selectedPlan?.variation_code === plan.variation_code &&
                      selectedPlan?.amount === plan.amount
                        ? "border-emerald-600 bg-emerald-50 ring-2 ring-emerald-100"
                        : "hover:border-emerald-300 hover:bg-gray-50"
                    }`}
                  >
                    {selectedPlan?.variation_code === plan.variation_code &&
                      selectedPlan?.amount === plan.amount && (
                        <div className="absolute top-3 right-3 rounded-full bg-emerald-600 p-1 text-white">
                          <Check size={12} />
                        </div>
                      )}

                    <p className="font-medium text-gray-900">{plan.name}</p>
                    <p className="mt-1 text-lg font-bold text-emerald-600">
                      ₦{plan.amount.toLocaleString()}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Buy Button */}
          <button
            onClick={handlePurchase}
            disabled={loadingPurchase || !selectedPlan}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loadingPurchase ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Processing...
              </>
            ) : (
              <>
                <Wifi size={18} />
                {selectedPlan
                  ? `Buy ${selectedPlan.name} - ₦${selectedPlan.amount.toLocaleString()}`
                  : "Select a Plan"}
              </>
            )}
          </button>

          {/* Message */}
          {message && (
            <div
              className={`mt-4 rounded-xl px-4 py-3 text-center text-sm font-medium ${
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
    </DashboardLayout>
  );
}