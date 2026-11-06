import { describe, expect, it } from "vitest"
import { endOfLocalDay } from "./format"

describe("endOfLocalDay", () => {
  it("stays on the same local day after rounding to whole seconds (DB precision 0)", () => {
    const end = endOfLocalDay(new Date(2026, 10, 13, 9, 30))
    expect(end.getMilliseconds()).toBe(0)
    const rounded = new Date(Math.round(end.getTime() / 1000) * 1000)
    expect(rounded.getDate()).toBe(13)
    expect([rounded.getHours(), rounded.getMinutes(), rounded.getSeconds()]).toEqual([23, 59, 59])
  })
})
