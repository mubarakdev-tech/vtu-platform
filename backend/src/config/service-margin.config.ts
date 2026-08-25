// =====================================================
// ABUPAY SERVICE MARGIN CONFIGURATION
// =====================================================
//
// This file controls AbuPay's expected provider margin.
//
// IMPORTANT:
// We are NOT charging customers an additional funding fee.
//
// AbuPay revenue comes from:
//
// Airtime margin
// Data margin
// Future service margins
//
// For now, provider costs are not hard-coded because
// VTpass sandbox/test pricing may not represent your
// actual live merchant pricing.
// =====================================================

export interface ServiceMarginConfig {
  provider: string;

  service: string;

  /**
   * Provider discount/margin percentage.
   *
   * Example:
   *
   * customer pays ₦1,000
   * provider discount = 2%
   *
   * provider cost = ₦980
   * AbuPay gross profit = ₦20
   *
   * Set to null when the actual provider margin
   * is not yet known.
   */
  marginPercent: number | null;
}

// =====================================================
// AIRTIME
// =====================================================

export const airtimeMarginConfig: Record<
  string,
  ServiceMarginConfig
> = {
  mtn: {
    provider: "VTPASS",
    service: "AIRTIME",
    marginPercent: null,
  },

  airtel: {
    provider: "VTPASS",
    service: "AIRTIME",
    marginPercent: null,
  },

  glo: {
    provider: "VTPASS",
    service: "AIRTIME",
    marginPercent: null,
  },

  "9mobile": {
    provider: "VTPASS",
    service: "AIRTIME",
    marginPercent: null,
  },
};

// =====================================================
// DATA
// =====================================================

export const dataMarginConfig: Record<
  string,
  ServiceMarginConfig
> = {
  mtn: {
    provider: "VTPASS",
    service: "DATA",
    marginPercent: null,
  },

  airtel: {
    provider: "VTPASS",
    service: "DATA",
    marginPercent: null,
  },

  glo: {
    provider: "VTPASS",
    service: "DATA",
    marginPercent: null,
  },

  "9mobile": {
    provider: "VTPASS",
    service: "DATA",
    marginPercent: null,
  },
};

// =====================================================
// CALCULATE PROVIDER COST
// =====================================================

export const calculateProviderCost = (
  customerAmount: number,
  marginPercent: number | null
) => {
  if (
    !Number.isFinite(customerAmount) ||
    customerAmount <= 0
  ) {
    return null;
  }

  if (marginPercent === null) {
    return null;
  }

  const profit =
    customerAmount *
    (marginPercent / 100);

  const providerCost =
    customerAmount - profit;

  return {
    providerCost: Number(
      providerCost.toFixed(2)
    ),

    grossProfit: Number(
      profit.toFixed(2)
    ),
  };
};
