import vtpassClient from "./vtpass.client";
import AppError from "../../utils/apperror";

// ======================
// Network / Service Maps
// ======================
const airtimeServiceMap: Record<string, string> = {
  mtn: "mtn",
  airtel: "airtel",
  glo: "glo",
  "9mobile": "etisalat",
  etisalat: "etisalat",
};

const dataServiceMap: Record<string, string> = {
  mtn: "mtn-data",
  airtel: "airtel-data",
  glo: "glo-data",
  "9mobile": "etisalat-data",
  etisalat: "etisalat-data",
};

// ======================
// Generate Request ID
// ======================
const generateRequestId = () => {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");

  const datePart =
    now.getFullYear().toString() +
    pad(now.getMonth() + 1) +
    pad(now.getDate()) +
    pad(now.getHours()) +
    pad(now.getMinutes());

  const randomPart = Math.random().toString(36).substring(2, 10).toUpperCase();

  return datePart + randomPart;
};

// ======================
// Get Data Plans
// ======================
export const getDataPlans = async (network: string) => {
  const serviceID = dataServiceMap[network.toLowerCase()];

  if (!serviceID) {
    throw new AppError(`Unsupported network: ${network}`, 400);
  }

  console.log("========== VTPASS GET DATA PLANS ==========");
  console.log("Network:", network);
  console.log("Service ID:", serviceID);
  console.log("Client exists:", !!vtpassClient);

  try {
    const response = await vtpassClient.get("/service-variations", {
      params: {
        serviceID,
      },
    });

    console.log("Raw VTpass Response:", JSON.stringify(response.data, null, 2));

    // VTpass misspells "variations" as "varations"
    const variations =
      response.data?.content?.varations ||
      response.data?.content?.variations ||
      response.data?.varations ||
      response.data?.variations ||
      [];

    if (!Array.isArray(variations) || variations.length === 0) {
      console.log("No variations found");
      return [];
    }

    const plans = variations.map((item: any) => ({
      name: item.name || item.variation_name || "Data Plan",
      variation_code: item.variation_code,
      amount: Number(item.variation_amount || item.amount || 0),
    }));

    console.log("Normalized Plans Count:", plans.length);
    return plans;
  } catch (error: any) {
    console.error("========== VTPASS GET PLANS ERROR ==========");
    console.error(error?.response?.data || error.message);
    throw new AppError(
      error?.response?.data?.response_description ||
        error.message ||
        "Failed to fetch data plans",
      500
    );
  }
};

// ======================
// Buy Airtime
// ======================
export const buyAirtime = async ({
  network,
  phone,
  amount,
}: {
  network: string;
  phone: string;
  amount: number;
}) => {
  const serviceID = airtimeServiceMap[network.toLowerCase()];

  if (!serviceID) {
    return {
      success: false,
      message: `Unsupported network: ${network}`,
    };
  }

  const request_id = generateRequestId();

  const payload = {
    request_id,
    serviceID,
    amount,
    phone,
  };

  console.log("========== VTPASS AIRTIME REQUEST ==========");
  console.log(payload);

  try {
    const response = await vtpassClient.post("/pay", payload);

    console.log("========== VTPASS AIRTIME RESPONSE ==========");
    console.log(JSON.stringify(response.data, null, 2));

    const data = response.data;

    if (
      data.code === "000" ||
      data.content?.transactions?.status === "delivered" ||
      data.response_description === "TRANSACTION SUCCESSFUL"
    ) {
      return {
        success: true,
        message: "Airtime purchase successful",
        data,
        request_id,
      };
    }

    return {
      success: false,
      message:
        data.response_description ||
        data.content?.transactions?.status ||
        "Airtime purchase failed",
      data,
      request_id,
    };
  } catch (error: any) {
    console.error("========== VTPASS AIRTIME ERROR ==========");
    console.error(error?.response?.data || error.message);

    return {
      success: false,
      message:
        error?.response?.data?.response_description ||
        error.message ||
        "Airtime purchase failed",
      data: error?.response?.data,
      request_id,
    };
  }
};

// ======================
// Buy Data
// ======================
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
      message: `Unsupported network: ${network}`,
    };
  }

  const request_id = generateRequestId();

  const payload = {
    request_id,
    serviceID,
    billersCode: phone,
    variation_code: plan,
    amount,
    phone,
  };

  console.log("========== VTPASS DATA REQUEST ==========");
  console.log(payload);

  try {
    const response = await vtpassClient.post("/pay", payload);

    console.log("========== VTPASS DATA RESPONSE ==========");
    console.log(JSON.stringify(response.data, null, 2));

    const data = response.data;

    if (
      data.code === "000" ||
      data.content?.transactions?.status === "delivered" ||
      data.response_description === "TRANSACTION SUCCESSFUL"
    ) {
      return {
        success: true,
        message: "Data purchase successful",
        data,
        request_id,
      };
    }

    return {
      success: false,
      message:
        data.response_description ||
        data.content?.transactions?.status ||
        "Data purchase failed",
      data,
      request_id,
    };
  } catch (error: any) {
    console.error("========== VTPASS DATA ERROR ==========");
    console.error(error?.response?.data || error.message);

    return {
      success: false,
      message:
        error?.response?.data?.response_description ||
        error.message ||
        "Data purchase failed",
      data: error?.response?.data,
      request_id,
    };
  }
};

// Export as object
export const vtpassProvider = {
  getDataPlans,
  buyAirtime,
  buyData,
};