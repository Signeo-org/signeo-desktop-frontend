// src/components/ui/NeuSelect.tsx
import { SelectHTMLAttributes, ReactNode } from "react";

interface NeuSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  /** Label text */
  label?: string;
  /** Icon element to display before label */
  icon?: ReactNode;
  /** Use dark mode styles */
  darkMode?: boolean;
  /** Error state */
  error?: boolean;
}

/**
 * Neumorphic select/dropdown with glassmorphism styling.
 * Features subtle inset shadows when focused.
 */
export function NeuSelect({
  label,
  icon,
  darkMode = false,
  error = false,
  className = "",
  children,
  ...props
}: NeuSelectProps) {
  const baseClasses = `
    w-full px-4 py-3 rounded-xl backdrop-blur border
    transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-[#FDB813]/50
  `;

  const themeClasses = darkMode
    ? `bg-slate-900/40 border-slate-700 text-slate-200
       focus:shadow-[inset_2px_2px_4px_#0f172a,inset_-2px_-2px_4px_#2d3e56]`
    : `bg-white/60 border-white/70 text-[#2c3e50]
       focus:shadow-[inset_2px_2px_4px_#c5cad1,inset_-2px_-2px_4px_#ffffff]`;

  const errorClasses = error ? "border-red-500 focus:ring-red-500/50" : "";

  return (
    <div className={className}>
      {label && (
        <label
          className={`flex items-center gap-2 text-sm font-semibold mb-2 transition-colors duration-300 ${
            darkMode ? "text-slate-100" : "text-[#2c3e50]"
          }`}
        >
          {icon && <span className="text-[#FDB813]">{icon}</span>}
          {label}
        </label>
      )}
      <select
        className={`${baseClasses} ${themeClasses} ${errorClasses}`}
        {...props}
      >
        {children}
      </select>
    </div>
  );
}

export default NeuSelect;
