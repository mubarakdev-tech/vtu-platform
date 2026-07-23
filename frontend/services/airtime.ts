import axios from "axios";

const API =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api";

export const buyAirtime = async (
  token: string,
  data: {
    network: string;
    phone: string;
    amount: number;
  }
) => {
  const res = await axios.post(
    `${API}/airtime/buy`,
    data,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return res.data;
};