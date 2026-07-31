import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
}

export default function Card({
  children,
  className = "",
}: CardProps) {
  return (
    <div
      className={`rounded-2xl bg-white shadow-sm border border-gray-100 p-6 ${className}`}
    >
      {children}
    </div>
  );
}