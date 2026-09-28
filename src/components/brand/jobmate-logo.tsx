import React from "react";
import { cn } from "@/lib/utils";

interface JobMateLogoProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  showText?: boolean;
  animated?: boolean;
}

const SIZE_MAP = {
  xs: { icon: "size-6", text: "text-base", badge: "size-6", img: "size-6 rounded-md" },
  sm: { icon: "size-8", text: "text-lg", badge: "size-8", img: "size-8 rounded-lg" },
  md: { icon: "size-9", text: "text-xl", badge: "size-9", img: "size-9 rounded-xl" },
  lg: { icon: "size-11", text: "text-2xl", badge: "size-11", img: "size-11 rounded-xl" },
  xl: { icon: "size-14", text: "text-3xl", badge: "size-14", img: "size-14 rounded-2xl" },
};

/**
 * Premium YC-Styled AI Emblem for JobMate AI
 */
export function JobMateEmblem({ className, size = "md" }: { className?: string; size?: keyof typeof SIZE_MAP }) {
  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden shadow-md shadow-indigo-600/25 ring-1 ring-white/20 transition-transform duration-200 group-hover:scale-105",
        SIZE_MAP[size].badge,
        SIZE_MAP[size].img,
        className
      )}
    >
      <img
        src="/jobmate.png"
        alt="JobMate AI Logo"
        className="w-full h-full object-cover select-none"
        onError={(e) => {
          // Fallback if image path not yet loaded
          (e.target as HTMLElement).style.display = "none";
        }}
      />
    </div>
  );
}

/**
 * Full JobMate Brand Logo with Typography
 */
export function JobMateLogo({
  size = "md",
  className,
  showText = true,
  animated = false,
}: JobMateLogoProps) {
  return (
    <div className={cn("flex items-center gap-2.5 font-sans select-none group", className)}>
      <JobMateEmblem size={size} className={animated ? "animate-pulse" : ""} />
      {showText && (
        <span
          className={cn(
            "font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center leading-none",
            SIZE_MAP[size].text
          )}
        >
          Job<span className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 bg-clip-text text-transparent">Mate</span>
          <span className="ml-1.5 rounded-md bg-indigo-50 dark:bg-indigo-950/80 px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">
            AI
          </span>
        </span>
      )}
    </div>
  );
}
