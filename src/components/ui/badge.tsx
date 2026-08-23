import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-3 py-1 text-xs font-mono font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "bg-primary/20 text-primary border border-primary/30 backdrop-blur-sm",
        secondary:
          "bg-secondary/20 text-secondary border border-secondary/30 backdrop-blur-sm",
        accent:
          "bg-accent/20 text-accent border border-accent/30 backdrop-blur-sm",
        outline:
          "border border-border text-foreground backdrop-blur-sm",
        forest:
          "bg-brand-forest/90 text-white backdrop-blur-md shadow-sm",
        mustard:
          "bg-brand-mustard/90 text-brand-forest backdrop-blur-md shadow-sm font-bold",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
