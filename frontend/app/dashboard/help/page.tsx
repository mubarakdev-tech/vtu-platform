"use client";

import Link from "next/link";
import {
  Mail,
  Wallet,
  Smartphone,
  Wifi,
  CreditCard,
  HelpCircle,
  ArrowLeft,
  MessageCircle,
} from "lucide-react";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const supportEmail = "assistance.abupayng@outlook.com";
const instagramUrl = "https://www.instagram.com/abupayng/";

const faqItems = [
  {
    question: "How do I fund my AbuPay wallet?",
    answer:
      "Go to Wallet, select the amount you want to fund, and follow the payment instructions. Your wallet will be credited after the payment is successfully verified.",
  },
  {
    question: "My wallet was debited but my purchase failed. What should I do?",
    answer:
      "Please check your transaction history first. If the transaction failed and your wallet was still debited, contact AbuPay Support with your transaction details so we can investigate.",
  },
  {
    question: "How do I buy airtime?",
    answer:
      "Open Airtime from the dashboard, select your network, enter the phone number and amount, then confirm the purchase.",
  },
  {
    question: "How do I buy data?",
    answer:
      "Open Data from the dashboard, select your network and preferred data plan, enter the phone number, and confirm the purchase.",
  },
  {
    question: "Where can I see my transactions?",
    answer:
      "Open Transactions from the dashboard to view your recent wallet and service transactions.",
  },
];

export default function HelpPage() {
  return (
    <DashboardLayout>
      <div className="mx-auto max-w-5xl space-y-8">
        {/* ==========================================
            HEADER
        ========================================== */}

        <div>
          <Link
            href="/dashboard"
            className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-emerald-600 transition hover:text-emerald-700"
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </Link>

          <h1 className="text-3xl font-bold text-gray-900">
            Help & Support
          </h1>

          <p className="mt-2 text-gray-500">
            Need help with your AbuPay account, wallet or transactions?
            <br />
            We are here to assist you.
          </p>
        </div>

        {/* ==========================================
            CONTACT SUPPORT
        ========================================== */}

        <Card className="overflow-hidden border-0 shadow-md">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/20">
                <MessageCircle size={24} />
              </div>

              <div>
                <h2 className="text-xl font-bold">
                  Contact AbuPay Support
                </h2>

                <p className="mt-1 text-sm text-emerald-50">
                  If you are experiencing a problem or need assistance,
                  contact our support team.
                </p>
              </div>
            </div>
          </div>

          <CardContent className="p-6">
            {/* ==========================================
                EMAIL SUPPORT
            ========================================== */}

            <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-gray-50 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100">
                  <Mail
                    size={21}
                    className="text-emerald-600"
                  />
                </div>

                <div>
                  <p className="text-sm text-gray-500">
                    Support Email
                  </p>

                  <p className="break-all font-semibold text-gray-900">
                    {supportEmail}
                  </p>
                </div>
              </div>

              <a
                href={`mailto:${supportEmail}`}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                <Mail size={17} />
                Email Support
              </a>
            </div>

            {/* ==========================================
                INSTAGRAM SUPPORT
            ========================================== */}

            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 flex flex-col gap-4 rounded-xl border border-gray-200 bg-gray-50 p-5 transition hover:border-pink-300 hover:bg-pink-50 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-pink-100">
                  <span className="font-bold text-pink-600">
                    IG
                  </span>
                </div>

                <div>
                  <p className="text-sm text-gray-500">
                    Instagram
                  </p>

                  <p className="font-semibold text-gray-900">
                    @abupayng
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    Follow AbuPay or send us a message on Instagram.
                  </p>
                </div>
              </div>

              <span className="inline-flex items-center justify-center gap-2 rounded-xl bg-pink-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-pink-700">
                <span className="font-bold">IG</span>
                Visit Instagram
              </span>
            </a>

            <p className="mt-4 text-sm text-gray-500">
              When contacting support about a transaction, include your
              transaction reference and a short description of the problem.
            </p>
          </CardContent>
        </Card>

        {/* ==========================================
            COMMON SUPPORT TOPICS
        ========================================== */}

        <div>
          <h2 className="text-xl font-bold text-gray-900">
            What can we help you with?
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Select a topic below for quick guidance.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Wallet */}

          <Link href="/dashboard/wallet">
            <Card className="h-full border-0 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
              <CardContent className="flex gap-4 p-5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100">
                  <Wallet
                    size={21}
                    className="text-emerald-600"
                  />
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900">
                    Wallet & Funding
                  </h3>

                  <p className="mt-1 text-sm text-gray-500">
                    Get help with wallet funding and your wallet balance.
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Airtime */}

          <Link href="/dashboard/airtime">
            <Card className="h-full border-0 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
              <CardContent className="flex gap-4 p-5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100">
                  <Smartphone
                    size={21}
                    className="text-blue-600"
                  />
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900">
                    Airtime
                  </h3>

                  <p className="mt-1 text-sm text-gray-500">
                    Get help with airtime purchases and failed transactions.
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Data */}

          <Link href="/dashboard/data">
            <Card className="h-full border-0 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
              <CardContent className="flex gap-4 p-5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-100">
                  <Wifi
                    size={21}
                    className="text-purple-600"
                  />
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900">
                    Data
                  </h3>

                  <p className="mt-1 text-sm text-gray-500">
                    Get help with data plans and data purchases.
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Transactions */}

          <Link href="/dashboard/transactions">
            <Card className="h-full border-0 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
              <CardContent className="flex gap-4 p-5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-100">
                  <CreditCard
                    size={21}
                    className="text-orange-600"
                  />
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900">
                    Transactions
                  </h3>

                  <p className="mt-1 text-sm text-gray-500">
                    View your transaction history and check transaction status.
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* ==========================================
            FREQUENTLY ASKED QUESTIONS
        ========================================== */}

        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle
                size={20}
                className="text-emerald-600"
              />

              Frequently Asked Questions
            </CardTitle>

            <CardDescription>
              Quick answers to common AbuPay questions.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            {faqItems.map((item) => (
              <div
                key={item.question}
                className="rounded-xl border border-gray-200 p-5"
              >
                <h3 className="font-semibold text-gray-900">
                  {item.question}
                </h3>

                <p className="mt-2 text-sm leading-6 text-gray-500">
                  {item.answer}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* ==========================================
            STILL NEED HELP
        ========================================== */}

        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-6 text-center">
          <h2 className="text-lg font-bold text-gray-900">
            Still need help?
          </h2>

          <p className="mx-auto mt-2 max-w-xl text-sm text-gray-600">
            Our support team is available to help you with account,
            wallet, airtime, data and transaction issues.
          </p>

          <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href={`mailto:${supportEmail}`}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              <Mail size={17} />
              Contact AbuPay Support
            </a>

            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-pink-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-pink-700"
            >
              <span className="font-bold">IG</span>
              Instagram
            </a>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}