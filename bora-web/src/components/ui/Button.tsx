// Button: Shared button component
// TODO: Support variants (primary, secondary, ghost, danger)
// TODO: Support sizes (sm, md, lg)

import { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}: ButtonProps) {
  const base = "rounded-lg font-medium transition-colors";
  const variants = {
    primary: "bg-bora-blue text-white hover:bg-bora-blue/90",
    secondary: "bg-bora-blue-light text-bora-blue hover:bg-bora-blue hover:text-white",
    ghost: "text-slate hover:bg-bora-blue-light",
    danger: "bg-red-500 text-white hover:bg-red-600",
  };
  const sizes = {
    sm: "px-2 py-1 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
