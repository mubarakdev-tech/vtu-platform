"use client";

import { ButtonHTMLAttributes, ReactNode } from "react";
import clsx from "clsx";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  loading?: boolean;
  fullWidth?: boolean;
  variant?: "primary" | "secondary" | "outline";
}

export default function Button({
  children,
  loading = false,
  fullWidth = false,
  variant = "primary",
  className,
  disabled,
  ...props
}: ButtonProps) {
  const styles = {
    primary:
      "bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg",

    secondary:
      "bg-slate-900 text-white hover:bg-slate-800",

    outline:
      "border border-emerald-600 text-emerald-700 hover:bg-emerald-50",
  };

  return (
    <button
      disabled={disabled || loading}
      className={clsx(
        "rounded-xl px-6 py-3 font-semibold transition duration-300 disabled:cursor-not-allowed disabled:opacity-60",
        styles[variant],
        fullWidth && "w-full",
        className
      )}
      {...props}
    >
      {loading ? "Please wait..." : children}
    </button>
  );
}