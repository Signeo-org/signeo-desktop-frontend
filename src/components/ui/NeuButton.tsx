// src/components/ui/NeuButton.tsx
import { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "success" | "danger" | "secondary";

interface NeuButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  /** Button style variant */
  variant?: ButtonVariant;
  /** Size preset */
  size?: "sm" | "md" | "lg";
  /** Use dark mode styles */
  darkMode?: boolean;
  /** Show loading state */
  loading?: boolean;
  /** Full width button */
  fullWidth?: boolean;
}

/**
 * Neumorphic button with gradient backgrounds and soft shadows.
 * Features hover/active states with shadow depth changes.
 */
export function NeuButton({
  children,
  variant = "primary",
  size = "md",
  darkMode = false,
  loading = false,
  fullWidth = false,
  className = "",
  disabled,
  ...props
}: NeuButtonProps) {
  const sizeClasses = {
    sm: "py-2 px-4 text-sm rounded-xl",
    md: "py-3 px-6 text-base rounded-2xl",
    lg: "py-6 px-8 text-lg rounded-3xl",
  };

  const variantClasses = {
    primary: `
      bg-gradient-to-br from-[#FDB813] to-[#F4A320] text-black
      shadow-[8px_8px_20px_#d99a10,-8px_-8px_20px_#ffd020]
      hover:shadow-[6px_6px_16px_#d99a10,-6px_-6px_16px_#ffd020]
      active:shadow-[inset_4px_4px_8px_#d99a10,inset_-4px_-4px_8px_#ffd020]
    `,
    success: `
      bg-gradient-to-br from-[#10b981] to-[#059669] text-white
      shadow-[8px_8px_20px_#047857,-8px_-8px_20px_#14b885]
      hover:shadow-[6px_6px_16px_#047857,-6px_-6px_16px_#14b885]
      active:shadow-[inset_4px_4px_8px_#047857,inset_-4px_-4px_8px_#14b885]
    `,
    danger: `
      bg-gradient-to-br from-[#ef4444] to-[#dc2626] text-white
      shadow-[8px_8px_20px_#be3c3c,-8px_-8px_20px_#ff5252]
      hover:shadow-[6px_6px_16px_#be3c3c,-6px_-6px_16px_#ff5252]
      active:shadow-[inset_4px_4px_8px_#be3c3c,inset_-4px_-4px_8px_#ff5252]
    `,
    secondary: darkMode
      ? `bg-[#1e293b] text-slate-300
         shadow-[6px_6px_12px_#0f172a,-6px_-6px_12px_#2d3e56]
         hover:shadow-[4px_4px_8px_#0f172a,-4px_-4px_8px_#2d3e56]
         active:shadow-[inset_3px_3px_6px_#0f172a,inset_-3px_-3px_6px_#2d3e56]`
      : `bg-[#e0e5ec] text-[#5a6c7d]
         shadow-[6px_6px_12px_#c5cad1,-6px_-6px_12px_#ffffff]
         hover:shadow-[4px_4px_8px_#c5cad1,-4px_-4px_8px_#ffffff]
         active:shadow-[inset_3px_3px_6px_#c5cad1,inset_-3px_-3px_6px_#ffffff]`,
  };

  return (
    <button
      className={`
        group relative font-semibold
        transition-all duration-200 transform
        hover:scale-[1.02] active:scale-[0.98]
        disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${fullWidth ? "w-full" : ""}
        ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {/* Inner glow overlay */}
      <div className="absolute inset-0 rounded-inherit bg-gradient-to-br from-white/20 to-transparent opacity-50 pointer-events-none" />
      
      {/* Content */}
      <span className="relative flex items-center justify-center gap-2">
        {loading ? (
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        ) : (
          children
        )}
      </span>
    </button>
  );
}

export default NeuButton;
