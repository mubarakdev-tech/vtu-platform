import axios from "axios";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export const getWallet = async (token: string) => {
  const res = await axios.get(`${API}/wallet/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.data;
};

export const fundWallet = async (
  token: string,
  amount: number
) => {
  const res = await axios.post(
    `${API}/wallet/fund`,
    { amount },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return res.data;
};