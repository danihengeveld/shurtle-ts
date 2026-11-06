import { describe, expect, it } from "vitest"
import { cn } from "./utils"

describe("cn", () => {
  it("keeps the shell motif alongside a background colour", () => {
    expect(cn("bg-shell", "bg-foreground/10")).toBe("bg-shell bg-foreground/10")
  })

  it("still merges conflicting utilities", () => {
    expect(cn("px-2 bg-red-500", "px-4 bg-brand")).toBe("px-4 bg-brand")
  })
})
