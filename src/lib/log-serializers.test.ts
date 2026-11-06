import { DrizzleQueryError } from "drizzle-orm"
import { describe, expect, it } from "vitest"
import { serializeError, urlHost } from "./log-serializers"

const SECRET_URL = "https://example.com/reset?token=s3cret"

describe("serializeError", () => {
  it("drops bound parameters from database errors, keeping the SQL and Postgres code", () => {
    const pgError = Object.assign(
      new Error(
        'duplicate key value violates unique constraint "user_id_url_idx"',
      ),
      {
        code: "23505",
        constraint: "user_id_url_idx",
        detail: `Key (user_id, url)=(user_123, ${SECRET_URL}) already exists.`,
      },
    )
    const error = new DrizzleQueryError(
      "insert into shurtles values ($1, $2)",
      ["abc", SECRET_URL],
      pgError,
    )

    const serialized = serializeError(error)
    const json = JSON.stringify(serialized)

    expect(json).not.toContain("s3cret")
    expect(json).not.toContain("user_123")
    expect(serialized).toMatchObject({
      type: "DrizzleQueryError",
      message: "Failed query",
      query: "insert into shurtles values ($1, $2)",
      cause: { code: "23505", constraint: "user_id_url_idx" },
    })
  })

  it("keeps ordinary errors readable", () => {
    const serialized = serializeError(
      new TypeError("boom", { cause: new Error("root") }),
    )
    expect(serialized).toMatchObject({
      type: "TypeError",
      message: "boom",
      cause: { message: "root" },
    })
  })

  it("survives cyclic causes", () => {
    const a = new Error("a")
    const b = new Error("b", { cause: a })
    a.cause = b
    expect(() => JSON.stringify(serializeError(a))).not.toThrow()
  })
})

describe("urlHost", () => {
  it("returns only the host", () => {
    expect(urlHost(SECRET_URL)).toBe("example.com")
    expect(urlHost("not a url")).toBeNull()
  })
})
