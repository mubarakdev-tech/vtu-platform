import DashboardLayout from "@/components/dashboard/DashboardLayout";

export default function DashboardPage() {
  return (
    <DashboardLayout>

      <h1 className="text-3xl font-bold">
        Dashboard
      </h1>

      <p className="mt-3 text-gray-600">
        Welcome to your VTU Platform dashboard.
      </p>

    </DashboardLayout>
  );
}