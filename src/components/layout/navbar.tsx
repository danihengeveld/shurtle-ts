import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"
import { NavbarAuth } from "./navbar-auth"
import { Logo } from "../logo"

export function Navbar() {
  return (
    <header className="border-b bg-background">
      <div className="container mx-auto flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center">
            <Logo />
          </Link>
          <nav className="hidden md:flex gap-6">
            <Link href="/dashboard" className="text-sm font-medium transition-colors hover:text-primary">
              Dashboard
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <NavbarAuth />
        </div>
      </div>
    </header>
  )
}
