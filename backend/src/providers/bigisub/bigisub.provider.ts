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

const getNetworkId = (
  network: string
): number => {
  const key = String(network)
    .toLowerCase()
    .trim();

  const networkId =
    networkMap[key];

  if (!networkId) {
    throw new Error(
      `Unsupported network: ${network}`
    );
  }

  return networkId;
};

// =====================================================
// ADD PIN WHEN AVAILABLE
// =====================================================

const withPin = (
  payload: Record<string, any>
) => {
  const pin =
    process.env.BIGISUB_PIN?.trim();

  if (pin) {
    payload.pin = pin;
    payload.pin_code = pin;
  }

  return payload;
};

// =====================================================
// GET LIVE BIGISUB DATA PLANS
// =====================================================

export const getDataPlans =
  async (
    network: string
  ) => {
    const networkId =
      getNetworkId(network);

    try {
      const response =
        await bigisubClient.get(
          "/vtu/data/plans/",
          {
            params: {
              network:
                networkId,
            },
          }
        );

      const rawPlans =
        Array.isArray(
          response.data?.data
        )
          ? response.data.data
          : [];

      const plans =
        rawPlans
          .filter(
            (item: any) => {
              return (
                item &&
                item.id &&
                !item.plan_disabled &&
                Number(item.amount) > 0
              );
            }
          )
          .map(
            (item: any) => ({
              name: `${item.size}${item.plan_volume} - ${item.plantype} - ${item.validity}`,

              variation_code:
                String(item.id),

              amount:
                Number(
                  item.amount
                ),

              plan_id:
                Number(item.id),

              network:
                item.network,

              network_name:
                item.network_name,

              plantype:
                item.plantype,

              size:
                item.size,

              plan_volume:
                item.plan_volume,

              validity:
                item.validity,

              provider_amount:
                Number(
                  item.amount
                ),

              corporate_amount:
                item.corporate_amount !==
                undefined
                  ? Number(
                      item.corporate_amount
                    )
                  : undefined,
            })
          );

      console.log(
        "========== BIGISUB DATA PLANS =========="
      );

      console.log(
        "Network:",
        network
      );

      console.log(
        "Network ID:",
        networkId
      );

      console.log(
        "Plans received:",
        plans.length
      );

      return plans;
    } catch (error: any) {
      console.error(
        "BIGISUB GET DATA PLANS ERROR:",
        error?.response?.data ||
          error?.message ||
          error
      );

      throw error;
    }
  };

// =====================================================
// BUY BIGISUB DATA
// =====================================================
//
// Bigisub expects:
// plan = numeric plan ID from
// /vtu/data/plans/
// =====================================================

export const buyData =
  async ({
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
    const networkId =
      getNetworkId(network);

    const planId =
      Number(plan);

    if (
      !Number.isInteger(
        planId
      ) ||
      planId <= 0
    ) {
      return {
        success: false,

        message:
          "Invalid Bigisub data plan ID",

        provider:
          "bigisub",
      };
    }

    const payload =
      withPin({
        network:
          networkId,

        plan:
          planId,

        phone_number:
          phone.trim(),

        amount:
          Number(amount),
      });

    console.log(
      "========== BIGISUB DATA PURCHASE =========="
    );

    console.log(
      "Network:",
      network
    );

    console.log(
      "Network ID:",
      networkId
    );

    console.log(
      "Plan ID:",
      planId
    );

    console.log(
      "Phone:",
      phone.trim()
    );

    console.log(
      "Amount:",
      Number(amount)
    );

    try {
      const response =
        await bigisubClient.post(
          "/vtu/data/purchase/",
          payload
        );

      const data =
        response.data;

      console.log(
        "BIGISUB DATA PURCHASE RESPONSE:",
        JSON.stringify(
          data,
          null,
          2
        )
      );

      const status =
        String(
          data?.status || ""
        ).toLowerCase();

      const success =
        data?.success === true ||
        status === "successful" ||
        status === "completed";

      const pending =
        status === "processing" ||
        status === "submitted" ||
        status === "pending" ||
        status === "in_progress";

      return {
        success,

        pending,

        message:
          data?.message ||
          (success
            ? "Data purchase successful"
            : pending
              ? "Data purchase is processing"
              : "Data purchase failed"),

        data,

        provider:
          "bigisub",
      };
    } catch (error: any) {
      const providerResponse =
        error?.response?.data;

      console.error(
        "BIGISUB DATA PURCHASE ERROR:",
        providerResponse ||
          error?.message ||
          error
      );

      return {
        success: false,

        message:
          providerResponse?.message ||
          providerResponse?.detail ||
          error?.message ||
          "Bigisub data purchase failed",

        data:
          providerResponse,

        provider:
          "bigisub",
      };
    }
  };

// =====================================================
// BUY BIGISUB AIRTIME
// =====================================================
//
// We are keeping your current endpoint and
// payload structure unchanged.
// =====================================================

export const buyAirtime =
  async ({
    network,
    phone,
    amount,
  }: {
    network: string;
    phone: string;
    amount: number;
  }) => {
    const networkId =
      getNetworkId(network);

    const payload =
      withPin({
        network:
          networkId,

        phone_number:
          phone.trim(),

        amount:
          Number(amount),
      });

    try {
      const response =
        await bigisubClient.post(
          "/vtu/airtime/purchase/",
          payload
        );

      const data =
        response.data;

      const status =
        String(
          data?.status || ""
        ).toLowerCase();

      const success =
        data?.success === true ||
        status === "successful" ||
        status === "completed";

      return {
        success,

        message:
          data?.message ||
          (success
            ? "Airtime purchase successful"
            : "Airtime purchase failed"),

        data,

        provider:
          "bigisub",
      };
    } catch (error: any) {
      const providerResponse =
        error?.response?.data;

      console.error(
        "BIGISUB AIRTIME PURCHASE ERROR:",
        providerResponse ||
          error?.message ||
          error
      );

      return {
        success: false,

        message:
          providerResponse?.message ||
          providerResponse?.detail ||
          error?.message ||
          "Bigisub airtime failed",

        data:
          providerResponse,

        provider:
          "bigisub",
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
};