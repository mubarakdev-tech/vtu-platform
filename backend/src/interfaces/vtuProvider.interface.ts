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
  reference: string;
  data?: any;
}

export interface IVtuProvider {
  buyAirtime(payload: AirtimePayload): Promise<ProviderResponse>;

  buyData(payload: DataPayload): Promise<ProviderResponse>;

  buyElectricity(
    payload: ElectricityPayload
  ): Promise<ProviderResponse>;
}