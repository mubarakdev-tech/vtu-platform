import {
  Smartphone,
  Wifi,
  Tv,
  Zap,
  Wallet,
  ArrowRight,
} from "lucide-react";

const services = [
  {
    title: "Airtime Recharge",
    icon: Smartphone,
    color: "bg-green-500",
    description: "Instant recharge for MTN, Airtel, Glo & 9mobile.",
  },
  {
    title: "Data Bundles",
    icon: Wifi,
    color: "bg-blue-500",
    description: "Affordable internet bundles delivered instantly.",
  },
  {
    title: "Electricity Bills",
    icon: Zap,
    color: "bg-yellow-500",
    description: "Pay electricity bills without stress.",
  },
  {
    title: "TV Subscription",
    icon: Tv,
    color: "bg-purple-500",
    description: "Renew DStv, GOtv & Startimes quickly.",
  },
  {
    title: "Wallet",
    icon: Wallet,
    color: "bg-emerald-600",
    description: "Fund your wallet and enjoy faster checkout.",
  },
];

export default function Services() {
  return (
    <section
      id="services"
      className="bg-slate-50 py-24"
    >
      <div className="mx-auto max-w-7xl px-6">

        <div className="text-center">

          <span className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700">
            OUR SERVICES
          </span>

          <h2 className="mt-5 text-5xl font-bold">
            Everything You Need
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-lg text-gray-500">
            AbuPay provides all essential VTU services in one secure platform.
          </p>

        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">

          {services.map((service) => {

            const Icon = service.icon;

            return (
              <div
                key={service.title}
                className="group rounded-3xl bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl"
              >

                <div className={`mb-6 flex h-16 w-16 items-center justify-center rounded-2xl text-white ${service.color}`}>
                  <Icon size={30} />
                </div>

                <h3 className="text-2xl font-bold">
                  {service.title}
                </h3>

                <p className="mt-4 text-gray-500">
                  {service.description}
                </p>

                <button className="mt-8 flex items-center gap-2 font-semibold text-emerald-600 group-hover:gap-4 transition-all">

                  Learn More

                  <ArrowRight size={18} />

                </button>

              </div>
            );

          })}

        </div>

      </div>
    </section>
  );
}