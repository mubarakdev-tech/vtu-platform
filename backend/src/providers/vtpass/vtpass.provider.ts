import { v4 as uuid } from "uuid";
import { vtpassClient } from "./vtpass.client";

export interface AirtimePayload {
  network: string;
  phone: string;
  amount: number;
}

export interface DataPayload {
  network: string;
  phone: string;
  plan: string;
  amount: number;
}

export interface ElectricityPayload {
  disco: string;
  meterNumber: string;
  meterType: "prepaid" | "postpaid";
  amount: number;
  phone: string;
}

export interface ProviderResponse {
  success: boolean;
  message: string;
  reference?: string;
  data?: any;
}


export class VTpassProvider {


  async buyAirtime(
    payload: AirtimePayload
  ): Promise<ProviderResponse> {

    try {

      const requestId = uuid()
        .replace(/-/g, "")
        .slice(0, 20);


      const response = await vtpassClient.post("/pay", {

        request_id: requestId,
        serviceID: payload.network.toLowerCase(),
        amount: payload.amount,
        phone: payload.phone,

      });


      return {

        success: response.data.code === "000",
        message: response.data.response_description,
        reference: requestId,
        data: response.data,

      };


    } catch (error: any) {

      return {

        success: false,

        message:
          error.response?.data?.response_description ??
          error.response?.data?.message ??
          error.message ??
          "VTpass request failed",

      };

    }

  }



  async buyData(
    payload: DataPayload
  ): Promise<ProviderResponse> {


    console.log("🔥 BUY DATA FUNCTION ENTERED");
    console.log("DATA PAYLOAD:", payload);


    try {

      const requestId = uuid()
        .replace(/-/g, "")
        .slice(0, 20);


      const response = await vtpassClient.post("/pay", {

        request_id: requestId,

        serviceID: `${payload.network.toLowerCase()}-data`,

        variation_code: payload.plan,

        amount: payload.amount,

        phone: payload.phone,

      });



      console.log(
        "🔥 VTPASS RESPONSE:",
        response.data
      );


      return {

        success: response.data.code === "000",

        message: response.data.response_description,

        reference: requestId,

        data: response.data,

      };


    } catch (error: any) {


      console.log(
        "🔥 VTPASS DATA ERROR:",
        error.response?.data || error.message
      );


      return {

        success: false,

        message:
          error.response?.data?.response_description ??
          error.response?.data?.message ??
          error.message ??
          "VTpass request failed",

      };

    }

  }



  async getDataPlans(
    network: string
  ): Promise<ProviderResponse> {


    try {


      const serviceID =
        `${network.toLowerCase()}-data`;


      console.log(
        "🔥 FETCHING DATA PLANS:",
        serviceID
      );



      const response =
        await vtpassClient.get(
          `/service-variations?serviceID=${serviceID}`
        );



      const variations =
        response.data.content?.variations || [];



      return {

        success: true,

        message: "Data plans fetched successfully",


        data: variations.map((item: any) => ({

          name: item.name,

          variation_code:
            item.variation_code,

          amount:
            Number(item.variation_amount),

        })),

      };



    } catch (error: any) {


      console.log(
        "🔥 FETCH PLANS ERROR:",
        error.response?.data || error.message
      );


      return {

        success: false,

        message:
          error.response?.data?.message ??
          "Unable to fetch data plans",

      };

    }

  }



  async buyElectricity(
    payload: ElectricityPayload
  ): Promise<ProviderResponse> {

    throw new Error(
      "buyElectricity() not implemented yet."
    );

  }


}


export const vtpassProvider = new VTpassProvider();