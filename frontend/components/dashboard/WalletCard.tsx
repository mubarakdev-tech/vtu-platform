"use client";

import {
  Wallet,
  ArrowDownCircle,
  Send,
  History,
  Eye,
} from "lucide-react";
import CountUp from "react-countup";
import { useState } from "react";
import useWallet from "@/hooks/useWallet";

export default function WalletCard() {
  const { balance, loading } = useWallet();
  const [showBalance, setShowBalance] = useState(true);

  return (
    <div className="overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500 p-8 text-white shadow-2xl">

      <div className="flex items-start justify-between">

        <div>

          <div className="flex items-center gap-2">

            <Wallet size={24} />

            <span className="text-lg font-medium">
              AbuPay Wallet
            </span>

          </div>

          <div className="mt-5 flex items-center gap-3">

            <h2 className="text-5xl font-bold">

              {loading ? (
                "Loading..."
              ) : showBalance ? (
                <>
                  ₦
                  <CountUp
                    end={balance}
                    duration={1.5}
                    separator=","
                  />
                </>
              ) : (
                "₦ ••••••"
              )}

            </h2>

            <button
              onClick={() =>
                setShowBalance(!showBalance)
              }
              className="rounded-full bg-white/10 p-2 hover:bg-white/20"
            >
              <Eye size={18} />
            </button>

          </div>

          <p className="mt-2 text-sm text-white/80">
            Available Balance
          </p>

        </div>

        <Wallet
          size={90}
          className="hidden opacity-20 md:block"
        />

      </div>

      <div className="mt-8 grid grid-cols-3 gap-4">

        <button className="rounded-xl bg-white/15 p-4 transition hover:bg-white/25">

          <ArrowDownCircle className="mx-auto mb-2" />

          <p className="text-sm font-medium">
            Fund Wallet
          </p>

        </button>

        <button className="rounded-xl bg-white/15 p-4 transition hover:bg-white/25">

          <Send className="mx-auto mb-2" />

          <p className="text-sm font-medium">
            Transfer
          </p>

        </button>

        <button className="rounded-xl bg-white/15 p-4 transition hover:bg-white/25">

          <History className="mx-auto mb-2" />

          <p className="text-sm font-medium">
            History
          </p>

        </button>

      </div>

    </div>
  );
}