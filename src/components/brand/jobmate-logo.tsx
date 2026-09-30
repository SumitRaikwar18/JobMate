import React from "react";
import { cn } from "@/lib/utils";

export interface JobMateLogoProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  showText?: boolean;
  animated?: boolean;
}

const SIZE_MAP = {
  xs: { badge: "size-6", img: "size-6 rounded-md", text: "text-sm", badgeTag: "text-[8px] px-1" },
  sm: { badge: "size-8", img: "size-8 rounded-lg", text: "text-base", badgeTag: "text-[9px] px-1.5" },
  md: { badge: "size-9", img: "size-9 rounded-xl", text: "text-xl", badgeTag: "text-[10px] px-1.5" },
  lg: { badge: "size-11", img: "size-11 rounded-xl", text: "text-2xl", badgeTag: "text-xs px-2" },
  xl: { badge: "size-14", img: "size-14 rounded-2xl", text: "text-3xl", badgeTag: "text-xs px-2.5" },
};

/**
 * Premium AI Emblem for JobMate using official jobmate-logo.png
 */
export function JobMateEmblem({
  className,
  size = "md",
  animated = false,
}: {
  className?: string;
  size?: keyof typeof SIZE_MAP;
  animated?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-background border border-indigo-500/20 shadow-sm shadow-indigo-500/15 ring-1 ring-white/10 transition-all duration-300 group-hover:scale-105 group-hover:shadow-indigo-500/25",
        SIZE_MAP[size].badge,
        SIZE_MAP[size].img,
        animated ? "animate-pulse" : "",
        className
      )}
    >
      <img
        src="/jobmate-logo.png"
        alt="JobMate AI Logo"
        className="w-full h-full object-contain p-0.5 select-none transition-transform duration-300 group-hover:scale-105"
        loading="eager"
        onError={(e) => {
          // Fallback to favicon or styled text if needed
          const target = e.target as HTMLImageElement;
          if (target.src.indexOf("jobmate.png") === -1) {
            target.src = "/jobmate.png";
          }
        }}
      />
    </div>
  );
}

/**
 * Full JobMate Brand Logo with Typography & Badge
 */
export function JobMateLogo({
  size = "md",
  className,
  showText = true,
  animated = false,
}: JobMateLogoProps) {
  return (
    <div className={cn("inline-flex items-center gap-2.5 font-sans select-none group cursor-pointer", className)}>
      <JobMateEmblem size={size} animated={animated} />
      {showText && (
        <span
          className={cn(
            "font-extrabold tracking-tight text-foreground flex items-center leading-none",
            SIZE_MAP[size].text
          )}
        >
          <span>Job</span>
          <span className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 dark:from-indigo-400 dark:via-indigo-300 dark:to-violet-400 bg-clip-text text-transparent">
            Mate
          </span>
          <span
            className={cn(
              "ml-1.5 rounded-md bg-indigo-500/10 dark:bg-indigo-950/80 font-mono font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shadow-2xs",
              SIZE_MAP[size].badgeTag
            )}
          >
            AI
          </span>
        </span>
      )}
    </div>
  );
}
