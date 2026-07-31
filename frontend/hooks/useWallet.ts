import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Wallet } from "@/types/wallet";

export default function useWallet() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWallet = async () => {
      try {
        const response = await api.get("/wallet");

        setWallet(response.data);

      } catch (error) {
        console.error("Wallet error:", error);

      } finally {
        setLoading(false);
      }
    };

    fetchWallet();

  }, []);

  return {
    wallet,
    loading,
  };
}