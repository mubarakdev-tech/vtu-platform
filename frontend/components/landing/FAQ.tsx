"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "How fast are transactions?",
    answer:
      "Most airtime, data and bill payments are completed within a few seconds.",
  },
  {
    question: "Which networks are supported?",
    answer:
      "MTN, Airtel, Glo, 9mobile, DStv, GOtv, Startimes and major electricity providers.",
  },
  {
    question: "Is AbuPay secure?",
    answer:
      "Yes. AbuPay is built with modern security practices to protect your account and transactions.",
  },
  {
    question: "Can I fund my wallet?",
    answer:
      "Yes. Wallet funding allows faster and easier purchases across all services.",
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section
      id="faq"
      className="bg-white py-24"
    >
      <div className="mx-auto max-w-4xl px-6">

        <div className="text-center">

          <span className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700">
            FAQ
          </span>

          <h2 className="mt-6 text-5xl font-bold">
            Frequently Asked Questions
          </h2>

        </div>

        <div className="mt-16 space-y-5">

          {faqs.map((faq, index) => (

            <div
              key={faq.question}
              className="rounded-2xl border"
            >

              <button
                onClick={() =>
                  setOpen(open === index ? null : index)
                }
                className="flex w-full items-center justify-between p-6 text-left"
              >

                <span className="font-semibold">
                  {faq.question}
                </span>

                <ChevronDown
                  className={`transition ${
                    open === index ? "rotate-180" : ""
                  }`}
                />

              </button>

              {open === index && (

                <div className="px-6 pb-6 text-gray-600 leading-8">

                  {faq.answer}

                </div>

              )}

            </div>

          ))}

        </div>

      </div>
    </section>
  );
}