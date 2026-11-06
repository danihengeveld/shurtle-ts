import { Logo } from "@/components/logo"
import { ThemeToggle } from "@/components/theme-toggle"
import Link from "next/link"
import { Suspense } from "react"
import { NavLink, NavLinkBase } from "./nav-link"
import { NavbarAuth } from "./navbar-auth"

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-xl backdrop-saturate-150 supports-backdrop-filter:bg-background/65">
      <div className="container-page flex h-16 items-center gap-1 sm:gap-2">
        <Link
          href="/"
          className="mr-1 -ml-1.5 flex h-10 items-center rounded-lg px-1.5 transition-opacity hover:opacity-80 sm:mr-3"
        >
          <Logo wordmarkClassName="max-[23.5rem]:sr-only" />
        </Link>
        <nav aria-label="Main">
          <Suspense
            fallback={<NavLinkBase href="/dashboard">Dashboard</NavLinkBase>}
          >
            <NavLink href="/dashboard">Dashboard</NavLink>
          </Suspense>
        </nav>
        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <ThemeToggle />
          <NavbarAuth />
        </div>
      </div>
    </header>
  )
}
