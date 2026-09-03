const stats = [
  {
    value: "Growing Daily",
    label: "Happy Customers",
  },
  {
    value: "Secure",
    label: "Transactions Processed",
  },
  {
    value: "99.9%",
    label: "Service Uptime",
  },
  {
    value: "24/7",
    label: "Customer Support",
  },
];

export default function Stats() {
  return (
    <section className="bg-gradient-to-r from-emerald-600 to-teal-700 py-20 text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 text-center md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label}>
            <h2 className="text-4xl font-black sm:text-5xl">
              {stat.value}
            </h2>
            <p className="mt-4 text-lg text-emerald-100">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}