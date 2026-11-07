import { SHELL_PATH, TURTLE_PATH } from "@/components/logo";

/** Brand tokens (dark theme) as sRGB: icon renderers don't understand oklch(). */
export const ICON_COLORS = {
  bg: "#080f0b",
  fg: "#f0f1e8",
  brand: "#baf54e",
};

/**
 * The browser-tab icon: the mark on a rounded dark tile, so it reads on light and dark tab strips
 * alike. The stroke is heavier than the in-page mark's to stay legible at 16px.
 * Written to `app/icon.svg` by `app-icon.test.ts`, and the source of `app/favicon.ico`
 * (rasterised at 16/32/48px).
 */
export function tabIconSvg() {
  const C = ICON_COLORS;
  // Scales the 64×36 mark to 84% and centres its middle (32, 20) on the tile's (32, 32).
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="${C.bg}"/><g transform="translate(5.12 15.2) scale(0.84)"><path d="${SHELL_PATH}" fill="${C.brand}"/><path d="${TURTLE_PATH}" fill="none" stroke="${C.fg}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><circle cx="54.6" cy="12.8" r="1.9" fill="${C.fg}"/></g></svg>`;
}

/**
 * Full-bleed home-screen tile for `ImageResponse`. The mark spans 64% of the width, which keeps it
 * inside the 80% safe zone of maskable icons, so the same artwork serves iOS and Android.
 */
export function AppIconTile({ size }: { size: number }) {
  const width = size * 0.64;
  const C = ICON_COLORS;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: C.bg,
      }}
    >
      <svg
        width={width}
        height={(width * 36) / 64}
        viewBox="0 2 64 36"
        fill="none"
      >
        <path d={SHELL_PATH} fill={C.brand} />
        <path
          d={TURTLE_PATH}
          stroke={C.fg}
          strokeWidth={3.1}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="54.6" cy="12.8" r="1.55" fill={C.fg} />
      </svg>
    </div>
  );
}
