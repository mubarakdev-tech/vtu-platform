import api from "@/lib/api";

export const buyAirtime = async (data: {
  network: string;
  phone: string;
  amount: number;
}) => {
  const { data: response } = await api.post("/airtime/buy", data);
  return response;
};
export const buyBulkAirtime = async (data: {
  recipients: {
    network: string;
    phone: string;
    amount: number;
  }[];
}) => {
  const { data: response } = await api.post("/bulk/airtime", data);
  return response;
};