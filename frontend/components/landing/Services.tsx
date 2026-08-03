import {
  Smartphone,
  Wifi,
  Zap,
  Tv,
} from "lucide-react";

const services = [
  {
    title: "Airtime Recharge",
    description:
      "Instant airtime recharge for MTN, Airtel, Glo and 9mobile networks.",
    icon: Smartphone,
  },
  {
    title: "Data Bundles",
    description:
      "Buy affordable internet data plans and stay connected anytime.",
    icon: Wifi,
  },
  {
    title: "Electricity Bills",
    description:
      "Pay your electricity bills quickly and securely from anywhere.",
    icon: Zap,
  },
  {
    title: "TV Subscription",
    description:
      "Renew your DSTV, GOtv and other TV subscriptions with ease.",
    icon: Tv,
  },
];

export default function Services() {
  return (
    <section
      id="services"
      className="scroll-mt-24 bg-white px-6 py-20"
    >
      <div className="container mx-auto">

        {/* Heading */}
        <div className="mx-auto max-w-2xl text-center">

          <h2 className="text-3xl font-bold text-gray-900 md:text-4xl">
            Our Services
          </h2>

          <p className="mt-4 text-gray-600">
            Everything you need for your daily digital payments in one place.
          </p>

        </div>


        {/* Cards */}
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">

          {services.map((service) => {

            const Icon = service.icon;

            return (
              <div
                key={service.title}
                className="
                  rounded-2xl
                  border
                  bg-white
                  p-6
                  shadow-sm
                  transition
                  hover:-translate-y-1
                  hover:shadow-lg
                "
              >

                <div
                  className="
                    mb-5
                    flex
                    h-12
                    w-12
                    items-center
                    justify-center
                    rounded-xl
                    bg-blue-100
                    text-blue-600
                  "
                >
                  <Icon size={26} />
                </div>


                <h3 className="text-xl font-semibold text-gray-900">
                  {service.title}
                </h3>


                <p className="mt-3 text-sm leading-6 text-gray-600">
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