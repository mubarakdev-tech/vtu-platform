import Link from "next/link";
import {
  ArrowRight,
  ShieldCheck,
  Wallet,
  Zap,
  Smartphone,
  Wifi,
  Tv,
  Lightbulb,
} from "lucide-react";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-teal-50 pt-40 pb-24">
      <div className="mx-auto grid max-w-7xl items-center gap-16 px-6 lg:grid-cols-2">

        {/* Left */}

        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-5 py-2 text-sm font-semibold text-emerald-700">
            <ShieldCheck size={18} />
            Nigeria's Trusted VTU Platform
          </div>

          <h1 className="text-5xl font-black leading-tight text-gray-900 lg:text-7xl">
            Recharge
            <span className="text-emerald-600"> Smarter.</span>
            <br />
            Pay Faster.
          </h1>

          <p className="mt-8 max-w-xl text-xl leading-9 text-gray-600">
            Buy Airtime, Data Bundles, Electricity Bills and TV
            subscriptions instantly with AbuPay.
            <br />
            Fast, secure and reliable digital payment services built for Nigerians.
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
              Easy Wallet Funding
            </div>

            <div className="flex items-center gap-3">
              <ShieldCheck className="text-blue-600" />
              Secure Payments
            </div>
          </div>
        </div>

        {/* Right */}

        <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-2xl">

          <h2 className="mb-2 text-2xl font-bold text-gray-900">
            Available Services
          </h2>

          <p className="mb-8 text-gray-600">
            Everything you need in one secure platform.
          </p>

          <div className="space-y-4">

            <div className="flex items-center gap-4 rounded-2xl bg-emerald-50 p-4">
              <Smartphone className="text-emerald-600" />
              <span className="font-medium">Airtime Recharge</span>
            </div>

            <div className="flex items-center gap-4 rounded-2xl bg-sky-50 p-4">
              <Wifi className="text-sky-600" />
              <span className="font-medium">Data Bundles</span>
            </div>

            <div className="flex items-center gap-4 rounded-2xl bg-amber-50 p-4">
              <Lightbulb className="text-amber-600" />
              <span className="font-medium">Electricity Bills</span>
            </div>

            <div className="flex items-center gap-4 rounded-2xl bg-purple-50 p-4">
              <Tv className="text-purple-600" />
              <span className="font-medium">TV Subscription</span>
            </div>

          </div>

          <div className="mt-8 rounded-2xl bg-emerald-50 p-5">
            <h3 className="mb-3 font-semibold text-emerald-700">
              Why Choose AbuPay?
            </h3>

            <ul className="space-y-2 text-sm text-gray-700">
              <li>⚡ Fast service delivery</li>
              <li>🔒 Secure payment processing</li>
              <li>💳 Easy wallet funding</li>
              <li>🇳🇬 Designed for users across Nigeria</li>
            </ul>
          </div>

        </div>

      </div>
    </section>
  );
}