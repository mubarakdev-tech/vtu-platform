"use client";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import HeroSection from "@/components/dashboard/HeroSection";
import StatCard from "@/components/dashboard/StatCard";
import QuickActions from "@/components/dashboard/QuickActions";
import StatisticsChart from "@/components/dashboard/StatisticsChart";
import TransactionsTable from "@/components/dashboard/TransactionsTable";
import ServicesGrid from "@/components/dashboard/ServicesGrid";
import NetworkStatus from "@/components/dashboard/NetworkStatus";

import { Users } from "lucide-react";
import useAuth from "@/hooks/useAuth";

export default function DashboardPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex h-[70vh] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
            <p className="mt-4 text-gray-500">Loading AbuPay...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Hero */}
        <HeroSection />

        {/* Referrals */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Referrals"
            value={user?.referralCount ?? 0}
            icon={Users}
            color="bg-purple-500"
          />
        </div>

        {/* Quick Actions */}
        <QuickActions />

        {/* Statistics + Network */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <StatisticsChart />
          </div>
          <NetworkStatus />
        </div>

        {/* Services */}
        <ServicesGrid />

        {/* Recent Transactions */}
        <TransactionsTable />
      </div>
    </DashboardLayout>
  );
}