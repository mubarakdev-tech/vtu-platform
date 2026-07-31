export interface Transaction {
  id: string;
  type: string;
  amount: number;
  status: string;
  reference: string;
  createdAt: string;
}