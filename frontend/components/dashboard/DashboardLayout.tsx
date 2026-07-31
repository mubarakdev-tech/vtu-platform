import Sidebar from "./Sidebar";
import Header from "./Header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex">

        <Sidebar />

        <div className="flex flex-1 flex-col">

          <Header />

          <main className="flex-1 p-4 md:p-6 lg:p-8">
            {children}
          </main>

        </div>

      </div>
    </div>
  );
}