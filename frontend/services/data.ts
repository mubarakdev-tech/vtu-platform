import api from "@/lib/api";

export const getDataPlans = async (network: string, provider = "vtpass") => {
  const { data } = await api.get(`/data/plans/${network}`, {
    params: { provider },
  });
  return data;
};

export const buyData = async (payload: {
  network: string;
  phone: string;
  plan: string;
  amount: number;
  provider?: string;
}) => {
  const { data } = await api.post("/data/buy", payload);
  return data;
};