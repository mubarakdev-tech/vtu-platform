"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

        {/* LOGO */}
        <Link
          href="/"
          className="flex items-center shrink-0"
          aria-label="AbuPay Home"
        >
          <Image
            src="/images/abupay-logo.png"
            alt="AbuPay"
            width={150}
            height={50}
            priority
            className="h-11 w-auto object-contain"
          />
        </Link>

        {/* Only Login & Register buttons (no Services/Pricing/Contact) */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link href="/auth/login">
            <Button
              variant="outline"
              className="px-4 py-2.5 text-sm sm:px-5"
            >
              Login
            </Button>
          </Link>

          <Link href="/register">
            <Button className="px-4 py-2.5 text-sm sm:px-5">
              Register
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}