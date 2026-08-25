import api from "@/lib/api";

/**
 * Get current wallet
 *
 * Authentication is handled automatically
 * through the HttpOnly authentication cookie.
 */
export const getWallet = async () => {
  const res = await api.get("/wallet");

  return res.data;
};

/**
 * Initialize Paystack wallet funding
 *
 * Authentication is handled automatically
 * through the HttpOnly authentication cookie.
 */
export const initializeFunding = async (
  amount: number
) => {
  const res = await api.post(
    "/wallet/fund/initialize",
    {
      amount,
    }
  );

  return res.data;
};

/**
 * Verify Paystack wallet funding
 *
 * Authentication is handled automatically
 * through the HttpOnly authentication cookie.
 */
export const verifyFunding = async (
  reference: string
) => {
  const res = await api.post(
    "/wallet/fund/verify",
    {
      reference,
    }
  );

  return res.data;
};