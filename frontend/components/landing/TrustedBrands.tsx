import Image from "next/image";

const brands = [
  {
    name: "MTN",
    logo: "/brands/mtn.png",
  },
  {
    name: "Airtel",
    logo: "/brands/airtel.png",
  },
  {
    name: "Glo",
    logo: "/brands/glo.png",
  },
  {
    name: "9mobile",
    logo: "/brands/9mobile.png",
  },
  {
    name: "DStv",
    logo: "/brands/dstv.png",
  },
  {
    name: "GOtv",
    logo: "/brands/gotv.png",
  },
  {
    name: "Startimes",
    logo: "/brands/startimes.png",
  },
  {
    name: "Paystack",
    logo: "/brands/paystack.png",
  },
];

export default function TrustedBrands() {
  return (
    <section className="bg-white py-20">

      <div className="mx-auto max-w-7xl px-6">

        <div className="text-center">

          <p className="text-sm font-semibold uppercase tracking-widest text-emerald-600">
            Trusted Networks
          </p>

          <h2 className="mt-3 text-4xl font-bold text-gray-900">
            All Your Favourite Services In One Place
          </h2>

          <p className="mt-4 text-gray-500">
            Recharge, pay bills and manage your digital life with confidence.
          </p>

        </div>

        <div className="mt-14 grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-8">

          {brands.map((brand) => (
            <div
              key={brand.name}
              className="flex h-28 items-center justify-center rounded-2xl border bg-gray-50 transition duration-300 hover:-translate-y-2 hover:border-emerald-300 hover:bg-white hover:shadow-xl"
            >
              <Image
                src={brand.logo}
                alt={brand.name}
                width={70}
                height={70}
                className="object-contain"
              />
            </div>
          ))}

        </div>

      </div>

    </section>
  );
}