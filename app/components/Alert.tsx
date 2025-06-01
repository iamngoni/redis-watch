import * as React from "react"
import { cn } from "../lib/utils"

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'destructive' | 'warning' | 'success'
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = 'default', ...props }, ref): React.ReactElement => {
    const baseClasses = "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground"
    
    const variantClasses = {
      default: "bg-white text-gray-900 border-gray-200",
      destructive: "border-red-200 bg-red-50 text-red-900 [&>svg]:text-red-600",
      warning: "border-yellow-200 bg-yellow-50 text-yellow-900 [&>svg]:text-yellow-600",
      success: "border-green-200 bg-green-50 text-green-900 [&>svg]:text-green-600",
    }

    return React.createElement(
      "div",
      {
        ref: ref,
        role: "alert",
        className: cn(baseClasses, variantClasses[variant], className),
        ...props
      }
    )
  }
)
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref): React.ReactElement => {
  return React.createElement(
    "h5",
    {
      ref: ref,
      className: cn("mb-1 font-medium leading-none tracking-tight", className),
      ...props
    }
  )
})
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref): React.ReactElement => {
  return React.createElement(
    "div",
    {
      ref: ref,
      className: cn("text-sm [&_p]:leading-relaxed", className),
      ...props
    }
  )
})
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription }