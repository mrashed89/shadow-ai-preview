import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-full text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/60 disabled:pointer-events-none disabled:opacity-45 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--accent)] text-white shadow-[0_0_32px_rgba(139,92,246,0.35)] hover:bg-[var(--accent-bright)]",
        secondary:
          "bg-white/8 text-white border border-white/12 hover:bg-white/12",
        ghost: "text-white/80 hover:bg-white/8 hover:text-white",
        call: "h-16 min-w-[220px] px-10 text-base font-semibold tracking-wide bg-gradient-to-b from-[#a78bfa] to-[#7c3aed] text-white shadow-[0_0_48px_rgba(124,58,237,0.45)] hover:from-[#c4b5fd] hover:to-[#8b5cf6]",
        danger:
          "bg-rose-500/90 text-white hover:bg-rose-400 shadow-[0_0_24px_rgba(244,63,94,0.25)]",
      },
      size: {
        default: "h-11 px-5",
        sm: "h-9 px-4 text-xs",
        lg: "h-12 px-6",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size, className }))} {...props} />
  ),
);
Button.displayName = "Button";
