export interface Transaction {
  _id: string;
  type: "CREDIT" | "DEBIT";
  category:
    | "WALLET_FUNDING"
    | "TRANSFER"
    | "AIRTIME"
    | "DATA"
    | "CABLE"
    | "ELECTRICITY"
    | "REFUND";
  amount: number;
  status: "PENDING" | "SUCCESS" | "FAILED";
  reference: string;
  description?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt?: string;
}

export interface TransactionsResponse {
  success: boolean;
  count: number;
  total: number;
  page: number;
  totalPages: number;
  transactions: Transaction[];
}