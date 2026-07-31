import React from "react";

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

const Button = ({
  children,
  onClick,
  className = "",
}: ButtonProps) => {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition ${className}`}
    >
      {children}
    </button>
  );
};

export default Button;