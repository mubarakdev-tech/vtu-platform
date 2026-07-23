import axios from "axios";

const API =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api";

export const getDataPlans = async (
  token: string,
  network: string
) => {
  const res = await axios.get(
    `${API}/data/plans/${network}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return res.data;
};

export const buyData = async (
  token: string,
  data: {
    network: string;
    phone: string;
    plan: string;
    amount: number;
  }
) => {
  const res = await axios.post(
    `${API}/data/buy`,
    data,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return res.data;
};