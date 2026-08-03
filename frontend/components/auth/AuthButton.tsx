"use client";

import { ButtonHTMLAttributes } from "react";
import Spinner from "@/components/ui/Spinner";

interface AuthButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
}

export default function AuthButton({
  children,
  loading,
  disabled,
  ...props
}: AuthButtonProps) {
  return (
    <button
      {...props}
      disabled={loading || disabled}
      className="flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? (
        <Spinner />
      ) : (
        children
      )}
    </button>
  );
}