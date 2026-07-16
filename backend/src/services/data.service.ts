import mongoose from "mongoose";
import AppError from "../utils/apperror";

import { vtpassProvider } from "../providers/vtpass/vtpass.provider";
import { debitWallet } from "./wallet.service";
import { createTransaction } from "./transaction.service";


interface PurchaseDataPayload {

  userId: string;
  network: string;
  phone: string;
  plan: string;
  amount: number;

}



export const purchaseData = async ({
  userId,
  network,
  phone,
  plan,
  amount,
}: PurchaseDataPayload) => {


  if (!amount || amount <= 0) {

    throw new AppError(
      "Invalid data amount",
      400
    );

  }



  const session = await mongoose.startSession();



  try {


    let result:any;



    await session.withTransaction(async()=>{



      console.log(
        "CHECKING DATA PLAN BEFORE PURCHASE"
      );



      // Check plan exists
      const plans =
        await vtpassProvider.getDataPlans(
          network
        );



      if(!plans.success){

        throw new AppError(
          plans.message,
          400
        );

      }



      const selectedPlan =
        plans.data.find(
          (item:any)=>
            item.variation_code === plan
        );



      if(!selectedPlan){

        throw new AppError(
          "Invalid data plan selected",
          400
        );

      }



      console.log(
        "VALID PLAN:",
        selectedPlan
      );



      // Use VTpass price
      const finalAmount =
        selectedPlan.amount;



      // Debit wallet

      const wallet =
        await debitWallet({

          userId,

          amount: finalAmount,

          session,

        });



      // Purchase from VTpass

      const providerResponse =
        await vtpassProvider.buyData({

          network,

          phone,

          plan,

          amount:finalAmount,

        });



      if(!providerResponse.success){

        throw new AppError(
          providerResponse.message,
          400
        );

      }




      const transaction =
        await createTransaction({

          userId,

          type:"DEBIT",

          category:"DATA",

          amount:finalAmount,

          status:"SUCCESS",

          description:
          `${network.toUpperCase()} Data Purchase`,

          metadata:{

            network,

            phone,

            plan,

            providerResponse,

          },

          session,

        });




      result={

        success:true,

        message:
        "Data purchase successful",

        walletBalance:
        wallet.balance,

        transaction,

        providerResponse,

      };



    });



    return result;



  }finally{


    await session.endSession();


  }


};