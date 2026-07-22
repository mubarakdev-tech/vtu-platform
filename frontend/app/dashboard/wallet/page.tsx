"use client";

import { useEffect, useState } from "react";

interface Wallet {
  balance: number;
}

export default function WalletPage() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWallet = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await fetch("http://localhost:5000/api/wallet", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        console.log("Wallet Response:", data);

        if (data.success) {
          setWallet({
            balance: data.balance,
          });
        }
      } catch (error) {
        console.error("Error fetching wallet:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWallet();
  }, []);

  if (loading) return <p>Loading...</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Wallet</h1>

      <div className="rounded-xl bg-white shadow p-6">
        <h2 className="text-gray-500">Available Balance</h2>

        <p className="text-4xl font-bold text-green-600">
          ₦{wallet ? wallet.balance.toLocaleString() : "0"}
        </p>
      </div>
    </div>
  );
}