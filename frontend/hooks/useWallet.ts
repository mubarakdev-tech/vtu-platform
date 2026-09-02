"use client";

import { useEffect, useState } from "react";
import { getWallet } from "@/services/wallet.service";

export default function useWallet() {
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadWallet = async () => {
    try {
      setLoading(true);

      const response = await getWallet();

      // Support both response shapes
      const realBalance = Number(
        response?.data?.balance ??
          response?.balance ??
          response?.data?.data?.balance ??
          0
      );

      setBalance(Number.isFinite(realBalance) ? realBalance : 0);
    } catch (error) {
      console.error("Wallet error:", error);
      setBalance(0);
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