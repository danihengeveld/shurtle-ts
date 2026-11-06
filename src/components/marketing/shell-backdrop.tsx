import { cn } from "cn"

/**
 * The hexagonal "shell" lattice, filling its positioned parent. The pattern itself is a mask, so the
 * fade has to live on a wrapper: pass a `[mask-image:…]` gradient via `className`. `latticeClassName`
 * replaces the default lattice colour (a `bg-*` class).
 */
export function ShellBackdrop({
  className,
  latticeClassName,
}: {
  className?: string
  latticeClassName?: string
}) {
  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 -z-10", className)}
    >
      <div
        className={cn(
          "absolute inset-0 shell-pattern",
          latticeClassName ?? "bg-foreground/8 dark:bg-foreground/7",
        )}
      />
    </div>
  )
}
