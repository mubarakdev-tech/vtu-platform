import {
  Smartphone,
  Wifi,
  Tv,
  Zap,
  GraduationCap,
} from "lucide-react";

const services = [
  {
    title: "Airtime",
    icon: Smartphone,
    description:
      "Recharge all Nigerian networks instantly.",
  },
  {
    title: "Data",
    icon: Wifi,
    description:
      "Affordable data bundles delivered immediately.",
  },
  {
    title: "Electricity",
    icon: Zap,
    description:
      "Pay electricity bills with ease.",
  },
  {
    title: "Cable TV",
    icon: Tv,
    description:
      "DSTV, GOTV & Startimes subscriptions.",
  },
  {
    title: "Exam Pins",
    icon: GraduationCap,
    description:
      "WAEC, NECO & JAMB PIN purchase.",
  },
];

export default function Services() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-6">
        <h2 className="text-center text-4xl font-bold">
          Our Services
        </h2>

        <p className="mt-4 text-center text-gray-500">
          Everything you need in one platform.
        </p>

        <div className="mt-14 grid gap-8 md:grid-cols-2 lg:grid-cols-5">
          {services.map((service) => {
            const Icon = service.icon;

            return (
              <div
                key={service.title}
                className="rounded-xl border bg-white p-6 text-center shadow-sm transition hover:-translate-y-2 hover:shadow-lg"
              >
                <Icon className="mx-auto h-12 w-12 text-blue-600" />

                <h3 className="mt-4 text-xl font-semibold">
                  {service.title}
                </h3>

                <p className="mt-3 text-sm text-gray-500">
                  {service.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}