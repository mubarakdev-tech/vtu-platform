
import bigisubClient from "./bigisub.client";

// =====================================================
// NETWORK MAP
// =====================================================

const networkMap: Record<string, number> = {
  mtn: 1,
  glo: 2,
  airtel: 3,
  "9mobile": 4,
  etisalat: 4,
};

// =====================================================
// GET NETWORK ID
// =====================================================

const getNetworkId = (network: string): number => {
  const key = String(network).toLowerCase().trim();
  const networkId = networkMap[key];

  if (!networkId) {
    throw new Error(`Unsupported network: ${network}`);
  }

  return networkId;
};

// =====================================================
// ADD PIN WHEN AVAILABLE
// =====================================================

const withPin = (payload: Record<string, any>) => {
  const pin = process.env.BIGISUB_PIN?.trim();

  if (pin) {
    payload.pin = pin;
    payload.pin_code = pin;
  }

  return payload;
};

// =====================================================
// CLASSIFY PROVIDER PURCHASE RESPONSE
// =====================================================

const classifyPurchaseResponse = (data: any) => {
  const status = String(data?.status || "")
    .toLowerCase()
    .trim();

  const success =
    data?.success === true ||
    status === "successful" ||
    status === "completed";

  const pending = [
    "processing",
    "submitted",
    "pending",
    "in_progress",
  ].includes(status);

  // Only these statuses are treated as confirmed failure.
  // Confirm their meanings against BigiSub's API documentation.
  const confirmedFailure = [
    "failed",
    "failure",
    "rejected",
    "declined",
  ].includes(status);

  const uncertain = !success && !confirmedFailure;

  return {
    success,
    pending,
    status: success
      ? ("SUCCESS" as const)
      : confirmedFailure
        ? ("FAILED" as const)
        : ("UNCERTAIN" as const),
    uncertain,
    message:
      data?.message ||
      (success
        ? "Purchase successful"
        : pending
          ? "Purchase is processing"
          : confirmedFailure
            ? "Purchase failed"
            : "Purchase outcome requires verification"),
    data,
    provider: "bigisub",
  };
};

// =====================================================
// CLASSIFY PROVIDER REQUEST ERROR
// =====================================================

const classifyPurchaseError = (error: any) => {
  const providerResponse = error?.response?.data;

  console.error(
    "BIGISUB PURCHASE ERROR:",
    providerResponse || error?.message || error
  );

  // A request error does not prove that the provider failed
  // to fulfil the purchase. Keep the outcome uncertain.
  return {
    success: false,
    pending: true,
    status: "UNCERTAIN" as const,
    uncertain: true,
    message:
      providerResponse?.message ||
      providerResponse?.detail ||
      "The provider outcome could not be confirmed. Verification is required before retrying or refunding.",
    data: providerResponse,
    provider: "bigisub",
  };
};

// =====================================================
// GET LIVE BIGISUB DATA PLANS
// =====================================================

export const getDataPlans = async (network: string) => {
  const networkId = getNetworkId(network);

  try {
    const response = await bigisubClient.get("/vtu/data/plans/", {
      params: {
        network: networkId,
      },
    });

    const rawPlans = Array.isArray(response.data?.data)
      ? response.data.data
      : [];

    const plans = rawPlans
      .filter((item: any) => {
        return (
          item &&
          item.id &&
          !item.plan_disabled &&
          Number(item.amount) > 0
        );
      })
      .map((item: any) => ({
        name: `${item.size}${item.plan_volume} - ${item.plantype} - ${item.validity}`,
        variation_code: String(item.id),
        amount: Number(item.amount),
        plan_id: Number(item.id),
        network: item.network,
        network_name: item.network_name,
        plantype: item.plantype,
        size: item.size,
        plan_volume: item.plan_volume,
        validity: item.validity,
        provider_amount: Number(item.amount),
        corporate_amount:
          item.corporate_amount !== undefined
            ? Number(item.corporate_amount)
            : undefined,
      }));

    console.log("========== BIGISUB DATA PLANS ==========");
    console.log("Network:", network);
    console.log("Network ID:", networkId);
    console.log("Plans received:", plans.length);

    return plans;
  } catch (error: any) {
    console.error(
      "BIGISUB GET DATA PLANS ERROR:",
      error?.response?.data || error?.message || error
    );

    throw error;
  }
};

// =====================================================
// BUY BIGISUB DATA
// =====================================================
//
// BigiSub expects plan to be the numeric plan ID returned
// by /vtu/data/plans/.
// =====================================================

export const buyData = async ({
  network,
  phone,
  plan,
  amount,
}: {
  network: string;
  phone: string;
  plan: string;
  amount: number;
}) => {
  const networkId = getNetworkId(network);
  const planId = Number(plan);

  if (!Number.isInteger(planId) || planId <= 0) {
    return {
      success: false,
      pending: false,
      status: "FAILED" as const,
      uncertain: false,
      message: "Invalid BigiSub data plan ID",
      provider: "bigisub",
    };
  }

  const payload = withPin({
    network: networkId,
    plan: planId,
    phone_number: phone.trim(),
    amount: Number(amount),
  });

  console.log("========== BIGISUB DATA PURCHASE ==========");
  console.log("Network:", network);
  console.log("Network ID:", networkId);
  console.log("Plan ID:", planId);
  console.log("Phone:", phone.trim());
  console.log("Amount:", Number(amount));

  try {
    const response = await bigisubClient.post(
      "/vtu/data/purchase/",
      payload
    );

    const data = response.data;

    console.log(
      "BIGISUB DATA PURCHASE RESPONSE:",
      JSON.stringify(data, null, 2)
    );

    const result = classifyPurchaseResponse(data);

    return {
      ...result,
      message:
        result.message === "Purchase successful"
          ? "Data purchase successful"
          : result.message === "Purchase is processing"
            ? "Data purchase is processing"
            : result.message === "Purchase failed"
              ? "Data purchase failed"
              : result.message,
    };
  } catch (error: any) {
    return classifyPurchaseError(error);
  }
};

// =====================================================
// BUY BIGISUB AIRTIME
// =====================================================
//
// Existing endpoint and payload structure are preserved.
// =====================================================

export const buyAirtime = async ({
  network,
  phone,
  amount,
}: {
  network: string;
  phone: string;
  amount: number;
}) => {
  const networkId = getNetworkId(network);

  const payload = withPin({
    network: networkId,
    phone_number: phone.trim(),
    amount: Number(amount),
  });

  console.log("========== BIGISUB AIRTIME PURCHASE ==========");
  console.log("Network:", network);
  console.log("Network ID:", networkId);
  console.log("Phone:", phone.trim());
  console.log("Amount:", Number(amount));

  try {
    const response = await bigisubClient.post(
      "/vtu/airtime/purchase/",
      payload
    );

    const data = response.data;

    console.log(
      "BIGISUB AIRTIME PURCHASE RESPONSE:",
      JSON.stringify(data, null, 2)
    );

    const result = classifyPurchaseResponse(data);

    return {
      ...result,
      message:
        result.message === "Purchase successful"
          ? "Airtime purchase successful"
          : result.message === "Purchase is processing"
            ? "Airtime purchase is processing"
            : result.message === "Purchase failed"
              ? "Airtime purchase failed"
              : result.message,
    };
  } catch (error: any) {
    return classifyPurchaseError(error);
  }
};

// =====================================================
// BIGISUB PROVIDER
// =====================================================

export const bigisubProvider = {
  key: "bigisub",
  getDataPlans,
  buyData,
  buyAirtime,
};
