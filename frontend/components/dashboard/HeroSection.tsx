"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Smartphone,
  Wifi,
  Wallet,
  Zap,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

interface BannerSlide {
  id: number;
  title: string;
  highlight: string;
  description: string;
  badge: string;
  icon: React.ElementType;
  secondaryIcon: React.ElementType;
  accent: string;
}

const slides: BannerSlide[] = [
  {
    id: 1,
    title: "Stay Connected with",
    highlight: "Airtime",
    description:
      "Recharge your phone instantly with fast, secure and reliable airtime purchases.",
    badge: "AIRTIME",
    icon: Smartphone,
    secondaryIcon: CheckCircle2,
    accent: "from-blue-500 to-cyan-400",
  },
  {
    id: 2,
    title: "Never Run Out of",
    highlight: "Data",
    description:
      "Get affordable data bundles from your favourite network whenever you need them.",
    badge: "DATA BUNDLES",
    icon: Wifi,
    secondaryIcon: Zap,
    accent: "from-emerald-500 to-teal-400",
  },
  {
    id: 3,
    title: "Fund Your",
    highlight: "Wallet",
    description:
      "Add money to your AbuPay wallet securely and enjoy seamless digital payments.",
    badge: "WALLET",
    icon: Wallet,
    secondaryIcon: ShieldCheck,
    accent: "from-purple-500 to-indigo-400",
  },
  {
    id: 4,
    title: "Everything You Need with",
    highlight: "AbuPay",
    description:
      "A simple and convenient platform for your everyday digital payment needs.",
    badge: "ABUPAY",
    icon: Sparkles,
    secondaryIcon: CheckCircle2,
    accent: "from-orange-500 to-amber-400",
  },
];

export default function HeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const hour = new Date().getHours();

  const greeting =
    hour < 12
      ? "Good Morning"
      : hour < 17
      ? "Good Afternoon"
      : "Good Evening";

  // =====================================================
  // AUTOMATIC SLIDE TRANSITION
  // =====================================================

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) =>
        prev === slides.length - 1
          ? 0
          : prev + 1
      );
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const slide = slides[currentSlide];

  const MainIcon = slide.icon;
  const SecondaryIcon = slide.secondaryIcon;

  // =====================================================
  // MANUAL SLIDE CHANGE
  // =====================================================

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  return (
    <motion.section
      initial={{
        opacity: 0,
        y: 25,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.6,
      }}
      className="overflow-hidden rounded-3xl bg-white shadow-xl"
    >
      {/* =================================================
          HERO
      ================================================= */}

      <div className="relative overflow-hidden bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500 px-6 py-8 text-white sm:px-8 sm:py-10">

        {/* =================================================
            BACKGROUND DECORATIONS
        ================================================= */}

        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />

        <div className="pointer-events-none absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-cyan-300/10 blur-3xl" />

        <div className="pointer-events-none absolute right-1/3 top-1/2 h-40 w-40 rounded-full bg-blue-300/10 blur-3xl" />

        {/* =================================================
            CONTENT
        ================================================= */}

        <div className="relative grid items-center gap-10 lg:grid-cols-2">

          {/* =================================================
              LEFT SIDE
          ================================================= */}

          <div>

            {/* Greeting */}

            <motion.span
              initial={{
                opacity: 0,
                y: 10,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                delay: 0.2,
              }}
              className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur"
            >
              👋 {greeting}
            </motion.span>

            {/* Main Heading */}

            <motion.h1
              initial={{
                opacity: 0,
                y: 15,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                delay: 0.3,
              }}
              className="mt-5 text-3xl font-extrabold leading-tight sm:text-4xl lg:text-5xl"
            >
              Welcome back to{" "}
              <span className="text-emerald-300">
                AbuPay
              </span>
            </motion.h1>

            {/* Description */}

            <motion.p
              initial={{
                opacity: 0,
                y: 15,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                delay: 0.4,
              }}
              className="mt-4 max-w-xl text-base leading-7 text-blue-100 sm:text-lg sm:leading-8"
            >
              Fast, secure and reliable digital
              payments. Buy airtime and data,
              manage your wallet and enjoy a
              simple payment experience.
            </motion.p>

            {/* Trust Indicators */}

            <motion.div
              initial={{
                opacity: 0,
              }}
              animate={{
                opacity: 1,
              }}
              transition={{
                delay: 0.6,
              }}
              className="mt-6 flex flex-wrap gap-3"
            >

              <div className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-medium backdrop-blur">
                <ShieldCheck
                  size={15}
                  className="text-emerald-300"
                />
                Secure Payments
              </div>

              <div className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-medium backdrop-blur">
                <CheckCircle2
                  size={15}
                  className="text-emerald-300"
                />
                Fast & Reliable
              </div>

            </motion.div>

          </div>

          {/* =================================================
              RIGHT SIDE - TRANSITION BANNER
          ================================================= */}

          <div className="relative flex min-h-[280px] items-center justify-center lg:min-h-[320px]">

            <AnimatePresence mode="wait">

              <motion.div
                key={slide.id}
                initial={{
                  opacity: 0,
                  x: 50,
                  scale: 0.95,
                }}
                animate={{
                  opacity: 1,
                  x: 0,
                  scale: 1,
                }}
                exit={{
                  opacity: 0,
                  x: -50,
                  scale: 0.95,
                }}
                transition={{
                  duration: 0.5,
                  ease: "easeInOut",
                }}
                className="w-full max-w-md"
              >

                {/* Banner Card */}

                <div className="relative overflow-hidden rounded-3xl border border-white/20 bg-white/10 p-6 shadow-2xl backdrop-blur-xl sm:p-8">

                  {/* Card Glow */}

                  <div
                    className={`absolute -right-16 -top-16 h-40 w-40 rounded-full bg-gradient-to-br ${slide.accent} opacity-30 blur-3xl`}
                  />

                  <div
                    className={`absolute -bottom-20 -left-16 h-40 w-40 rounded-full bg-gradient-to-br ${slide.accent} opacity-20 blur-3xl`}
                  />

                  <div className="relative">

                    {/* Badge */}

                    <div className="mb-6 flex items-center justify-between">

                      <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold tracking-wide">
                        {slide.badge}
                      </span>

                      <div className="flex items-center gap-2 text-xs text-blue-100">
                        <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-300" />
                        Available
                      </div>

                    </div>

                    {/* Main Icon */}

                    <div className="flex items-center gap-5">

                      <motion.div
                        animate={{
                          y: [0, -7, 0],
                          rotate: [0, 2, 0],
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                        className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br ${slide.accent} shadow-2xl`}
                      >
                        <MainIcon
                          size={38}
                          className="text-white"
                        />
                      </motion.div>

                      <div>

                        <p className="text-sm font-medium text-blue-100">
                          AbuPay
                        </p>

                        <h2 className="mt-1 text-2xl font-extrabold leading-tight sm:text-3xl">
                          {slide.title}
                          <br />
                          <span className="text-emerald-300">
                            {slide.highlight}
                          </span>
                        </h2>

                      </div>

                    </div>

                    {/* Description */}

                    <p className="mt-6 text-sm leading-6 text-blue-100">
                      {slide.description}
                    </p>

                    {/* Bottom Information */}

                    <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-5">

                      <div className="flex items-center gap-2 text-xs font-medium text-blue-100">

                        <SecondaryIcon
                          size={16}
                          className="text-emerald-300"
                        />

                        Trusted & Secure

                      </div>

                      <div className="flex items-center gap-2 text-xs font-semibold text-white">
                        Explore
                        <ArrowRight size={15} />
                      </div>

                    </div>

                  </div>

                </div>

              </motion.div>

            </AnimatePresence>

            {/* =================================================
                SLIDE INDICATORS
            ================================================= */}

            <div className="absolute -bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-2">

              {slides.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  aria-label={`Go to slide ${
                    index + 1
                  }`}
                  onClick={() =>
                    goToSlide(index)
                  }
                  className={`h-2 rounded-full transition-all duration-300 ${
                    currentSlide === index
                      ? "w-8 bg-white"
                      : "w-2 bg-white/40 hover:bg-white/70"
                  }`}
                />
              ))}

            </div>

          </div>

        </div>
      </div>

      {/* =================================================
          ANNOUNCEMENT
      ================================================= */}

      <div className="border-t bg-gradient-to-r from-emerald-50 to-cyan-50 p-5 sm:p-6">

        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

          {/* Announcement Content */}

          <div className="flex gap-4">

            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-100">

              <Bell
                className="text-emerald-600"
                size={26}
              />

            </div>

            <div>

              <div className="flex flex-wrap items-center gap-3">

                <h3 className="text-lg font-bold text-gray-900 sm:text-xl">
                  AbuPay Announcement
                </h3>

                <span className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-white">
                  NEW
                </span>

              </div>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600 sm:text-base sm:leading-7">
                Welcome to AbuPay. Airtime and
                Data services are fully operational.
                Wallet funding with Paystack is
                available, while Electricity Bills,
                TV Subscription, Referral Rewards
                and other premium features will be
                introduced soon.
              </p>

            </div>

          </div>

        </div>

      </div>
    </motion.section>
  );
}