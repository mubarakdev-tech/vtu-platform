"use client";

import { useEffect, useState } from "react";
import { Wallet, ArrowDownCircle, Send, History } from "lucide-react";
import CountUp from "react-countup";

export default function WalletCard() {
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    const getWallet = async () => {
      try {
        const token = localStorage.getItem("token");

        const response = await fetch(
          "http://localhost:5000/api/wallet",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        setBalance(Number(data.wallet?.balance ?? 0));
      } catch (error) {
        console.error(error);
      }
    };

    getWallet();
  }, []);

  return (
    <div className="overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-600 via-green-500 to-teal-500 p-8 text-white shadow-2xl">

      <div className="flex items-center justify-between">

        <div>

          <div className="flex items-center gap-2">

            <Wallet size={24} />

            <span className="text-lg font-medium">
              Wallet Balance
            </span>

          </div>

          <h2 className="mt-4 text-5xl font-bold">

            ₦

            <CountUp
              end={balance}
              duration={1.8}
              separator=","
            />

          </h2>

          <p className="mt-2 text-white/80">
            Available Balance
          </p>

        </div>

        <div className="hidden md:block">

          <Wallet
            size={90}
            className="opacity-20"
          />

        </div>

      </div>

      <div className="mt-8 grid grid-cols-3 gap-4">

        <button className="rounded-xl bg-white/15 p-4 transition hover:bg-white/25">

          <ArrowDownCircle className="mx-auto mb-2" />

          <p className="text-sm">
            Fund Wallet
          </p>

        </button>

        <button className="rounded-xl bg-white/15 p-4 transition hover:bg-white/25">

          <Send className="mx-auto mb-2" />

          <p className="text-sm">
            Transfer
          </p>

        </button>

        <button className="rounded-xl bg-white/15 p-4 transition hover:bg-white/25">

          <History className="mx-auto mb-2" />

          <p className="text-sm">
            History
          </p>

        </button>

      </div>

    </div>
  );
}