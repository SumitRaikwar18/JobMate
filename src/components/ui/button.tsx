import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "rounded-xl bg-primary px-5 py-3 text-sm text-primary-foreground shadow-button hover:-translate-y-0.5 hover:bg-primary-hover hover:shadow-button-hover",
        outline: "rounded-xl border border-border bg-background px-5 py-3 text-sm text-foreground shadow-xs hover:-translate-y-0.5 hover:border-primary/25 hover:bg-accent",
        pill: "rounded-full bg-primary px-5 py-2.5 text-sm text-primary-foreground shadow-button hover:-translate-y-0.5 hover:bg-primary-hover",
        ghost: "rounded-full border border-border bg-background px-5 py-2.5 text-sm text-foreground hover:bg-accent",
        icon: "size-10 rounded-lg text-foreground hover:bg-accent",
      },
      size: {
        default: "min-h-11",
        sm: "min-h-9",
        lg: "min-h-12 text-base",
        icon: "size-10",
      },
    },
    defaultVariants: { variant: "primary", size: "default" },
  },
);

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>;

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  ),
);
Button.displayName = "Button";

export { Button, buttonVariants };