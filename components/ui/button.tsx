import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Variants aligned with DESIGN_SYSTEM.md button spec
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // Primary: bg-blue-500, white text, hover:bg-blue-600 — no shadow, no translate
        default:
          "bg-blue-500 text-white hover:bg-blue-600 rounded-xl",
        // Secondary: blue-500/10 bg, blue-600 text, hover:bg-blue-500/15
        secondary:
          "bg-blue-500/10 text-blue-600 hover:bg-blue-500/15 rounded-xl",
        // Destructive: red-500/10 bg, red-600 text
        destructive:
          "bg-red-500/10 text-red-600 hover:bg-red-500/15 rounded-xl",
        // Plain/Text: no bg, blue-500 text
        ghost:
          "text-blue-500 font-medium hover:text-blue-600",
        // Standard outline for compatibility
        outline:
          "border border-slate-200 bg-transparent text-foreground hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800 rounded-xl",
        link: "text-blue-500 underline-offset-4 hover:underline",
      },
      size: {
        default: "px-4 py-2.5",
        sm: "px-3 py-1.5 text-xs",
        lg: "px-6 py-3 text-base",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
