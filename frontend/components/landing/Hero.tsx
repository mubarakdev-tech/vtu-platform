import Image from "next/image";
import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="container mx-auto px-6 py-16 lg:flex lg:items-center lg:justify-between lg:py-24">

        {/* Left Content */}
        <div className="max-w-xl">
          <div className="mb-6">
            <Image
              src="/images/abupay-logo.png"
              alt="AbuPay Logo"
              width={180}
              height={60}
              priority
            />
          </div>

          <h1 className="text-4xl font-bold leading-tight text-gray-900 md:text-5xl">
            Fast & Secure Digital Payments Made Simple
          </h1>

          <p className="mt-6 text-lg text-gray-600">
            Buy airtime, purchase data bundles, pay bills, and manage your
            digital services easily with AbuPay.
          </p>

          {/* Buttons */}
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/register"
              className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
            >
              Get Started
            </Link>

            <Link
              href="/login"
              className="rounded-lg border border-blue-600 px-6 py-3 font-semibold text-blue-600 transition hover:bg-blue-50"
            >
              Login
            </Link>
          </div>

          {/* Trust Features */}
          <div className="mt-8 grid grid-cols-1 gap-3 text-sm text-gray-700 sm:grid-cols-3">
            <div>
              ✓ Instant Recharge
            </div>

            <div>
              ✓ Secure Wallet
            </div>

            <div>
              ✓ Available 24/7
            </div>
          </div>
        </div>


        {/* Right Banner Image */}
        <div className="mt-12 lg:mt-0 lg:w-1/2">
          <Image
            src="/images/hero-payment.png"
            alt="AbuPay digital payment"
            width={700}
            height={450}
            priority
            className="w-full object-contain"
          />
        </div>

      </div>
    </section>
  );
}