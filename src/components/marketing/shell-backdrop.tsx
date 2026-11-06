import { cn } from "@/lib/utils"

/**
 * The hexagonal "shell" lattice, filling its positioned parent. The pattern itself is a mask, so the
 * fade has to live on a wrapper: pass a `[mask-image:…]` gradient via `className`. `latticeClassName`
 * replaces the default lattice colour (a `bg-*` class).
 */
export function ShellBackdrop({ className, latticeClassName }: { className?: string; latticeClassName?: string }) {
  return (
    <div aria-hidden="true" className={cn("pointer-events-none absolute inset-0 -z-10", className)}>
      {/* Not `cn()`: tailwind-merge would treat `bg-shell` as a background colour and drop it. */}
      <div className={`absolute inset-0 bg-shell ${latticeClassName ?? "bg-foreground/[0.08] dark:bg-foreground/[0.07]"}`} />
    </div>
  )
}
