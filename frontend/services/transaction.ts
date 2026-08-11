import api from "@/lib/api";
import { TransactionsResponse } from "@/types/transaction";

export interface TransactionFilters {
  page?: number;
  limit?: number;
  status?: string;
  category?: string;
  type?: string;
  search?: string;
}

export const getTransactions = async (
  filters: TransactionFilters = {}
): Promise<TransactionsResponse> => {
  const { data } = await api.get("/transactions", {
    params: filters,
  });
  return data;
};