"use client";

import { ReactNode } from "react";
import Image from "next/image";

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
}

export default function AuthLayout({
  children,
  title,
  subtitle,
}: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-sky-100 px-4 py-10">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="mb-8 flex flex-col items-center">
          <Image
            src="/images/abupay-logo.png"
            alt="AbuPay Logo"
            width={120}
            height={120}
            priority
            className="rounded-2xl shadow-lg"
          />

          <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-gray-900">
            {title}
          </h1>

          <p className="mt-2 text-center text-gray-600">
            {subtitle}
          </p>
        </div>

        {/* Single Auth Card */}
        {children}

        {/* Footer */}
        <p className="mt-8 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} AbuPay. Fast • Secure • Reliable.
        </p>

      </div>
    </div>
  );
}