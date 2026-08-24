import api from "@/lib/api";

export const buyAirtime = async (data: {
  network: string;
  phone: string;
  amount: number;
  provider?: string;
}) => {
  const { data: response } = await api.post("/airtime/buy", data);
  return response;
};