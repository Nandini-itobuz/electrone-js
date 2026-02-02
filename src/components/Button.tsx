interface ButtonProps {
  variant?: "primary" | "secondary";
  type?: "button" | "submit";
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
}

export function Button({
  variant = "primary",
  type = "button",
  loading = false,
  disabled = false,
  className = "",
  children,
  onClick,
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`btn btn-${variant} ${className}`}
    >
      {children}
    </button>
  );
}
