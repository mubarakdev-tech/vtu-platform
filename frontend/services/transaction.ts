import axios from "axios";

const API =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api";

export const getTransactions = async (token: string) => {
  const res = await axios.get(`${API}/transactions`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.data;
};