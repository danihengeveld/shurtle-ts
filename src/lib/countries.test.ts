import { describe, expect, it } from "vitest";
import { countryName, flagEmoji } from "./countries";

describe("countryName", () => {
  it("names countries in English from their ISO code", () => {
    expect(countryName("NL")).toBe("Netherlands");
    expect(countryName("us")).toBe("United States");
    expect(countryName("XK")).toBe("Kosovo");
  });

  it("returns anything that isn't a two-letter code as it is", () => {
    expect(countryName("EU1")).toBe("EU1");
    expect(countryName("")).toBe("");
  });
});

describe("flagEmoji", () => {
  it("builds flags from regional indicators", () => {
    expect(flagEmoji("NL")).toBe("🇳🇱");
    expect(flagEmoji("jp")).toBe("🇯🇵");
  });

  it("is null for anything else", () => {
    expect(flagEmoji("N")).toBeNull();
    expect(flagEmoji("NLD")).toBeNull();
    expect(flagEmoji("1A")).toBeNull();
  });
});
