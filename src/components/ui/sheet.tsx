import * as React from "react"
import { cn } from "@/lib/utils"

export function Sheet({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

export const SheetTrigger = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  function SheetTrigger({ children, ...props }, ref) {
    return <button ref={ref} {...props}>{children}</button>
  }
)

export const SheetOverlay = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  function SheetOverlay({ className, ...props }, ref) {
    return <div ref={ref} className={cn("fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300", className)} {...props} />
  }
)

export const SheetContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  function SheetContent({ className, ...props }, ref) {
    return <div ref={ref} className={cn("fixed right-0 top-0 h-full bg-white z-50 shadow-xl transition-transform duration-300", className)} {...props} />
  }
)
