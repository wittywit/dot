import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// Update styles for flat, modern look
export const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-accent-color focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none border border-transparent",
  {
    variants: {
      variant: {
        default: "bg-accent-color text-white hover:bg-accent-color-hover active:bg-accent-color/90 border-accent-color shadow-none",
        outline: "bg-white text-accent-color border-accent-color hover:bg-accent-color hover:text-white active:bg-accent-color/90 shadow-none",
        ghost: "bg-transparent text-accent-color hover:bg-accent-color/10 active:bg-accent-color/20 border-none shadow-none",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 px-3",
        lg: "h-12 px-6",
        icon: "h-10 w-10 p-0",
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
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"
export { Button };
