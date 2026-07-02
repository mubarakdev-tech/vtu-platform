import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Hero() {
  return (
    <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white">
      <div className="mx-auto flex max-w-7xl flex-col items-center px-6 py-28 text-center">
        <span className="rounded-full bg-white/20 px-4 py-2 text-sm">
          Fast • Secure • Reliable
        </span>

        <h1 className="mt-6 text-5xl font-bold leading-tight md:text-6xl">
          Nigeria's Trusted
          <br />
          VTU Platform
        </h1>

        <p className="mt-6 max-w-2xl text-lg text-blue-100">
          Buy Airtime, Data Bundles, Pay Electricity Bills,
          Subscribe to Cable TV and purchase Exam Pins
          instantly.
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link href="/auth/register">
            <Button size="lg">
              Get Started
            </Button>
          </Link>

          <Link href="/auth/login">
            <Button
              size="lg"
              variant="secondary"
            >
              Login
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}