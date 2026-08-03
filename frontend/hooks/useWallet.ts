"use client";

import { useEffect, useState } from "react";
import { getWallet } from "@/services/wallet.service";

export default function useWallet() {
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadWallet = async () => {
    try {
      const response = await getWallet();

      setBalance(Number(response.balance ?? 0));
    } catch (error) {
      console.error("Wallet error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWallet();
  }, []);

  return {
    balance,
    loading,
    refreshWallet: loadWallet,
  };
}