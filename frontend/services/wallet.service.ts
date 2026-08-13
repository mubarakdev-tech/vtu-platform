import api from "@/lib/api";

export const getWallet = async () => {
  const { data } = await api.get("/wallet");
  return data;
};

export const initializeFunding = async (amount: number) => {
  const { data } = await api.post("/wallet/fund/initialize", { amount });
  return data;
};

export const verifyFunding = async (reference: string) => {
  const { data } = await api.post("/wallet/fund/verify", { reference });
  return data;
};