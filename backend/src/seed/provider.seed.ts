import Provider from "../models/provider.model";

const providers = [
  {
    key: "vtpass",
    displayName: "AbuPay Direct",
    active: true,
    sortOrder: 1,
    supportsData: true,
    supportsAirtime: true,
  },
  {
    key: "bigisub",
    displayName: "AbuPay Value",
    active: true,
    sortOrder: 2,
    supportsData: true,
    supportsAirtime: true,
  },
  {
    key: "maskawa",
    displayName: "AbuPay Saver",
    active: false,
    sortOrder: 3,
    supportsData: true,
    supportsAirtime: true,
  },
];

export const seedProviders = async () => {
  console.log("========== ABUPAY PROVIDER SEED ==========");

  for (const provider of providers) {
    const existing = await Provider.findOne({
      key: provider.key,
    });

    if (existing) {
      console.log(
        `Provider preserved: ${existing.key} | active=${existing.active}`
      );
      continue;
    }

    await Provider.create(provider);

    console.log(`Created missing provider: ${provider.key}`);
  }

  console.log("========== ABUPAY PROVIDER SEED COMPLETE ==========");
};
