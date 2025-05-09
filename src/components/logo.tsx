"use client"

import Image from "next/image"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"

interface LogoProps {
  className?: string
  size?: number
  showText?: boolean
}

export function Logo({ className, size = 40, showText = true }: LogoProps) {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <Image
          src={isDark ? "/images/turtle-white.svg" : "/images/turtle-black.svg"}
          alt="Shurtle Logo"
          width={size}
          height={size}
          className="object-contain"
          priority
        />
      </div>
      {showText && <span className="text-2xl font-bold">Shurtle</span>}
    </div>
  )
}
