import api from "@/lib/api";

export const getDataPlans = async (network: string) => {
  const { data } = await api.get(`/data/plans/${network}`);
  return data;
};

export const buyData = async (payload: {
  network: string;
  phone: string;
  plan: string;
}) => {
  const { data } = await api.post("/data/buy", payload);
  return data;
};
export const buyBulkData = async (payload: {
  recipients: {
    network: string;
    phone: string;
    plan: string;
  }[];
}) => {
  const { data } = await api.post("/bulk/data", payload);
  return data;
};
