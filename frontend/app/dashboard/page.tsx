import DashboardLayout from "@/components/dashboard/DashboardLayout";
import WalletCard from "@/components/dashboard/WalletCard";
import StatCard from "@/components/dashboard/StatCard";
import QuickActions from "@/components/dashboard/QuickActions";
import StatisticsChart from "@/components/dashboard/StatisticsChart";
import TransactionsTable from "@/components/dashboard/TransactionsTable";
import ServicesGrid from "@/components/dashboard/ServicesGrid";

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">

        <WalletCard />

        <div className="grid gap-4 md:grid-cols-3">
          <StatCard
            title="Total Transactions"
            value="0"
          />

          <StatCard
            title="Successful"
            value="0"
          />

          <StatCard
            title="Failed"
            value="0"
          />
        </div>

        <QuickActions />

        <StatisticsChart />

        <TransactionsTable />

        <ServicesGrid />

      </div>
    </DashboardLayout>
  );
}