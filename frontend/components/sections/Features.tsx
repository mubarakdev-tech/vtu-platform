import {
  ShieldCheck,
  Clock3,
  Wallet,
  Headphones,
} from "lucide-react";

const features = [
  {
    title: "Secure Payments",
    icon: ShieldCheck,
  },
  {
    title: "Instant Delivery",
    icon: Clock3,
  },
  {
    title: "Wallet System",
    icon: Wallet,
  },
  {
    title: "24/7 Support",
    icon: Headphones,
  },
];

export default function Features() {
  return (
    <section className="bg-gray-50 py-24">
      <div className="mx-auto max-w-7xl px-6">

        <h2 className="text-center text-4xl font-bold">
          Why Choose Us
        </h2>

        <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4">

          {features.map((feature) => {

            const Icon = feature.icon;

            return (
              <div
                key={feature.title}
                className="rounded-xl bg-white p-8 text-center shadow"
              >
                <Icon className="mx-auto h-12 w-12 text-blue-600" />

                <h3 className="mt-5 text-xl font-semibold">
                  {feature.title}
                </h3>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}