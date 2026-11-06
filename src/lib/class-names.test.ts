import { cn } from "cn"
import { describe, expect, it } from "vitest"

describe("cn (class merging)", () => {
  it("keeps the shell motif alongside a background colour", () => {
    // `shell-pattern` (globals.css) is a mask, coloured by a `bg-*` class; it must survive merging.
    expect(cn("shell-pattern", "bg-foreground/10")).toBe("shell-pattern bg-foreground/10")
  })

  it("still merges conflicting utilities", () => {
    expect(cn("px-2 bg-red-500", "px-4 bg-brand")).toBe("px-4 bg-brand")
  })
})
