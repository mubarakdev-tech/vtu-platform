export interface DataPlanResult {
  name: string;
  variationCode: string;
  amount: number;
  validity?: string;
  dataType?: string;
  raw?: any;
}

export interface DataPurchaseRequest {
  network: string;
  phone: string;
  planCode: string;
  amount: number;
}

export interface DataPurchaseResult {
  success: boolean;
  message: string;

  /**
   * Provider transaction/request reference.
   */
  requestId?: string;

  /**
   * Provider transaction reference where available.
   */
  transactionId?: string;

  /**
   * Actual provider response.
   */
  data?: any;

  /**
   * Actual amount charged by the provider,
   * when available.
   */
  providerCost?: number;
}

export interface DataProvider {
  /**
   * Internal provider key.
   *
   * Example:
   * vtpass
   * bigisub
   * vtu-com-ng
   */
  readonly key: string;

  /**
   * Fetch plans from the provider.
   */
  getDataPlans(
    network: string,
    dataType?: string
  ): Promise<DataPlanResult[]>;

  /**
   * Purchase data from the provider.
   */
  buyData(
    request: DataPurchaseRequest
  ): Promise<DataPurchaseResult>;
}