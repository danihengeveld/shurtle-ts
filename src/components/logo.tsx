import Image from "next/image"
import { cn } from "@/lib/utils"

interface LogoProps {
  className?: string
  size?: number
  showText?: boolean
}

export function Logo({ className, size = 40, showText = true }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <Image
          src={"/images/turtle-white.svg"}
          alt="Shurtle Logo"
          width={size}
          height={size}
          className="object-contain hidden dark:block"
          priority

        />
        <Image
          src={"/images/turtle-black.svg"}
          alt="Shurtle Logo"
          width={size}
          height={size}
          className="object-contain block dark:hidden"
          priority
        />
      </div>
      {showText && <span className="text-2xl font-bold">Shurtle</span>}
    </div>
  )
}
