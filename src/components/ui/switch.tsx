import * as React from "react"
import { cn } from "@/lib/utils"

interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  size?: "sm" | "default" | "lg"
  onCheckedChange?: (checked: boolean) => void
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, size = "default", onCheckedChange, onChange, ...props }, ref) => {
    const sizes = {
      sm: "h-4 w-7",
      default: "h-5 w-9", 
      lg: "h-6 w-11"
    }

    const thumbSizes = {
      sm: "h-3 w-3",
      default: "h-4 w-4",
      lg: "h-5 w-5"
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(e)
      onCheckedChange?.(e.target.checked)
    }

    return (
      <label className="inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          className="sr-only peer"
          ref={ref}
          onChange={handleChange}
          {...props}
        />
        <div className={cn(
          "relative bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:transition-all peer-checked:bg-blue-600",
          sizes[size],
          className
        )}>
          <div className={cn(
            "absolute top-0.5 left-0.5 bg-white rounded-full transition-transform duration-200 ease-in-out peer-checked:translate-x-full",
            thumbSizes[size]
          )} />
        </div>
      </label>
    )
  }
)
Switch.displayName = "Switch"

export { Switch }