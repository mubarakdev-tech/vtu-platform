console.log("******** NEW DATA SERVICE LOADED ********");

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


  console.log("========== DATA PURCHASE START ==========");


  console.log({
    userId,
    network,
    phone,
    plan,
    amount,
  });



  try {


    /**
     * STEP 1
     * Debit wallet
     */
    const wallet =
      await debitWallet({
        userId,
        amount,
      });



    console.log("✅ Wallet debited");

    console.log(
      "Wallet Balance:",
      wallet.balance
    );




    /**
     * STEP 2
     * Send request to VTpass
     */
    const providerResponse =
      await vtpassProvider.buyData({

        network,

        phone,

        plan,

        amount,

      });



    console.log(
      "🔥 VTpass Response:"
    );


    console.log(
      JSON.stringify(
        providerResponse,
        null,
        2
      )
    );




    /**
     * STEP 3
     * Check VTpass result
     */
    if (!providerResponse.success) {


      console.log(
        "❌ VTpass purchase failed"
      );


      console.log(
        "Reason:",
        providerResponse.message
      );



      throw new Error(
        providerResponse.message ||
        "VTpass transaction failed"
      );

    }





    /**
     * STEP 4
     * Save successful transaction
     */
    const transaction =
      await createTransaction({


        userId,


        type:
          "DEBIT",


        category:
          "DATA",


        amount,


        status:
          "SUCCESS",



        description:
          `Purchased ${network.toUpperCase()} data for ${phone}`,



        metadata: {


          network,


          phone,


          plan,


          providerResponse:
            providerResponse.data,


        },


      });




    console.log(
      "✅ Transaction saved"
    );





    return {


      success:true,



      message:
        providerResponse.message,



      data:{


        walletBalance:
          wallet.balance,


        transaction,



        provider:
          providerResponse.data,


      },


    };




  } catch(error:any) {



    console.log(
      "❌ DATA PURCHASE ERROR"
    );


    console.log(
      "MESSAGE:",
      error.message
    );



    console.log(
      "FULL ERROR:",
      error
    );



    throw new Error(
      error.message ||
      "Transaction failed"
    );


  }


};