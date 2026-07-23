"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { buyAirtime } from "@/services/airtime";

export default function AirtimePage() {

  const router = useRouter();

  const [network, setNetwork] = useState("mtn");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");


  const quickAmounts = [100, 200, 500, 1000];


  const handlePurchase = async () => {

    const token = localStorage.getItem("token");


    if (!token) {
      setMessage("Please login first.");
      return;
    }


    if (!phone || !amount) {
      setMessage("Please complete all fields.");
      return;
    }


    try {

      setLoading(true);
      setMessage("");


      const result = await buyAirtime(token, {
        network,
        phone,
        amount: Number(amount),
      });


      if (result.success) {

        setMessage(
          "Airtime purchased successfully."
        );


        setPhone("");
        setAmount("");


        setTimeout(() => {

          router.push("/dashboard");

        }, 1500);


      } else {

        setMessage(
          result.message || "Purchase failed."
        );

      }


    } catch (error: any) {

      setMessage(
        error.response?.data?.message ||
        "Purchase failed."
      );


    } finally {

      setLoading(false);

    }

  };


  return (

    <div className="max-w-xl space-y-6">


      <h1 className="text-3xl font-bold">
        Buy Airtime
      </h1>


      <div className="rounded-xl border bg-white p-6 shadow space-y-5">


        <select
          value={network}
          onChange={(e)=>setNetwork(e.target.value)}
          className="w-full rounded-lg border p-3"
        >

          <option value="mtn">
            MTN
          </option>

          <option value="airtel">
            Airtel
          </option>

          <option value="glo">
            Glo
          </option>

          <option value="9mobile">
            9mobile
          </option>

        </select>


        <input
          type="text"
          placeholder="Phone Number"
          value={phone}
          onChange={(e)=>setPhone(e.target.value)}
          className="w-full rounded-lg border p-3"
        />


        <div className="grid grid-cols-4 gap-2">

          {quickAmounts.map((item)=>(

            <button
              key={item}
              onClick={()=>setAmount(String(item))}
              className="rounded-lg border p-2 hover:bg-gray-100"
            >
              ₦{item}
            </button>

          ))}

        </div>


        <input
          type="number"
          placeholder="Amount"
          value={amount}
          onChange={(e)=>setAmount(e.target.value)}
          className="w-full rounded-lg border p-3"
        />


        <button
          onClick={handlePurchase}
          disabled={loading}
          className="w-full rounded-lg bg-blue-600 p-3 text-white font-semibold"
        >

          {loading
            ? "Processing..."
            : "Buy Airtime"}

        </button>


        {message && (

          <p className="text-center text-sm">
            {message}
          </p>

        )}


      </div>


    </div>

  );
}