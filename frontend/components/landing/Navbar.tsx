"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu } from "lucide-react";

export default function Navbar() {
  return (
    <header className="fixed top-0 z-50 w-full border-b border-gray-100 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">

        {/* Logo */}

        <Link
          href="/"
          className="flex items-center gap-3"
        >
          <Image
            src="/images/abupay-logo.png"
            alt="AbuPay Logo"
            width={140}
            height={50}
            priority
          />

          <div>
            <p className="text-xs text-gray-500">
              Fast • Secure • Reliable
            </p>
          </div>
        </Link>

        {/* Desktop Menu */}

        <nav className="hidden items-center gap-10 lg:flex">

          <a
            href="#services"
            className="font-medium hover:text-emerald-600"
          >
            Services
          </a>

          <a
            href="#why"
            className="font-medium hover:text-emerald-600"
          >
            Why Us
          </a>

          <a
            href="#reviews"
            className="font-medium hover:text-emerald-600"
          >
            Reviews
          </a>

          <a
            href="#faq"
            className="font-medium hover:text-emerald-600"
          >
            FAQ
          </a>

        </nav>

        {/* Right Side */}

        <div className="hidden items-center gap-4 lg:flex">

          <Link
            href="/login"
            className="rounded-xl px-5 py-3 font-medium hover:bg-gray-100"
          >
            Login
          </Link>

          <Link
            href="/register"
            className="rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white shadow-lg transition hover:bg-emerald-700"
          >
            Get Started
          </Link>

        </div>

        {/* Mobile */}

        <button className="lg:hidden">
          <Menu size={28} />
        </button>

      </div>
    </header>
  );
}