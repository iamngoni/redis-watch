import * as React from "react"
import { cn } from "../lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info'
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const baseClasses = "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
  
  const variantClasses = {
    default: "border-transparent bg-blue-600 text-white hover:bg-blue-700",
    secondary: "border-transparent bg-gray-100 text-gray-800 hover:bg-gray-200",
    destructive: "border-transparent bg-red-600 text-white hover:bg-red-700",
    outline: "border-gray-300 text-gray-700",
    success: "border-transparent bg-green-100 text-green-800",
    warning: "border-transparent bg-yellow-100 text-yellow-800",
    info: "border-transparent bg-blue-100 text-blue-800",
  }

  return React.createElement(
    "div",
    {
      className: cn(baseClasses, variantClasses[variant], className),
      ...props
    }
  )
}

export { Badge }