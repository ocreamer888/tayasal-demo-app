import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border border-transparent px-2.5 py-1 text-xs font-semibold w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        // Success - Green
        success: "bg-green-100 text-green-700 border-green-200",
        // Warning - Yellow
        warning: "bg-yellow-100 text-yellow-700 border-yellow-200",
        // Error/Destructive - Red
        error: "bg-red-100 text-red-700 border-red-200",
        // Default - Primary Green
        default: "bg-green-500 text-white hover:bg-green-600",
        // Secondary - Neutral
        secondary:
          "bg-neutral-100 text-neutral-700 border-neutral-200 hover:bg-neutral-200",
        // Outline
        outline:
          "border border-neutral-200 text-neutral-700 hover:bg-neutral-50",
        // Ghost
        ghost: "text-neutral-600 hover:bg-neutral-100",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
