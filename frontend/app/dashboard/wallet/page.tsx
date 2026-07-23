"use client";

import { useEffect, useState } from "react";

interface Wallet {
  balance: number;
}

export default function WalletPage() {
  const [wallet, setWallet] = useState<Wallet>({
    balance: 0,
  });

  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [funding, setFunding] = useState(false);
  const [message, setMessage] = useState("");

  const token = localStorage.getItem("token");


  const fetchWallet = async () => {
    try {

      const res = await fetch(
        "http://localhost:5000/api/wallet",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      setWallet({
        balance: data.wallet?.balance || data.balance || 0,
      });

    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchWallet();
  }, []);


  const handleFundWallet = async () => {

    if (!amount) {
      setMessage("Enter amount");
      return;
    }


    try {

      setFunding(true);
      setMessage("");


      const res = await fetch(
        "http://localhost:5000/api/wallet/fund",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            amount: Number(amount),
          }),
        }
      );


      const data = await res.json();


      if (data.success) {

        setMessage("Wallet funded successfully");
        setAmount("");

        fetchWallet();

      } else {

        setMessage(
          data.message || "Funding failed"
        );

      }


    } catch(error){

      setMessage("Something went wrong");

    } finally {

      setFunding(false);

    }

  };


  if (loading)
    return <p>Loading...</p>;


  return (

    <div className="space-y-6">

      <h1 className="text-3xl font-bold">
        Wallet
      </h1>


      <div className="rounded-xl bg-white shadow p-6 space-y-5">

        <h2 className="text-gray-500">
          Available Balance
        </h2>


        <p className="text-4xl font-bold text-green-600">
          ₦{wallet.balance.toLocaleString()}
        </p>


        <input
          type="number"
          placeholder="Enter amount"
          value={amount}
          onChange={(e)=>setAmount(e.target.value)}
          className="w-full rounded-lg border p-3"
        />


        <button
          onClick={handleFundWallet}
          disabled={funding}
          className="w-full rounded-lg bg-green-600 p-3 text-white font-semibold"
        >

          {funding
            ? "Processing..."
            : "Fund Wallet"}

        </button>


        {message && (
          <p className="text-center">
            {message}
          </p>
        )}

      </div>

    </div>

  );
}