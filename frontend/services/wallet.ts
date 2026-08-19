import axios from "axios";

const API =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api";

/**
 * Get current wallet
 */
export const getWallet = async (token: string) => {
  const res = await axios.get(`${API}/wallet`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.data;
};

/**
 * Initialize Paystack wallet funding
 */
export const initializeFunding = async (
  token: string,
  amount: number
) => {
  const res = await axios.post(
    `${API}/wallet/fund/initialize`,
    {
      amount,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return res.data;
};

/**
 * Verify Paystack wallet funding
 */
export const verifyFunding = async (
  token: string,
  reference: string
) => {
  const res = await axios.post(
    `${API}/wallet/fund/verify`,
    {
      reference,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return res.data;
};