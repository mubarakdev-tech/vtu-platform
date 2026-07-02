import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function CallToAction() {
  return (
    <section className="bg-blue-700 py-24 text-white">
      <div className="mx-auto max-w-5xl px-6 text-center">

        <h2 className="text-4xl font-bold">
          Ready to Get Started?
        </h2>

        <p className="mt-5 text-lg text-blue-100">
          Join thousands of Nigerians using our
          VTU Platform every day.
        </p>

        <Link href="/auth/register">
          <Button
            className="mt-8"
            size="lg"
            variant="secondary"
          >
            Create Free Account
          </Button>
        </Link>

      </div>
    </section>
  );
}