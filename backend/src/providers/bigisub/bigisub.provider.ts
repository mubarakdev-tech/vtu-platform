
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
// EXISTING GENERAL PURCHASE CLASSIFIER
// KEPT FOR AIRTIME COMPATIBILITY
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
// CLASSIFY BIGISUB DATA PURCHASE RESPONSE
// =====================================================

const classifyDataPurchaseResponse = (response: any) => {
  const purchaseData = response?.data;

  const status = String(
    purchaseData?.status ?? response?.status ?? ""
  )
    .toLowerCase()
    .trim();

  const successfulStatuses = [
    "success",
    "successful",
    "completed",
  ];

  const pendingStatuses = [
    "processing",
    "submitted",
    "pending",
    "in_progress",
    "in progress",
  ];

  const failedStatuses = [
    "failed",
    "failure",
    "rejected",
    "declined",
  ];

  const success = successfulStatuses.includes(status);
  const pending = pendingStatuses.includes(status);
  const confirmedFailure = failedStatuses.includes(status);
  const uncertain = !success && !pending && !confirmedFailure;

  return {
    success,
    pending: pending || uncertain,
    status: success
      ? ("SUCCESS" as const)
      : confirmedFailure
        ? ("FAILED" as const)
        : ("UNCERTAIN" as const),
    uncertain,
    message:
      purchaseData?.status_message ||
      response?.message ||
      (success
        ? "Purchase successful"
        : pending
          ? "Purchase is processing"
          : confirmedFailure
            ? "Purchase failed"
            : "Purchase outcome requires verification"),
    data: response,
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

    const result = classifyDataPurchaseResponse(data);

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
// GET BIGISUB WALLET BALANCE
// =====================================================

export const getBalance = async () => {
  try {
    const response = await bigisubClient.get(
      "/financial/wallet/balance/"
    );

    const rawBalance = response.data?.data?.balance;
    const hasNumericType =
      typeof rawBalance === "number" ||
      typeof rawBalance === "string";

    const hasValidBalance =
      hasNumericType &&
      !(typeof rawBalance === "string" && rawBalance.trim() === "") &&
      Number.isFinite(Number(rawBalance));

    const balance = hasValidBalance ? Number(rawBalance) : null;

    if (
      response.data?.success !== true ||
      balance === null
    ) {
      return {
        success: false,
        message: "BigiSub returned an invalid wallet balance.",
        provider: "bigisub",
      };
    }

    return {
      success: true,
      balance,
      message: "BigiSub wallet balance retrieved successfully.",
      provider: "bigisub",
    };
  } catch (error: any) {
    console.error(
      "BIGISUB WALLET BALANCE ERROR:",
      error?.response?.status || error?.message || "Request failed"
    );

    return {
      success: false,
      message:
        error?.response?.data?.message ||
        "Unable to retrieve BigiSub wallet balance.",
      provider: "bigisub",
    };
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
  getBalance,
};
