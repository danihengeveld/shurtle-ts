"use client"

import { cn } from "cn"
import Link from "next/link"
import { usePathname } from "next/navigation"

/** Top-level nav link that marks itself as the current page (for its whole subtree). */
type NavLinkProps = React.ComponentProps<typeof Link> & { href: string }

export function NavLink(props: NavLinkProps) {
  const pathname = usePathname()
  const active = pathname === props.href || pathname.startsWith(`${props.href}/`)
  return <NavLinkBase {...props} aria-current={active ? "page" : undefined} />
}

/**
 * The link without the active state. Used as the Suspense fallback for `NavLink`: on routes with
 * request-time params the pathname isn't known while prerendering the shell.
 */
export function NavLinkBase({ className, ...props }: NavLinkProps) {
  return (
    <Link
      className={cn(
        "relative inline-flex h-10 items-center rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors",
        "hover:bg-accent hover:text-foreground aria-[current=page]:text-foreground",
        // Active marker: a short lime bar under the label.
        "after:absolute after:inset-x-3 after:-bottom-[calc(0.75rem+1px)] after:h-0.5 after:rounded-full after:bg-transparent aria-[current=page]:after:bg-brand-ink",
        className,
      )}
      {...props}
    />
  )
}
