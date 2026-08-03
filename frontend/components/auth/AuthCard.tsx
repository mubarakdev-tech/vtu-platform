"use client";

import { ReactNode } from "react";

interface AuthCardProps {
  children: ReactNode;
}

export default function AuthCard({
  children,
}: AuthCardProps) {
  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-xl transition-all duration-300 hover:shadow-2xl">
      {children}
    </div>
  );
}