import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 press-effect",
  {
    variants: {
      variant: {
        // Primary - Instagram Blue
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-soft",
        // Instagram Gradient Button
        instagram: "gradient-instagram text-white hover:opacity-90 shadow-medium",
        // Destructive
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        // Outline - Instagram style
        outline: "border border-border bg-transparent text-foreground hover:bg-secondary",
        // Secondary
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        // Ghost - minimal
        ghost: "hover:bg-secondary text-foreground",
        // Link
        link: "text-primary underline-offset-4 hover:underline",
        // Category buttons
        category: "bg-card border border-border text-foreground hover:border-primary hover:text-primary",
        categoryActive: "bg-foreground text-background",
        // FAB - Floating Action Button
        fab: "gradient-instagram text-white rounded-full shadow-medium hover:shadow-glow",
        // Accent - Instagram Pink
        accent: "gradient-accent text-white shadow-soft hover:shadow-medium",
        // Toolbar
        toolbar: "bg-transparent text-foreground hover:bg-secondary",
        // Icon only - Instagram style
        icon: "bg-transparent text-foreground hover:text-primary",
      },
      size: {
        default: "h-11 px-5 py-2.5",
        sm: "h-9 rounded-lg px-3 text-xs",
        lg: "h-12 rounded-xl px-8 text-base",
        xl: "h-14 rounded-xl px-10 text-lg",
        icon: "h-10 w-10",
        iconSm: "h-8 w-8",
        iconLg: "h-12 w-12",
        iconXl: "h-14 w-14",
        category: "h-16 w-16 flex-col rounded-2xl text-xs",
        fab: "h-14 w-14 rounded-full",
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
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
