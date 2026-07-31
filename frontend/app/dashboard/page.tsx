import DashboardLayout from "@/components/dashboard/DashboardLayout";
import HeroSection from "@/components/dashboard/HeroSection";
import WalletCard from "@/components/dashboard/WalletCard";
import StatCard from "@/components/dashboard/StatCard";
import QuickActions from "@/components/dashboard/QuickActions";
import StatisticsChart from "@/components/dashboard/StatisticsChart";
import TransactionsTable from "@/components/dashboard/TransactionsTable";
import ServicesGrid from "@/components/dashboard/ServicesGrid";
import NetworkStatus from "@/components/dashboard/NetworkStatus";

import {
  Receipt,
  CheckCircle,
  Wallet,
  Gift,
} from "lucide-react";

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* Hero Banner */}
        <HeroSection />

        {/* Wallet */}
        <WalletCard />

        {/* Statistics */}
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

        {/* Transactions */}
        <TransactionsTable />

      </div>
    </DashboardLayout>
  );
}