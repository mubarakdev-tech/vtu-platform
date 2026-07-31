"use client";

import { ReactNode } from "react";

interface AuthCardProps {
  children: ReactNode;
}

export default function AuthCard({
  children,
}: AuthCardProps) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
      {children}
    </div>
  );
}