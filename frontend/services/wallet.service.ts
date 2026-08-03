import api from "@/lib/api";

export const getWallet = async () => {
  const { data } = await api.get("/wallet");
  return data;
};

export const fundWallet = async (amount: number) => {
  const { data } = await api.post("/wallet/fund", {
    amount,
  });

  return data;
};