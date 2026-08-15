"use client";

import { useEffect, useState } from "react";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import HeroSection from "@/components/dashboard/HeroSection";
import StatCard from "@/components/dashboard/StatCard";
import QuickActions from "@/components/dashboard/QuickActions";
import StatisticsChart from "@/components/dashboard/StatisticsChart";
import TransactionsTable from "@/components/dashboard/TransactionsTable";
import ServicesGrid from "@/components/dashboard/ServicesGrid";
import NetworkStatus from "@/components/dashboard/NetworkStatus";
import WelcomeModal from "@/components/dashboard/WelcomeModal";

import {
  Receipt,
  CheckCircle,
  Wallet,
  Gift,
} from "lucide-react";

import useAuth from "@/hooks/useAuth";

export default function DashboardPage() {
  const [showWelcome, setShowWelcome] = useState(false);

  const { user, loading } = useAuth();

  // Show announcement/welcome message once
  useEffect(() => {
    const seen = localStorage.getItem("abupay-welcome-seen");

    if (!seen) {
      setShowWelcome(true);
    }
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex h-[70vh] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />

            <p className="mt-4 text-gray-500">
              Loading AbuPay...
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <>
      {/* Welcome / Announcement Popup */}
      <WelcomeModal
        open={showWelcome}
        userName={user?.name || "AbuPay User"}
        onClose={() => {
          localStorage.setItem("abupay-welcome-seen", "true");
          setShowWelcome(false);
        }}
      />

      <DashboardLayout>
        <div className="space-y-6">

          {/* =========================
              HERO SECTION
          ========================== */}
          <HeroSection />

          {/* =========================
              STATISTICS
          ========================== */}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">

            <StatCard
              title="Transactions"
              value={25}
              icon={Receipt}
              color="bg-blue-500"
            />

            <StatCard
              title="Successful"
              value={22}
              icon={CheckCircle}
              color="bg-green-500"
            />

            <StatCard
              title="Wallet Balance"
              value={15000}
              icon={Wallet}
              color="bg-emerald-600"
            />

            <StatCard
              title="Referral Earnings"
              value={0}
              icon={Gift}
              color="bg-purple-500"
            />

          </div>

          {/* =========================
              QUICK ACTIONS
          ========================== */}
          <QuickActions />

          {/* =========================
              STATISTICS + NETWORK
          ========================== */}
          <div className="grid gap-6 lg:grid-cols-3">

            <div className="lg:col-span-2">
              <StatisticsChart />
            </div>

            <NetworkStatus />

          </div>

          {/* =========================
              AVAILABLE SERVICES
          ========================== */}
          <ServicesGrid />

          {/* =========================
              RECENT TRANSACTIONS
          ========================== */}
          <TransactionsTable />

        </div>
      </DashboardLayout>
    </>
  );
}