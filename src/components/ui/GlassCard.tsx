// src/components/ui/GlassCard.tsx
import { ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  /** Apply larger padding and radius for main containers */
  variant?: "default" | "large";
  /** Use dark mode styles */
  darkMode?: boolean;
}

/**
 * Glassmorphism + Neumorphism card component.
 * Features backdrop blur, subtle gradients, and soft shadows.
 */
export function GlassCard({
  children,
  className = "",
  variant = "default",
  darkMode = false,
}: GlassCardProps) {
  const isLarge = variant === "large";

  const baseClasses = `
    relative backdrop-blur-2xl border transition-all duration-300
    ${isLarge ? "rounded-2xl sm:rounded-[2.5rem] p-6 sm:p-8 md:p-12" : "rounded-xl sm:rounded-2xl p-4 sm:p-6"}
  `;

  const themeClasses = darkMode
    ? `bg-slate-800/40 border-slate-700/50 
       shadow-[20px_20px_60px_#0a0f1a,-20px_-20px_60px_#1e293b]`
    : `bg-white/40 border-white/50 
       shadow-[20px_20px_60px_#bebebe,-20px_-20px_60px_#ffffff]`;

  return (
    <div className={`${baseClasses} ${themeClasses} ${className}`}>
      {children}
    </div>
  );
}

export default GlassCard;
