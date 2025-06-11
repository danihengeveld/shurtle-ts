import { ThemeToggle } from "@/components/theme-toggle"
import Link from "next/link"
import { Logo } from "../logo"
import { Button } from "../ui/button"
import { NavbarAuth } from "./navbar-auth"

export function Navbar() {
  return (
    <header className="border-b bg-background" role="banner">
      <div className="container mx-auto px-4 flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center">
            <Logo />
          </Link>
          <nav role="navigation">
            <Button asChild variant="ghost">
              <Link href="/dashboard">
                Dashboard
              </Link>
            </Button>
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
