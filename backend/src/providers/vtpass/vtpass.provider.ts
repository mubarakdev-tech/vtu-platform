import vtpassClient from "./vtpass.client";
import type {
  AirtimePurchaseRequest,
  ProviderResponse,
} from "../provider.interface";

const dataServiceMap: Record<string, string> = {
  mtn: "mtn-data",
  airtel: "airtel-data",
  glo: "glo-data",
  "9mobile": "etisalat-data",
  etisalat: "etisalat-data",
};

const airtimeServiceMap: Record<string, string> = {
  mtn: "mtn",
  airtel: "airtel",
  glo: "glo",
  "9mobile": "etisalat",
  etisalat: "etisalat",
};

const generateRequestId = () => {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());

  const getPart = (type: string): string =>
    parts.find((part) => part.type === type)?.value ?? "";

  const timestamp =
    `${getPart("year")}${getPart("month")}${getPart("day")}${getPart("hour")}${getPart("minute")}`;

  const randomPart = Math.floor(Math.random() * 100000000)
    .toString()
    .padStart(8, "0");

  return `${timestamp}${randomPart}`;
};

const classifyAirtimeResponse = (
  data: any,
  requestId: string
): ProviderResponse => {
  const code = String(data?.code || "").trim();
  const transactionStatus = String(
    data?.content?.transactions?.status || ""
  ).trim().toLowerCase();

  const description =
    data?.response_description ||
    data?.message ||
    "VTpass airtime transaction status";

  const successfulStatuses = [
    "delivered",
    "successful",
    "completed",
  ];

  const failedStatuses = [
    "failed",
    "failure",
    "rejected",
    "declined",
  ];

  const success =
    successfulStatuses.includes(transactionStatus);

  const failure =
    failedStatuses.includes(transactionStatus) ||
    code === "016" ||
    code === "091";

  const providerCost = Number(
    data?.content?.transactions?.total_amount
  );

  if (success) {
    return {
      success: true,
      status: "SUCCESS",
      uncertain: false,
      message: String(description),
      data,
      provider: "vtpass",
      request_id: requestId,
      providerStatus: transactionStatus,
      providerCost:
        Number.isFinite(providerCost) && providerCost >= 0
          ? providerCost
          : undefined,
    };
  }

  if (failure) {
    return {
      success: false,
      status: "FAILED",
      uncertain: false,
      message: String(description),
      data,
      provider: "vtpass",
      request_id: requestId,
      providerStatus: transactionStatus || code,
    };
  }

  return {
    success: false,
    status: "UNCERTAIN",
    uncertain: true,
    retryable: false,
    message: String(description),
    data,
    provider: "vtpass",
    request_id: requestId,
    providerStatus: transactionStatus || code || "UNKNOWN",
  };
};

// =====================================================
// GET DATA PLANS
// =====================================================

export const getDataPlans = async (network: string) => {
  const serviceID = dataServiceMap[network.toLowerCase()];

  if (!serviceID) {
    throw new Error("Unsupported network");
  }

  console.log("========== VTPASS GET DATA PLANS ==========");
  console.log("Network:", network);
  console.log("Service ID:", serviceID);

  const response = await vtpassClient.get(
    "/service-variations",
    {
      params: { serviceID },
    }
  );

  console.log(
    "VTPASS PLANS RAW:",
    JSON.stringify(response.data, null, 2)
  );

  const variations =
    response.data?.content?.varations ||
    response.data?.content?.variations ||
    [];

  const plans = (
    Array.isArray(variations) ? variations : []
  )
    .map((item: any) => ({
      name:
        item.name ||
        item.variation_name ||
        "Data Plan",
      variation_code: String(
        item.variation_code || item.code || ""
      ),
      amount: Number(
        item.variation_amount || item.amount || 0
      ),
    }))
    .filter(
      (plan: any) =>
        plan.variation_code && plan.amount > 0
    );

  console.log("VTPASS PLANS COUNT:", plans.length);

  return plans;
};

// =====================================================
// BUY DATA
// Existing data purchase behaviour preserved.
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
  const serviceID = dataServiceMap[network.toLowerCase()];

  if (!serviceID) {
    return {
      success: false,
      message: "Unsupported network",
      provider: "vtpass",
      request_id: undefined,
    };
  }

  const request_id = generateRequestId();

  const payload = {
    request_id,
    serviceID,
    billersCode: phone.trim(),
    variation_code: plan,
    amount: Number(amount),
    phone: phone.trim(),
  };

  const response = await vtpassClient.post(
    "/pay",
    payload
  );

  const data = response.data;

  const success =
    data?.code === "000" ||
    data?.response_description ===
      "TRANSACTION SUCCESSFUL";

  return {
    success,
    message:
      data?.response_description ||
      data?.message ||
      "Data purchase",
    data,
    provider: "vtpass",
    request_id,
  };
};

// =====================================================
// BUY AIRTIME
// Uses the request ID already persisted by AbuPay.
// =====================================================

export const buyAirtime = async (
  request: AirtimePurchaseRequest
): Promise<ProviderResponse> => {
  const { network, phone, amount } = request;

  const serviceID =
    airtimeServiceMap[network.toLowerCase()];

  if (!serviceID) {
    return {
      success: false,
      status: "FAILED",
      uncertain: false,
      message: "Unsupported network",
      provider: "vtpass",
    };
  }

  const request_id =
    request.requestId || generateRequestId();

  const payload = {
    request_id,
    serviceID,
    amount: Number(amount),
    phone: phone.trim(),
  };

  const response = await vtpassClient.post(
    "/pay",
    payload
  );

  return classifyAirtimeResponse(
    response.data,
    request_id
  );
};

// =====================================================
// REQUERY ORIGINAL VTPASS TRANSACTION
// Never submits another /pay request.
// =====================================================

export const checkTransactionStatus = async (
  requestId: string
): Promise<ProviderResponse> => {
  try {
    const response = await vtpassClient.post(
      "/requery",
      {
        request_id: requestId,
      }
    );

    return classifyAirtimeResponse(
      response.data,
      requestId
    );
  } catch (error: any) {
    console.error(
      "VTPASS REQUERY ERROR:",
      error?.response?.data ||
        error?.message ||
        error
    );

    return {
      success: false,
      status: "UNCERTAIN",
      uncertain: true,
      retryable: false,
      message:
        "VTpass transaction status could not be confirmed. The transaction remains pending.",
      provider: "vtpass",
      request_id: requestId,
    };
  }
};

// =====================================================
// GET VTPASS WALLET BALANCE
// =====================================================

export const getBalance = async () => {
  try {
    const response = await vtpassClient.get("/balance");
    const rawBalance =
      response.data?.contents?.balance;

    const hasNumericType =
      typeof rawBalance === "number" ||
      typeof rawBalance === "string";

    const hasValidBalance =
      hasNumericType &&
      !(
        typeof rawBalance === "string" &&
        rawBalance.trim() === ""
      ) &&
      Number.isFinite(Number(rawBalance));

    const balance = hasValidBalance
      ? Number(rawBalance)
      : null;

    if (balance === null) {
      return {
        success: false,
        message:
          "VTpass returned an invalid wallet balance",
        provider: "vtpass",
      };
    }

    return {
      success: true,
      balance,
      provider: "vtpass",
    };
  } catch (error: any) {
    console.error(
      "VTPASS BALANCE ERROR:",
      error?.response?.data ||
        error?.message ||
        error
    );

    return {
      success: false,
      message:
        "Unable to retrieve VTpass wallet balance",
      provider: "vtpass",
    };
  }
};

export const vtpassProvider = {
  key: "vtpass",
  getDataPlans,
  buyData,
  buyAirtime,
  checkTransactionStatus,
  getBalance,
};
