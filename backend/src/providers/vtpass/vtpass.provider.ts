import {
  AirtimePayload,
  DataPayload,
  ElectricityPayload,
  IVtuProvider,
  ProviderResponse,
} from "../../interfaces/vtuProvider.interface";

export class VTpassProvider implements IVtuProvider {
  async buyAirtime(payload: AirtimePayload): Promise<ProviderResponse> {
    return {
      success: true,
      message: "Airtime purchase successful",
      reference: `AIR-${Date.now()}`,
      data: payload,
    };
  }

  async buyData(payload: DataPayload): Promise<ProviderResponse> {
    return {
      success: true,
      message: "Data purchase successful",
      reference: `DATA-${Date.now()}`,
      data: payload,
    };
  }

  async buyElectricity(
    payload: ElectricityPayload
  ): Promise<ProviderResponse> {
    return {
      success: true,
      message: "Electricity purchase successful",
      reference: `ELE-${Date.now()}`,
      data: {
        ...payload,
        token: "12345678901234567890",
      },
    };
  }
}