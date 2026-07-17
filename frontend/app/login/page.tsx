"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.replace("/login");
    }
  }, [router]);

  const user =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("user") || "{}")
      : {};

  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold">
        Welcome, {user.name || "User"} 👋
      </h1>

      <p className="mt-3 text-gray-600">
        Welcome to your VTU Platform dashboard.
      </p>
    </DashboardLayout>
  );
}