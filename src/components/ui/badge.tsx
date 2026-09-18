import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "outline" | "destructive"
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variants = {
    default: "bg-zinc-900 text-zinc-50 border-transparent hover:bg-zinc-900/80",
    secondary: "bg-zinc-100 text-zinc-900 border-transparent hover:bg-zinc-100/80",
    outline: "border border-zinc-200 text-zinc-900",
    destructive: "bg-red-100 text-red-700 border-transparent hover:bg-red-100/80",
  }

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2",
        variants[variant],
        className
      )}
      {...props}
    />
  )
}

export { Badge }
