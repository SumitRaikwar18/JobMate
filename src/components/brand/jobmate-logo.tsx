import React from "react";
import { cn } from "@/lib/utils";

export interface JobMateLogoProps {
  size?: ("xs" | "sm" | "md" | "lg" | "xl") | undefined;
  className?: string | undefined;
  showBadge?: boolean | undefined;
}

const HEIGHT_MAP = {
  xs: "h-6",
  sm: "h-7",
  md: "h-8 sm:h-9",
  lg: "h-10 sm:h-11",
  xl: "h-12 sm:h-14",
};

/**
 * Official JobMate Brand Logo
 * Displays the authentic jobmate-logo.png brand graphic with crisp scaling and responsive rendering.
 */
export function JobMateLogo({
  size = "md",
  className,
  showBadge = false,
}: JobMateLogoProps) {
  return (
    <div className={cn("inline-flex items-center gap-2 select-none group cursor-pointer", className)}>
      <img
        src="/jobmate-logo.png"
        alt="JobMate"
        className={cn(
          "w-auto object-contain transition-all duration-200 group-hover:opacity-95 select-none",
          HEIGHT_MAP[size]
        )}
        loading="eager"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          if (target.src.indexOf("jobmate.png") === -1) {
            target.src = "/jobmate.png";
          }
        }}
      />
      {showBadge && (
        <span className="rounded-md bg-indigo-50 dark:bg-indigo-950/80 px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">
          AI
        </span>
      )}
    </div>
  );
}

/**
 * Compact Emblem/Favicon variant if needed in small slots
 */
export function JobMateEmblem({
  size = "md",
  className,
}: {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  return (
    <JobMateLogo size={size} className={className} />
  );
}
