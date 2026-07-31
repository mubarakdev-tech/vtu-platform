import Link from "next/link";
import { ArrowRight, ShieldCheck, Wallet, Zap } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-teal-50 pt-40 pb-24">

      <div className="mx-auto grid max-w-7xl items-center gap-16 px-6 lg:grid-cols-2">

        {/* Left */}

        <div>

          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-5 py-2 text-sm font-semibold text-emerald-700">

            <ShieldCheck size={18} />

            Trusted by Nigerians

          </div>

          <h1 className="text-5xl font-black leading-tight text-gray-900 lg:text-7xl">

            Recharge

            <span className="text-emerald-600">
              {" "}Smarter.
            </span>

            <br />

            Pay Faster.

          </h1>

          <p className="mt-8 max-w-xl text-xl leading-9 text-gray-600">

            Buy Airtime, Data, Electricity Tokens and TV
            subscriptions instantly with AbuPay.

            Fast, Secure and Reliable.

          </p>

          <div className="mt-10 flex flex-wrap gap-5">

            <Link
              href="/register"
              className="flex items-center gap-3 rounded-xl bg-emerald-600 px-8 py-4 font-semibold text-white shadow-xl transition hover:bg-emerald-700"
            >
              Get Started

              <ArrowRight size={20} />
            </Link>

            <Link
              href="/login"
              className="rounded-xl border border-emerald-600 px-8 py-4 font-semibold text-emerald-700 hover:bg-emerald-50"
            >
              Login
            </Link>

          </div>

          <div className="mt-12 flex flex-wrap gap-8">

            <div className="flex items-center gap-3">

              <Zap className="text-yellow-500" />

              Instant Delivery

            </div>

            <div className="flex items-center gap-3">

              <Wallet className="text-emerald-600" />

              Secure Wallet

            </div>

            <div className="flex items-center gap-3">

              <ShieldCheck className="text-blue-600" />

              Safe Payments

            </div>

          </div>

        </div>

        {/* Right */}

        <div className="relative">

          <img
            src="/hero-fintech.png"
            alt="AbuPay"
            className="w-full"
          />

        </div>

      </div>

    </section>
  );
}