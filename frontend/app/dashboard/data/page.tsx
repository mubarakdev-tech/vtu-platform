"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { getDataPlans, buyData } from "@/services/data";


interface Plan {
  name: string;
  variation_code: string;
  amount: number;
}


export default function DataPage() {

  const router = useRouter();


  const [network, setNetwork] = useState("mtn");

  const [plans, setPlans] = useState<Plan[]>([]);

  const [selectedPlan, setSelectedPlan] = useState("");

  const [phone, setPhone] = useState("");

  const [loadingPlans, setLoadingPlans] = useState(false);

  const [loadingPurchase, setLoadingPurchase] = useState(false);



  useEffect(() => {

    loadPlans();

  }, [network]);



  const loadPlans = async () => {

    const token = localStorage.getItem("token");


    if (!token) return;


    try {

      setLoadingPlans(true);


      const result = await getDataPlans(
        token,
        network
      );


      if (result.success) {

        setPlans(result.data);


        if (result.data.length > 0) {

          setSelectedPlan(
            result.data[0].variation_code
          );

        }


      } else {

        alert(result.message);

      }


    } catch (error: any) {

      alert(
        error.response?.data?.message ||
        "Unable to load plans."
      );


    } finally {

      setLoadingPlans(false);

    }

  };




  const handlePurchase = async () => {

    const token = localStorage.getItem("token");


    if (!token) {

      alert("Please login first.");

      return;

    }



    if (!phone || !selectedPlan) {

      alert("Complete all fields.");

      return;

    }



    const plan = plans.find(
      (p) =>
        p.variation_code === selectedPlan
    );



    if (!plan) {

      alert("Invalid plan selected.");

      return;

    }




    try {

      setLoadingPurchase(true);



      const result = await buyData(
        token,
        {
          network,
          phone,
          plan: selectedPlan,
          amount: plan.amount,
        }
      );



      if (result.success) {


        alert(
          "Data purchased successfully."
        );


        setPhone("");



        setTimeout(() => {

          router.push("/dashboard");

        }, 1500);



      } else {

        alert(
          result.message
        );

      }



    } catch (error: any) {


      alert(
        error.response?.data?.message ||
        "Purchase failed."
      );


    } finally {

      setLoadingPurchase(false);

    }

  };




  return (

    <div className="max-w-xl space-y-6">


      <h1 className="text-3xl font-bold">
        Buy Data
      </h1>



      <div className="rounded-xl border bg-white p-6 shadow space-y-4">


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




        <select
          value={selectedPlan}
          onChange={(e)=>setSelectedPlan(e.target.value)}
          className="w-full rounded-lg border p-3"
          disabled={loadingPlans}
        >

          {loadingPlans ? (

            <option>
              Loading plans...
            </option>


          ) : (

            plans.map((plan)=>(

              <option
                key={plan.variation_code}
                value={plan.variation_code}
              >

                {plan.name} - ₦
                {plan.amount.toLocaleString()}

              </option>

            ))

          )}


        </select>




        <input
          type="text"
          placeholder="Phone Number"
          value={phone}
          onChange={(e)=>setPhone(e.target.value)}
          className="w-full rounded-lg border p-3"
        />




        <button
          onClick={handlePurchase}
          disabled={loadingPurchase}
          className="w-full rounded-lg bg-blue-600 p-3 text-white font-semibold"
        >

          {loadingPurchase
            ? "Processing..."
            : "Buy Data"}

        </button>



      </div>


    </div>

  );

}