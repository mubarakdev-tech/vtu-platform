import api from "@/lib/api";

// ==========================================
// GET WALLET
// ==========================================

export const getWallet = async () => {
  const { data } = await api.get("/wallet");

  return data;
};

// ==========================================
// CALCULATE FUNDING FEE
// ==========================================
//
// Gets the estimated Paystack customer fee
// from the backend before payment.
//
// Example:
// /wallet/fund/fee?amount=1000
//
// ==========================================

export const calculateFundingFee = async (
  amount: number
) => {
  const cleanAmount = Math.round(
    Number(amount)
  );

  if (
    !Number.isFinite(cleanAmount) ||
    cleanAmount <= 0
  ) {
    throw new Error(
      "Funding amount must be a valid number greater than zero."
    );
  }

  const { data } = await api.get(
    "/wallet/fund/fee",
    {
      params: {
        amount: cleanAmount,
      },
    }
  );

  return data;
};

// ==========================================
// INITIALIZE FUNDING
// ==========================================

export const initializeFunding = async (
  amount: number
) => {
  const cleanAmount = Math.round(
    Number(amount)
  );

  if (
    !Number.isFinite(cleanAmount) ||
    cleanAmount <= 0
  ) {
    throw new Error(
      "Funding amount must be a valid number greater than zero."
    );
  }

  const { data } = await api.post(
    "/wallet/fund/initialize",
    {
      amount: cleanAmount,
    }
  );

  return data;
};

// ==========================================
// VERIFY FUNDING
// ==========================================

export const verifyFunding = async (
  reference: string
) => {
  if (!reference) {
    throw new Error(
      "Payment reference is missing."
    );
  }

  const { data } = await api.post(
    "/wallet/fund/verify",
    {
      reference,
    }
  );

  return data;
};