import { SHELL_PATH, TURTLE_PATH } from "@/components/logo"
import { siteInfo } from "@/lib/site"
import { ImageResponse } from "next/og"
import { readFile } from "node:fs/promises"
import { join } from "node:path"

export const alt = `${siteInfo.name}: ${siteInfo.description}`
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

// Brand tokens (dark theme) as sRGB, since the OG renderer doesn't understand oklch().
const C = {
  bg: "#080f0b",
  fg: "#f0f1e8",
  muted: "#9fa79e",
  brand: "#baf54e",
  brandFg: "#091e0b",
  line: "#1d2721",
}

const fontDir = join(process.cwd(), "src/components/marketing/og-fonts")
const [display, mono] = await Promise.all([
  readFile(join(fontDir, "BricolageGrotesque-Bold.ttf")),
  readFile(join(fontDir, "GeistMono-Regular.ttf")),
])

function Turtle({ height, stroke, strokeWidth = 3.1 }: { height: number; stroke: string; strokeWidth?: number }) {
  return (
    <svg width={(height * 64) / 36} height={height} viewBox="0 2 64 36" fill="none">
      <path d={SHELL_PATH} fill={C.brand} />
      <path d={TURTLE_PATH} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="54.6" cy="12.8" r="1.55" fill={stroke} />
    </svg>
  )
}

export default async function OpengraphImage() {
  const host = siteInfo.baseUrl.host

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          backgroundColor: C.bg,
          color: C.fg,
          fontFamily: "Bricolage",
          position: "relative",
        }}
      >
        {/* Hex "shell" lattice, fading in from the right. */}
        <svg width="1200" height="630" viewBox="0 0 1200 630" style={{ position: "absolute", top: 0, left: 0 }}>
          <defs>
            <pattern id="hex" width="56" height="97" patternUnits="userSpaceOnUse">
              <path
                d="M28 1 55 16.5v31L28 63 1 47.5v-31Z M28 63v34 M1 16.5 -26 1 M55 16.5 82 1"
                fill="none"
                stroke={C.fg}
                strokeOpacity="0.09"
                strokeWidth="1.2"
              />
            </pattern>
            <radialGradient id="fade" cx="0.82" cy="0.55" r="0.62">
              <stop offset="0" stopColor="#fff" stopOpacity="1" />
              <stop offset="1" stopColor="#fff" stopOpacity="0" />
            </radialGradient>
            <mask id="m">
              <rect width="1200" height="630" fill="url(#fade)" />
            </mask>
          </defs>
          <rect width="1200" height="630" fill="url(#hex)" mask="url(#m)" />
        </svg>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Turtle height={44} stroke={C.fg} />
            <span style={{ fontSize: 44, letterSpacing: "-0.03em" }}>{siteInfo.name}</span>
          </div>
          <span style={{ fontFamily: "Geist Mono", fontSize: 20, color: C.muted, letterSpacing: "0.12em" }}>
            OPEN SOURCE · MIT
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div style={{ display: "flex", flexDirection: "column", fontSize: 96, lineHeight: 1, letterSpacing: "-0.045em" }}>
            <span>The turtle that</span>
            <div style={{ display: "flex", alignItems: "center", marginTop: 8 }}>
              <span
                style={{
                  backgroundColor: C.brand,
                  color: C.brandFg,
                  borderRadius: 14,
                  padding: "0 12px 6px",
                  marginLeft: -12,
                  marginRight: 22,
                  transform: "rotate(-1.5deg)",
                }}
              >
                outruns
              </span>
              <span>the hare.</span>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              fontFamily: "Geist Mono",
              fontSize: 30,
              border: `3px solid ${C.brand}`,
              borderRadius: 18,
              padding: "14px 24px",
            }}
          >
            <span style={{ color: C.muted }}>{host}/</span>
            <span>x7Kp2qR</span>
            <span style={{ width: 3, height: 34, marginLeft: 3, backgroundColor: C.brand, borderRadius: 2 }} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 12 }}>
              <span style={{ width: 70, height: 8, borderRadius: 8, backgroundColor: C.brand, opacity: 0.7, marginRight: 20 }} />
              <span style={{ width: 110, height: 8, borderRadius: 8, backgroundColor: C.brand }} />
              <span style={{ width: 54, height: 8, borderRadius: 8, backgroundColor: C.brand, opacity: 0.7, marginRight: 34 }} />
            </div>
            <Turtle height={120} stroke={C.fg} />
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Bricolage", data: display, weight: 700, style: "normal" },
        { name: "Geist Mono", data: mono, weight: 400, style: "normal" },
      ],
    },
  )
}
