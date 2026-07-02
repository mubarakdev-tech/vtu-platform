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
      <div className="space-y-8">
        <WalletCard />

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Today's Transactions" value="15" />
          <StatCard title="Revenue" value="₦85,000" />
          <StatCard title="Successful" value="98%" />
          <StatCard title="Pending" value="3" />
        </div>

        <QuickActions />

        <StatisticsChart />

        <TransactionsTable />

        <ServicesGrid />
      </div>
    </DashboardLayout>
  );
}