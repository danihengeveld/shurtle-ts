import { cn } from "cn"

/**
 * Link to another site. Opens in a new tab, and says so to screen readers.
 * Spread onto `<Button asChild>` like a regular anchor.
 */
export function ExternalLink({ children, className, ...props }: Omit<React.ComponentProps<"a">, "target" | "rel">) {
  return (
    <a target="_blank" rel="noopener noreferrer" className={cn(className)} {...props}>
      {children}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  )
}
