import {
  ShieldCheck,
  Clock3,
  Wallet,
  Headphones,
  BadgeCheck,
  Gift,
} from "lucide-react";

const features = [
  {
    title: "Secure Transactions",
    description:
      "Every payment is protected with modern security standards to keep your money and information safe.",
    icon: ShieldCheck,
    color: "bg-emerald-100 text-emerald-600",
  },
  {
    title: "Instant Delivery",
    description:
      "Airtime, data, electricity and TV subscriptions are processed within seconds.",
    icon: Clock3,
    color: "bg-blue-100 text-blue-600",
  },
  {
    title: "Easy Wallet Funding",
    description:
      "Fund your wallet securely and enjoy faster checkouts on every purchase.",
    icon: Wallet,
    color: "bg-yellow-100 text-yellow-600",
  },
  {
    title: "24/7 Customer Support",
    description:
      "Our support team is always available whenever you need assistance.",
    icon: Headphones,
    color: "bg-purple-100 text-purple-600",
  },
  {
    title: "Reliable Platform",
    description:
      "Built for speed, stability and consistent performance every day.",
    icon: BadgeCheck,
    color: "bg-red-100 text-red-600",
  },
  {
    title: "Referral Rewards",
    description:
      "Invite friends and earn commissions every time they transact on AbuPay.",
    icon: Gift,
    color: "bg-pink-100 text-pink-600",
  },
];

export default function WhyChooseUs() {
  return (
    <section
      id="why"
      className="scroll-mt-24 bg-white py-24"
    >
      <div className="mx-auto max-w-7xl px-6">

        <div className="text-center">

          <span className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700">
            WHY CHOOSE ABUPAY
          </span>

          <h2 className="mt-6 text-5xl font-bold text-gray-900">
            Built For Speed, Security & Convenience
          </h2>

          <p className="mx-auto mt-5 max-w-3xl text-lg text-gray-500">
            AbuPay combines affordability, security and instant delivery,
            making it one of the easiest ways to buy airtime, data,
            electricity tokens and TV subscriptions.
          </p>

        </div>


        <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">

          {features.map((feature) => {

            const Icon = feature.icon;

            return (
              <div
                key={feature.title}
                className="rounded-3xl border bg-white p-8 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl"
              >

                <div
                  className={`mb-6 flex h-16 w-16 items-center justify-center rounded-2xl ${feature.color}`}
                >
                  <Icon size={30} />
                </div>


                <h3 className="text-2xl font-bold">
                  {feature.title}
                </h3>


                <p className="mt-4 leading-8 text-gray-500">
                  {feature.description}
                </p>


              </div>
            );

          })}

        </div>

      </div>
    </section>
  );
}