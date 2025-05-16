"use client"

import Link from "next/link"
import { useAuth, UserButton } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { LogIn } from "lucide-react"

export function NavbarAuth() {
  const { isSignedIn } = useAuth()

  if (isSignedIn) {
    return <UserButton afterSignOutUrl="/" />
  }

  return (
    <Button variant="outline" size="sm" asChild className="hidden md:flex">
      <Link href="/sign-in">
        <LogIn className="mr-2 h-4 w-4" />
        Sign In
      </Link>
    </Button>
  )
}
