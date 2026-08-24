export type BigisubPlan = {
  name: string;
  variation_code: string; // must match Bigisub API plan code
  amount: number;         // your selling price to customers
};

/**
 * Gift (Bigisub) local catalog
 * amount = what customer pays on AbuPay
 * Keep a small margin above your Bigisub cost if you want profit
 */
const catalog: Record<string, BigisubPlan[]> = {
  mtn: [
    { name: "MTN 100MB SME (1 Day)", variation_code: "SME-100MB", amount: 30 },
    { name: "MTN 250MB SME (1 Day)", variation_code: "SME-250MB", amount: 55 },
    { name: "MTN 500MB SME (30 Days)", variation_code: "SME-500MB", amount: 140 },
    { name: "MTN 1GB SME (30 Days)", variation_code: "SME-1GB", amount: 250 },
    { name: "MTN 2GB SME (30 Days)", variation_code: "SME-2GB", amount: 480 },
    { name: "MTN 3GB SME (30 Days)", variation_code: "SME-3GB", amount: 700 },
    { name: "MTN 5GB SME (30 Days)", variation_code: "SME-5GB", amount: 1150 },
    { name: "MTN 10GB SME (30 Days)", variation_code: "SME-10GB", amount: 2300 },
  ],

  airtel: [
    { name: "Airtel 500MB", variation_code: "AIRTEL-500MB", amount: 150 },
    { name: "Airtel 1GB", variation_code: "AIRTEL-1GB", amount: 270 },
    { name: "Airtel 1.5GB", variation_code: "AIRTEL-1.5GB", amount: 380 },
    { name: "Airtel 2GB", variation_code: "AIRTEL-2GB", amount: 500 },
    { name: "Airtel 3GB", variation_code: "AIRTEL-3GB", amount: 720 },
    { name: "Airtel 5GB", variation_code: "AIRTEL-5GB", amount: 1200 },
  ],

  glo: [
    { name: "Glo 500MB CG", variation_code: "GLO-500MB", amount: 140 },
    { name: "Glo 1GB CG", variation_code: "GLO-1GB", amount: 260 },
    { name: "Glo 2GB CG", variation_code: "GLO-2GB", amount: 500 },
    { name: "Glo 3GB CG", variation_code: "GLO-3GB", amount: 720 },
    { name: "Glo 5GB CG", variation_code: "GLO-5GB", amount: 1150 },
  ],

  "9mobile": [
    { name: "9mobile 500MB", variation_code: "9MOBILE-500MB", amount: 160 },
    { name: "9mobile 1GB", variation_code: "9MOBILE-1GB", amount: 280 },
    { name: "9mobile 2GB", variation_code: "9MOBILE-2GB", amount: 520 },
    { name: "9mobile 3GB", variation_code: "9MOBILE-3GB", amount: 750 },
  ],
};

export const getCatalogPlans = (network: string): BigisubPlan[] => {
  const key = String(network).toLowerCase().trim();
  if (key === "etisalat") return catalog["9mobile"] || [];
  return catalog[key] || [];
};