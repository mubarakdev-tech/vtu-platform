"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";

export default function WalletCard() {
  const [balance, setBalance] = useState<number>(0);

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
        console.log(error);
        setBalance(0);
      }
    };

    getWallet();
  }, []);

  return (
    <Card>
      <CardContent className="p-6">

        <p className="text-sm text-muted-foreground">
          Available Balance
        </p>

        <h2 className="mt-2 text-4xl font-bold">
          ₦{(balance ?? 0).toLocaleString()}
        </h2>

        <p className="mt-2 text-sm text-muted-foreground">
          VTU Wallet
        </p>

      </CardContent>
    </Card>
  );
}