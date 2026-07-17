"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";

export default function WalletPage() {
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWallet = async () => {
      try {
        const res = await api.get("/wallet");
        setBalance(res.data.balance);
      } catch (error) {
        console.error("Failed to fetch wallet:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWallet();
  }, []);

  if (loading) {
    return <div className="p-6">Loading wallet...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">My Wallet</h1>

      <div className="rounded-xl bg-white shadow p-6 border">
        <p className="text-gray-500">Available Balance</p>

        <h2 className="text-4xl font-bold text-green-600 mt-2">
          ₦{balance.toLocaleString()}
        </h2>
      </div>
    </div>
  );
}