import Link from "next/link";
import { MessageSquareText } from "lucide-react";

export default function Testimonials() {
  return (
    <section
      id="reviews"
      className="scroll-mt-24 bg-gray-50 py-24"
    >
      <div className="mx-auto max-w-5xl px-6">

        <div className="text-center">

          <h2 className="text-4xl font-bold text-gray-900">
            Customer Reviews
          </h2>

          <p className="mt-4 text-lg text-gray-600">
            We believe trust is built through genuine customer experiences.
            Only verified testimonials from AbuPay users will be displayed here.
          </p>

        </div>


        <div className="mt-12 rounded-3xl border border-dashed border-gray-300 bg-white p-12 text-center shadow-sm">

          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">

            <MessageSquareText
              className="text-emerald-600"
              size={40}
            />

          </div>


          <h3 className="mt-6 text-2xl font-bold text-gray-900">
            No Reviews Yet
          </h3>


          <p className="mx-auto mt-4 max-w-2xl leading-8 text-gray-600">
            AbuPay has not received any verified customer reviews yet.
            After completing a successful transaction, customers will be able
            to share their experience. Approved reviews will appear here.
          </p>


          <div className="mt-8">

            <Link
              href="/login"
              className="rounded-xl bg-emerald-600 px-8 py-4 font-semibold text-white transition hover:bg-emerald-700"
            >
              Share Your Experience
            </Link>

          </div>


          <p className="mt-5 text-sm text-gray-500">
            Only verified and approved customer reviews are published.
          </p>


        </div>


      </div>
    </section>
  );
}