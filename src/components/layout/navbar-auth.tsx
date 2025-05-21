"use client"

import { Button } from "@/components/ui/button"
import { useAuth, UserButton } from "@clerk/nextjs"
import { LogIn } from "lucide-react"
import Link from "next/link"

export function NavbarAuth() {
  const { isSignedIn } = useAuth()

  if (isSignedIn) {
    return <UserButton />
  }

  return (
    <Button variant="outline" size="sm" asChild className="hidden md:flex">
      <Link href="/dashboard">
        <LogIn className="mr-2 h-4 w-4" />
        Sign In
      </Link>
    </Button>
  )
}
