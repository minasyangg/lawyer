import * as React from "react"
import { cn } from "@/lib/utils"

type AccordionContextType = {
  open: boolean
  toggle: () => void
}

const AccordionItemContext = React.createContext<AccordionContextType | undefined>(undefined)

export function Accordion({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("space-y-2", className)} {...props}>{children}</div>
}

export function AccordionItem({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false)
  const toggle = () => setOpen(o => !o)

  return (
    <AccordionItemContext.Provider value={{ open, toggle }}>
      <div>{children}</div>
    </AccordionItemContext.Provider>
  )
}

export function AccordionTrigger({ children, className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { className?: string }) {
  const ctx = React.useContext(AccordionItemContext)
  if (!ctx) {
    console.warn("AccordionTrigger must be used inside AccordionItem")
    return <button className={cn("flex w-full items-center justify-between py-2 px-2 font-medium transition-colors rounded", className)} {...props}>{children}</button>
  }

  const { open, toggle } = ctx
  return (
    <button
      className={cn("flex w-full items-center justify-between py-2 px-2 font-medium transition-colors rounded", className)}
      aria-expanded={open}
      onClick={(e) => { e.preventDefault(); toggle() }}
      {...props}
    >
      {children}
      <svg className={cn("w-4 h-4 ml-2 transition-transform duration-200", open ? "rotate-180" : "")}
        fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  )
}

export function AccordionContent({ children, className }: { children: React.ReactNode, className?: string }) {
  const ctx = React.useContext(AccordionItemContext)
  if (!ctx) {
    console.warn("AccordionContent must be used inside AccordionItem")
    return <div className={cn("overflow-hidden transition-all duration-300", className)}>{children}</div>
  }

  const { open } = ctx
  return (
    <div
      className={cn("overflow-hidden transition-all duration-300", className)}
      style={{ height: open ? undefined : 0, paddingTop: open ? undefined : 0, paddingBottom: open ? undefined : 0 }}
      aria-hidden={!open}
    >
      {open ? children : null}
    </div>
  )
}
