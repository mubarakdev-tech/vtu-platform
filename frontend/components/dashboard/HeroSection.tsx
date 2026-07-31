"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import Link from "next/link";

export default function HeroSection() {
  return (
    <section className="py-20">
      <div className="container mx-auto grid items-center gap-10 px-6 md:grid-cols-2">

        {/* Text Section */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl font-bold md:text-6xl">
            Fast & Secure Digital Payments
          </h1>

          <p className="mt-5 text-gray-600 text-lg">
            Buy airtime, data bundles, electricity and pay your bills
            easily with AbuPay.
          </p>

          <Link
            href="/dashboard"
            className="mt-8 inline-block rounded-lg bg-blue-600 px-6 py-3 text-white font-semibold hover:bg-blue-700"
          >
            Get Started
          </Link>
        </motion.div>


        {/* Image Section */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="flex justify-center"
        >
          <Image
            src="/images/hero-payment.png"
            width={600}
            height={600}
            alt="Digital payment platform"
            priority
          />
        </motion.div>

      </div>
    </section>
  );
}