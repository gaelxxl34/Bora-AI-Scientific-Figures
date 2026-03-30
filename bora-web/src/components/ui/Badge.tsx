// Badge: Small status/label badge
// TODO: Support color variants

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "ai" | "warning";
}

export function Badge({ children, variant = "default" }: BadgeProps) {
  const variants = {
    default: "bg-bora-blue-light text-bora-blue",
    success: "bg-teal-light text-science-teal",
    ai: "bg-violet-light text-deep-violet",
    warning: "bg-yellow-100 text-yellow-800",
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${variants[variant]}`}>
      {children}
    </span>
  );
}
