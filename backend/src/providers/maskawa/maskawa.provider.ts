import maskawaClient from "./maskawa.client";

// =====================================================
// NETWORK MAP
// =====================================================

const networkMap: Record<string, number> = {
  mtn: 1,
  glo: 2,
  "9mobile": 3,
  etisalat: 3,
  airtel: 4,
  smile: 5,
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
// CLASSIFY MASKAWA PURCHASE RESPONSE
// =====================================================

const classifyPurchaseResponse = (data: any) => {
  const status = String(data?.status || "")
    .toLowerCase()
    .trim();

  const success =
    data?.success === true ||
    status === "successful" ||
    status === "success" ||
    status === "completed";

  const confirmedFailure = [
    "failed",
    "failure",
    "rejected",
    "declined",
  ].includes(status);

  const pending = [
    "processing",
    "submitted",
    "pending",
    "in_progress",
  ].includes(status);

  return {
    success,
    pending,
    status: success
      ? ("SUCCESS" as const)
      : confirmedFailure
        ? ("FAILED" as const)
        : ("UNCERTAIN" as const),
    uncertain: !success && !confirmedFailure,
    message:
      data?.message ||
      (success
        ? "Data purchase successful"
        : pending
          ? "Data purchase is processing"
          : confirmedFailure
            ? "Data purchase failed"
            : "Purchase outcome requires verification"),
    data,
    provider: "maskawa",
  };
};

// =====================================================
// CLASSIFY MASKAWA REQUEST ERROR
// =====================================================

const classifyPurchaseError = (error: any) => {
  const providerResponse = error?.response?.data;
  const httpStatus = Number(error?.response?.status);
  const confirmedRejection =
    httpStatus === 400 &&
    Array.isArray(providerResponse?.error) &&
    providerResponse.error.length > 0;

  console.error(
    "MASKAWA PURCHASE ERROR:",
    providerResponse || error?.message || error
  );

  return {
    success: false,
    pending: !confirmedRejection,
    status: confirmedRejection ? ("FAILED" as const) : ("UNCERTAIN" as const),
    uncertain: !confirmedRejection,
    message:
      providerResponse?.message ||
      providerResponse?.detail ||
      (Array.isArray(providerResponse?.error) ? providerResponse.error.join("; ") : undefined) ||
      "The provider outcome could not be confirmed. Verification is required before retrying or refunding.",
    data: providerResponse,
    provider: "maskawa",
  };
};

// =====================================================
// BUY MASKAWA DATA
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
      message: "Invalid Maskawa data plan ID",
      provider: "maskawa",
    };
  }

  // Maskawa determines the debit amount from the plan ID.
  // AbuPay's provider cost remains internal for pricing/accounting.
  const payload = {
    network: networkId,
    mobile_number: phone.trim(),
    plan: planId,
    Ported_number: true,
  };

  console.log("========== MASKAWA DATA PURCHASE ==========");
  console.log("Network:", network);
  console.log("Network ID:", networkId);
  console.log("Plan ID:", planId);
  console.log("Phone:", phone.trim());
  console.log("Expected provider cost:", Number(amount));

  try {
    const response = await maskawaClient.post(
      "/data/",
      payload
    );

    const data = response.data;

    console.log(
      "MASKAWA DATA PURCHASE RESPONSE:",
      JSON.stringify(data, null, 2)
    );

    return classifyPurchaseResponse(data);
  } catch (error: any) {
    return classifyPurchaseError(error);
  }
};

// =====================================================
// BUY MASKAWA AIRTIME
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

  const payload = {
    network: networkId,
    amount: Number(amount),
    mobile_number: phone.trim(),
    Ported_number: true,
    airtime_type: "VTU",
  };

  console.log("========== MASKAWA AIRTIME PURCHASE ==========");
  console.log("Network:", network);
  console.log("Network ID:", networkId);
  console.log("Phone:", phone.trim());
  console.log("Amount:", Number(amount));

  try {
    const response = await maskawaClient.post(
      "/topup/",
      payload
    );

    const data = response.data;

    console.log(
      "MASKAWA AIRTIME PURCHASE RESPONSE:",
      JSON.stringify(data, null, 2)
    );

    return classifyPurchaseResponse(data);
  } catch (error: any) {
    return classifyPurchaseError(error);
  }
};

// =====================================================
// GET LIVE MASKAWA DATA PLANS
// =====================================================

export const getDataPlans = async (network: string) => {
  const networkId = getNetworkId(network);

  const networkCatalogueKey: Record<number, string> = {
    1: "MTN_PLAN",
    2: "GLO_PLAN",
    3: "9MOBILE_PLAN",
    4: "AIRTEL_PLAN",
  };

  const catalogueKey = networkCatalogueKey[networkId];

  if (!catalogueKey) {
    throw new Error(`Maskawa data catalogue is not available for ${network}`);
  }

  try {
    const response = await maskawaClient.get("/user/");
    const rawCatalogue = response.data?.Dataplans?.[catalogueKey];

    let rawPlans: any[] = [];

    if (Array.isArray(rawCatalogue)) {
      rawPlans = rawCatalogue;
    } else if (rawCatalogue && typeof rawCatalogue === "object") {
      rawPlans = Object.values(rawCatalogue).flatMap((value: any) =>
        Array.isArray(value) ? value : [value]
      );
    }

    const plans = rawPlans
      .filter(
        (item: any) =>
          item &&
          (item.dataplan_id ?? item.id) != null &&
          Number(item.Ambassador_price ?? item.plan_amount) > 0
      )
      .map((item: any) => {
        const planCode = String(item.dataplan_id ?? item.id);
        const providerCost = Number(
          item.Ambassador_price ?? item.plan_amount
        );

        const planName = String(item.plan ?? "Data").trim();
        const planType = String(item.plan_type ?? "").trim();
        const validity = String(item.month_validate ?? "").trim();

        return {
          name: [planName, planType, validity]
            .filter(Boolean)
            .join(" - "),
          variation_code: planCode,
          amount: providerCost,
          plan_id: Number(planCode),
          network: networkId,
          network_name: String(
            item.plan_network ?? network
          ).trim(),
          plantype: planType,
          size: planName,
          validity,
          provider_amount: providerCost,
        };
      });

    return Array.from(
      new Map(
        plans.map((plan) => [plan.variation_code, plan])
      ).values()
    );
  } catch (error: any) {
    console.error(
      "MASKAWA GET DATA PLANS ERROR:",
      error?.response?.data || error?.message || error
    );

    throw error;
  }
};
// =====================================================
// GET MASKAWA WALLET BALANCE
// =====================================================

export const getBalance = async () => {
  try {
    const response = await maskawaClient.get("/user/");
    const rawBalance =
      response.data?.user?.Account_Balance ??
      response.data?.user?.wallet_balance;

    const balance = Number(rawBalance);

    if (!Number.isFinite(balance)) {
      return {
        success: false,
        message: "Maskawa returned an invalid wallet balance",
        provider: "maskawa",
      };
    }

    return {
      success: true,
      balance,
      provider: "maskawa",
    };
  } catch (error: any) {
    console.error(
      "MASKAWA BALANCE ERROR:",
      error?.response?.data || error?.message || error
    );

    return {
      success: false,
      message: "Unable to retrieve Maskawa wallet balance",
      provider: "maskawa",
    };
  }
};

// =====================================================
// MASKAWA PROVIDER
// =====================================================

export const maskawaProvider = {
  key: "maskawa",
  buyData,
  buyAirtime,
  getDataPlans,
  getBalance,
};

