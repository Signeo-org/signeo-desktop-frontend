// src/components/ui/NeuToggle.tsx
import { ReactNode } from "react";

interface NeuToggleProps {
  /** Current state */
  enabled: boolean;
  /** Toggle callback */
  onToggle: () => void;
  /** Label text */
  label?: string;
  /** Icon element */
  icon?: ReactNode;
  /** Use dark mode styles */
  darkMode?: boolean;
  /** Accent color when enabled */
  accentColor?: "gold" | "emerald" | "amber" | "red";
}

/**
 * Neumorphic toggle button with gradient states.
 */
export function NeuToggle({
  enabled,
  onToggle,
  label,
  icon,
  darkMode = false,
  accentColor = "gold",
}: NeuToggleProps) {
  const accentClasses = {
    gold: {
      enabled: darkMode
        ? "bg-gradient-to-br from-[#FDB813] to-[#F4A320] text-black shadow-[4px_4px_12px_#b08310,-4px_-4px_12px_#ffc520]"
        : "bg-gradient-to-br from-[#FDB813] to-[#F4A320] text-black shadow-[4px_4px_12px_#d99a10,-4px_-4px_12px_#ffd020]",
    },
    emerald: {
      enabled: darkMode
        ? "bg-gradient-to-br from-[#10b981] to-[#059669] text-white shadow-[4px_4px_12px_#047857,-4px_-4px_12px_#14b885]"
        : "bg-gradient-to-br from-[#10b981] to-[#059669] text-white shadow-[4px_4px_12px_#059669,-4px_-4px_12px_#34d399]",
    },
    amber: {
      enabled: darkMode
        ? "bg-gradient-to-br from-[#f59e0b] to-[#d97706] text-white shadow-[4px_4px_12px_#b45309,-4px_-4px_12px_#fbbf24]"
        : "bg-gradient-to-br from-[#f59e0b] to-[#d97706] text-white shadow-[4px_4px_12px_#d97706,-4px_-4px_12px_#fbbf24]",
    },
    red: {
      enabled: darkMode
        ? "bg-gradient-to-br from-[#ef4444] to-[#dc2626] text-white shadow-[4px_4px_12px_#be3c3c,-4px_-4px_12px_#ff5252]"
        : "bg-gradient-to-br from-[#ef4444] to-[#dc2626] text-white shadow-[4px_4px_12px_#be3c3c,-4px_-4px_12px_#ff5252]",
    },
  };

  const disabledClasses = darkMode
    ? "bg-[#1e293b] text-slate-400 shadow-[4px_4px_8px_#0f172a,-4px_-4px_8px_#2d3e56]"
    : "bg-[#e0e5ec] text-[#5a6c7d] shadow-[4px_4px_8px_#c5cad1,-4px_-4px_8px_#ffffff]";

  return (
    <div className="flex flex-col items-center gap-4">
      {icon && (
        <div
          className={`p-3 rounded-full ${
            darkMode ? `bg-${accentColor}-500/20` : `bg-${accentColor}-500/10`
          }`}
        >
          {icon}
        </div>
      )}
      
      {label && (
        <span
          className={`font-semibold ${
            darkMode ? "text-slate-100" : "text-[#2c3e50]"
          }`}
        >
          {label}
        </span>
      )}
      
      <button
        onClick={onToggle}
        className={`
          w-full py-3 px-4 rounded-xl font-medium
          transition-all duration-200
          ${enabled ? accentClasses[accentColor].enabled : disabledClasses}
        `}
      >
        {enabled ? "Enabled" : "Disabled"}
      </button>
    </div>
  );
}

export default NeuToggle;
