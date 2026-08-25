import vtpassClient from "./vtpass.client";

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
  const date = new Date();

  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");

  const rand = Math.floor(Math.random() * 1e8);

  return `${y}${m}${d}${rand}`;
};

// =====================================================
// GET DATA PLANS
// =====================================================

export const getDataPlans = async (
  network: string
) => {
  const serviceID =
    dataServiceMap[
      network.toLowerCase()
    ];

  if (!serviceID) {
    throw new Error(
      "Unsupported network"
    );
  }

  console.log(
    "========== VTPASS GET DATA PLANS =========="
  );

  console.log(
    "Network:",
    network
  );

  console.log(
    "Service ID:",
    serviceID
  );

  const response =
    await vtpassClient.get(
      "/service-variations",
      {
        params: {
          serviceID,
        },
      }
    );

  console.log(
    "VTPASS PLANS RAW:",
    JSON.stringify(
      response.data,
      null,
      2
    )
  );

  const variations =
    response.data?.content
      ?.varations ||
    response.data?.content
      ?.variations ||
    [];

  const plans = (
    Array.isArray(
      variations
    )
      ? variations
      : []
  )
    .map(
      (item: any) => ({
        name:
          item.name ||
          item.variation_name ||
          "Data Plan",

        variation_code:
          String(
            item.variation_code ||
              item.code ||
              ""
          ),

        amount:
          Number(
            item.variation_amount ||
              item.amount ||
              0
          ),
      })
    )
    .filter(
      (p: any) =>
        p.variation_code &&
        p.amount > 0
    );

  console.log(
    "VTPASS PLANS COUNT:",
    plans.length
  );

  return plans;
};

// =====================================================
// BUY DATA
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
  const serviceID =
    dataServiceMap[
      network.toLowerCase()
    ];

  if (!serviceID) {
    return {
      success: false,
      message:
        "Unsupported network",
      provider: "vtpass",
      request_id: undefined,
    };
  }

  const request_id =
    generateRequestId();

  const payload = {
    request_id,

    serviceID,

    billersCode:
      phone.trim(),

    variation_code:
      plan,

    amount:
      Number(amount),

    phone:
      phone.trim(),
  };

  const response =
    await vtpassClient.post(
      "/pay",
      payload
    );

  const data =
    response.data;

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

    provider:
      "vtpass",

    request_id,
  };
};

// =====================================================
// BUY AIRTIME
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
  const serviceID =
    airtimeServiceMap[
      network.toLowerCase()
    ];

  if (!serviceID) {
    return {
      success: false,
      message:
        "Unsupported network",
      provider: "vtpass",
    };
  }

  const request_id =
    generateRequestId();

  const payload = {
    request_id,

    serviceID,

    amount:
      Number(amount),

    phone:
      phone.trim(),
  };

  const response =
    await vtpassClient.post(
      "/pay",
      payload
    );

  const data =
    response.data;

  const success =
    data?.code === "000" ||
    data?.response_description ===
      "TRANSACTION SUCCESSFUL";

  return {
    success,

    message:
      data?.response_description ||
      data?.message ||
      "Airtime purchase",

    data,

    provider:
      "vtpass",

    request_id,
  };
};

// =====================================================
// VTPASS PROVIDER
// =====================================================

export const vtpassProvider = {
  key: "vtpass",

  getDataPlans,

  buyData,

  buyAirtime,
};