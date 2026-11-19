export type AirtimeNetwork =
  | "mtn"
  | "airtel"
  | "glo"
  | "9mobile";

export interface AirtimePricingInput {
  providerKey: string;
  network: AirtimeNetwork;
  faceValue: number;
  discountPercent: number;
}

export interface AirtimePricingQuote {
  providerKey: string;
  network: AirtimeNetwork;
  faceValue: number;
  discountPercent: number;
  expectedProviderCost: number;
  expectedGrossProfit: number;
  customerPrice: number;
  pricingSource: "CONFIGURED_PROVIDER_DISCOUNT";
}

export interface AirtimePricingSettlement {
  providerKey: string;
  network: AirtimeNetwork;
  faceValue: number;
  customerPrice: number;
  actualProviderDebit: number;
  actualGrossProfit: number;
}

const SUPPORTED_NETWORKS: AirtimeNetwork[] = [
  "mtn",
  "airtel",
  "glo",
  "9mobile",
];

const roundMoney = (value: number): number =>
  Math.round((value + Number.EPSILON) * 100) / 100;

const isValidMoney = (value: number): boolean =>
  Number.isFinite(value) && value >= 0;

export const calculateAirtimePrice = (
  input: AirtimePricingInput
): AirtimePricingQuote => {
  if (!input || typeof input.providerKey !== "string" ||
      !input.providerKey.trim()) {
    throw new Error("A valid Airtime provider is required");
  }

  if (!SUPPORTED_NETWORKS.includes(input.network)) {
    throw new Error("A valid supported Airtime network is required");
  }

  if (!Number.isFinite(input.faceValue) || input.faceValue <= 0) {
    throw new Error("Face value must be greater than zero");
  }

  if (
    !Number.isFinite(input.discountPercent) ||
    input.discountPercent < 0 ||
    input.discountPercent > 100
  ) {
    throw new Error("Provider discount must be between 0 and 100 percent");
  }

  const faceValue = roundMoney(input.faceValue);
  const expectedProviderCost = roundMoney(
    faceValue * (1 - input.discountPercent / 100)
  );

  return {
    providerKey: input.providerKey.trim().toLowerCase(),
    network: input.network,
    faceValue,
    discountPercent: input.discountPercent,
    expectedProviderCost,
    expectedGrossProfit: roundMoney(faceValue - expectedProviderCost),
    customerPrice: faceValue,
    pricingSource: "CONFIGURED_PROVIDER_DISCOUNT",
  };
};

export const calculateAirtimeSettlement = (
  quote: AirtimePricingQuote,
  actualProviderDebit: number
): AirtimePricingSettlement => {
  if (!quote) {
    throw new Error("A valid Airtime pricing quote is required");
  }

  if (!isValidMoney(actualProviderDebit)) {
    throw new Error("A valid actual provider debit is required");
  }

  const debit = roundMoney(actualProviderDebit);

  return {
    providerKey: quote.providerKey,
    network: quote.network,
    faceValue: quote.faceValue,
    customerPrice: quote.customerPrice,
    actualProviderDebit: debit,
    actualGrossProfit: roundMoney(quote.customerPrice - debit),
  };
};
