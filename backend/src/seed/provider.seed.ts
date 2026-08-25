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
    key: "vtu-com-ng",
    displayName: "AbuPay Plus",
    active: false,
    sortOrder: 3,
    supportsData: true,
    supportsAirtime: true,
  },
];

export const seedProviders = async () => {
  console.log(
    "========== ABUPAY PROVIDER SEED =========="
  );

  for (const provider of providers) {
    const existing = await Provider.findOne({
      key: provider.key,
    });

    if (existing) {
      await Provider.updateOne(
        { key: provider.key },
        {
          $set: {
            displayName:
              provider.displayName,

            active:
              provider.active,

            sortOrder:
              provider.sortOrder,

            supportsData:
              provider.supportsData,

            supportsAirtime:
              provider.supportsAirtime,
          },
        }
      );

      console.log(
        `Provider updated: ${provider.displayName} | active=${provider.active}`
      );

      continue;
    }

    await Provider.create(provider);

    console.log(
      `Created provider: ${provider.displayName}`
    );
  }

  console.log(
    "========== PROVIDER SEED COMPLETE =========="
  );
};
