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
      const requestId = uuid().replace(/-/g, "").slice(0, 20);

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
          error.message ??
          "VTpass request failed",
      };
    }
  }

  async buyData(
    payload: DataPayload
  ): Promise<ProviderResponse> {
    throw new Error("buyData() not implemented yet.");
  }

  async buyElectricity(
    payload: ElectricityPayload
  ): Promise<ProviderResponse> {
    throw new Error("buyElectricity() not implemented yet.");
  }
}

export const vtpassProvider = new VTpassProvider();