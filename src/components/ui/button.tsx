import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--acc)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-[var(--acc)] text-white hover:opacity-90",
        destructive: "bg-[var(--red)] text-white hover:opacity-90",
        outline: "border border-[var(--bd)] bg-transparent text-[var(--text)] hover:bg-[var(--s2)] hover:text-[var(--text)]",
        secondary: "bg-[var(--s2)] text-[var(--text)] hover:bg-[var(--s3)]",
        ghost: "hover:bg-[var(--s2)] hover:text-[var(--text)]",
        link: "text-[var(--acc)] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, ...props }, ref) => {
  return <button className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
});
Button.displayName = "Button";

export { Button };
