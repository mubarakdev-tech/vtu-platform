"use client";

import {
  ButtonHTMLAttributes,
  ReactNode,
} from "react";
import clsx from "clsx";

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  loading?: boolean;
  fullWidth?: boolean;

  variant?:
    | "primary"
    | "secondary"
    | "outline"
    | "ghost";

  size?: "sm" | "default" | "lg" | "icon-sm";
}

function Button({
  children,
  loading = false,
  fullWidth = false,
  variant = "primary",
  size = "default",
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

    ghost:
      "bg-transparent text-gray-700 hover:bg-gray-100",
  };

  const sizes = {
    sm: "px-4 py-2 text-sm",

    default:
      "px-6 py-3",

    lg:
      "px-8 py-4 text-lg",

    "icon-sm":
      "h-8 w-8 p-1.5",
  };

  return (
    <button
      disabled={disabled || loading}
      className={clsx(
        "rounded-xl font-semibold transition duration-300 disabled:cursor-not-allowed disabled:opacity-60",
        styles[variant],
        sizes[size],
        fullWidth && "w-full",
        className
      )}
      {...props}
    >
      {loading ? "Please wait..." : children}
    </button>
  );
}

export { Button };
export default Button;