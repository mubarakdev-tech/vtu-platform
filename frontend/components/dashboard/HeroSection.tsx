"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Wallet,
  Smartphone,
  Bell,
  ArrowRight,
} from "lucide-react";

export default function HeroSection() {
  const hour = new Date().getHours();

  const greeting =
    hour < 12
      ? "Good Morning"
      : hour < 17
      ? "Good Afternoon"
      : "Good Evening";

  return (
    <motion.section
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="overflow-hidden rounded-3xl bg-white shadow-xl"
    >
      {/* ================= HERO ================= */}

      <div className="relative overflow-hidden bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500 px-8 py-10 text-white">

        {/* Decorative Blobs */}

        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />

        <div className="absolute -bottom-20 left-1/3 h-56 w-56 rounded-full bg-cyan-300/10 blur-3xl" />

        <div className="relative grid items-center gap-10 lg:grid-cols-2">

          {/* Left Side */}

          <div>

            <span className="inline-flex items-center rounded-full bg-white/15 px-4 py-2 text-sm font-medium backdrop-blur">

              👋 {greeting}

            </span>

            <h1 className="mt-6 text-4xl font-extrabold leading-tight lg:text-5xl">
              Welcome back to <span className="text-emerald-300">AbuPay</span>
            </h1>

            <p className="mt-5 max-w-xl text-lg leading-8 text-blue-100">
              Fast, secure and reliable digital payments.
              Buy airtime, data bundles, electricity tokens,
              TV subscriptions and manage your wallet
              from one trusted platform.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">

              <Link
                href="/wallet"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-semibold text-blue-700 shadow-lg transition hover:bg-blue-50"
              >
                <Wallet size={20} />
                Fund Wallet
              </Link>

              <Link
                href="/airtime"
                className="inline-flex items-center gap-2 rounded-xl border border-white/30 px-6 py-3 font-semibold text-white transition hover:bg-white/10"
              >
                <Smartphone size={20} />
                Buy Airtime
              </Link>

            </div>

          </div>

          {/* Right Side */}

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex justify-center"
          >

            <Image
              src="/images/dashboard/abupay-dashboard-banner.png"
              alt="AbuPay Dashboard Banner"
              width={700}
              height={500}
              priority
              className="h-auto w-full max-w-2xl rounded-2xl drop-shadow-2xl"
            />

          </motion.div>

        </div>

      </div>

      {/* ================= ANNOUNCEMENT ================= */}

      <div className="border-t bg-gradient-to-r from-emerald-50 to-cyan-50 p-6">

        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

          <div className="flex gap-4">

            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100">

              <Bell
                className="text-emerald-600"
                size={26}
              />

            </div>

            <div>

              <div className="flex items-center gap-3">

                <h3 className="text-xl font-bold text-gray-900">
                  AbuPay Announcement
                </h3>

                <span className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-white">
                  NEW
                </span>

              </div>

              <p className="mt-2 max-w-3xl leading-7 text-gray-600">
                Welcome to AbuPay.
                Airtime and Data services are fully operational.

                Wallet funding with Paystack,
                Electricity Bills,
                TV Subscription,
                Referral Rewards and more premium features
                will be available soon.
              </p>

            </div>

          </div>

          <button className="flex items-center gap-2 self-start rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700">

            Learn More

            <ArrowRight size={18} />

          </button>

        </div>

      </div>

    </motion.section>
  );
}