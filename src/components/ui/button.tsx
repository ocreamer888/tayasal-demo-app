import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "@radix-ui/react-slot"
import { Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  // Base styles: inline-flex, gap-2, rounded-lg (8px), font-semibold, transition-all, focus ring
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive active:translate-y-0",
  {
    variants: {
      variant: {
        // Premium Primary: gradient green with subtle shadow and lift on hover
        default: "bg-gradient-to-b from-green-500 to-green-600 text-white shadow-sm hover:shadow-md hover:-translate-y-0.5",
        // Secondary: outlined, neutral
        secondary:
          "border-1.5 border-neutral-200 bg-white text-neutral-800 shadow-xs hover:bg-neutral-50 hover:border-neutral-300 hover:-translate-y-0.5 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-100 dark:hover:bg-neutral-800",
        // Outline for ghost actions
        outline:
          "border border-neutral-200 bg-transparent text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800",
        // Ghost: minimal
        ghost:
          "text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800",
        // Warning: yellow accent for attention
        warning:
          "bg-gradient-to-b from-yellow-400 to-yellow-500 text-neutral-900 shadow-sm hover:shadow-md hover:-translate-y-0.5",
        // Destructive: red
        destructive:
          "bg-red-600 text-white hover:bg-red-700 shadow-sm hover:shadow-md hover:-translate-y-0.5",
        // Link style
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-5 py-2 has-[>svg]:px-4",
        sm: "h-8 gap-1.5 rounded-md px-3 has-[>svg]:px-2.5 text-xs",
        md: "h-10 gap-2 px-4 has-[>svg]:px-3 text-sm",
        lg: "h-12 gap-2.5 rounded-lg px-6 has-[>svg]:px-5 text-base",
        xl: "h-14 gap-3 rounded-lg px-8 has-[>svg]:px-7 text-lg",
        icon: "size-10",
        "icon-sm": "size-8",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> &
    VariantProps<typeof buttonVariants> & {
      asChild?: boolean
      loading?: boolean
    }
>(({ className, variant, size, asChild = false, loading = false, children, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      disabled={props.disabled || loading}
      {...props}
    >
      {loading && (
        <Loader2 className="h-4 w-4 animate-spin" />
      )}
      {children}
    </Comp>
  )
})
Button.displayName = "Button"

export { Button, buttonVariants }
