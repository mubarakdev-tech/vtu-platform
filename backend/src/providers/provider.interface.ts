// ==========================================
// ABUPAY PROVIDER INTERFACE
// ==========================================

export interface AirtimePurchaseRequest {
  network: string;
  phone: string;
  amount: number;
  provider: string;
}

export interface DataPurchaseRequest {
  network: string;
  phone: string;
  plan: string;
  amount: number;
  provider?: string;
}

export interface DataPlan {
  name: string;
  variation_code: string;
  amount: number;
  provider?: string;
  raw?: any;
}

export type ProviderTransactionStatus =
  | "SUCCESS"
  | "FAILED"
  | "UNCERTAIN";

export interface ProviderResponse {
  success: boolean;

  message: string;

  status?: ProviderTransactionStatus;

  data?: any;

  request_id?: string;

  provider?: string;

  retryable?: boolean;

  uncertain?: boolean;

  providerReference?: string;

  providerStatus?: string;
}

export interface VTUProvider {
  // IMPORTANT:
  // Every registered provider must have a key.
  key: string;

  displayName?: string;

  buyAirtime(
    request: AirtimePurchaseRequest
  ): Promise<ProviderResponse>;

  buyData(
    request: DataPurchaseRequest
  ): Promise<ProviderResponse>;

  getDataPlans?(
    network: string
  ): Promise<DataPlan[]>;

  checkTransactionStatus?(
    requestId: string
  ): Promise<ProviderResponse>;
}