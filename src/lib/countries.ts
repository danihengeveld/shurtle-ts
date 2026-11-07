/** Country names and flags from ISO 3166-1 alpha-2 codes (as Vercel reports them). Client-safe. */

const names = new Intl.DisplayNames(["en"], {
  type: "region",
  fallback: "code",
});

const ALPHA_2 = /^[A-Z]{2}$/;

/** "NL" → "Netherlands"; unknown or malformed codes come back as they are. */
export function countryName(code: string) {
  const upper = code.toUpperCase();
  if (!ALPHA_2.test(upper)) return code;
  try {
    return names.of(upper) ?? upper;
  } catch {
    return upper;
  }
}

/** "NL" → 🇳🇱, built from regional indicator symbols; null for anything else. */
export function flagEmoji(code: string) {
  const upper = code.toUpperCase();
  if (!ALPHA_2.test(upper)) return null;
  return String.fromCodePoint(
    ...[...upper].map((letter) => 0x1f1e6 + letter.charCodeAt(0) - 65),
  );
}
