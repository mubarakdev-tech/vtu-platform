const deals = [
  {
    network: "MTN",
    plan: "1GB",
    price: "₦290",
  },
  {
    network: "Airtel",
    plan: "2GB",
    price: "₦570",
  },
  {
    network: "Glo",
    plan: "1GB",
    price: "₦280",
  },
];

export default function TodaysDeals() {
  return (
    <div className="rounded-2xl bg-white p-6 shadow">
      <h2 className="mb-4 text-xl font-bold">
        🔥 Today's Deals
      </h2>

      <div className="grid gap-4 md:grid-cols-3">
        {deals.map((deal) => (
          <div
            key={deal.network}
            className="rounded-xl border p-4 hover:border-emerald-500 hover:shadow-md transition"
          >
            <h3 className="font-bold">
              {deal.network}
            </h3>

            <p>{deal.plan}</p>

            <p className="mt-2 text-xl font-bold text-emerald-600">
              {deal.price}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}