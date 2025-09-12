import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-clay focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        /* Clay Variants */
        default: "clay-element gradient-clay-primary text-primary-foreground clay-hover clay-press font-semibold",
        destructive: "clay-element gradient-clay-secondary text-destructive-foreground clay-hover clay-press font-semibold",
        outline: "clay-element border-2 border-border bg-background/80 backdrop-blur-sm text-foreground clay-hover clay-press hover:bg-accent/20",
        secondary: "clay-element bg-muted text-muted-foreground clay-hover clay-press font-semibold",
        ghost: "rounded-xl transition-clay hover:bg-accent/20 hover:text-accent-foreground",
        link: "text-accent underline-offset-4 hover:underline transition-clay",
        
        /* Ninja Action Variants */
        "clay-jade": "clay-element gradient-clay-accent text-accent-foreground clay-hover clay-press glow-jade font-bold",
        "clay-fire": "clay-element bg-destructive text-destructive-foreground clay-hover clay-press glow-fire font-bold",
        "clay-electric": "clay-element bg-success text-success-foreground clay-hover clay-press glow-electric font-bold",
        
        /* Ninja Themed Variants */
        "shuriken": "clay-element gradient-clay-primary text-primary-foreground clay-hover clay-press rounded-full aspect-square p-0 font-bold",
        "ninja-scroll": "clay-element bg-card border-2 border-border text-card-foreground clay-hover clay-press rounded-2xl font-medium shadow-clay-outer",
        "smoke-bomb": "clay-element bg-muted text-muted-foreground clay-hover clay-press rounded-full",
      },
      size: {
        default: "h-12 px-6 py-3 rounded-xl",
        sm: "h-10 px-4 py-2 rounded-lg",
        lg: "h-14 px-8 py-4 rounded-xl text-base",
        icon: "h-12 w-12 rounded-xl",
        xl: "h-16 px-10 py-5 rounded-2xl text-lg",
        shuriken: "h-14 w-14 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

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

export { Button, buttonVariants }
