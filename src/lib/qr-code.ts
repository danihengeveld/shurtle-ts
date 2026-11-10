import { SHELL_PATH, TURTLE_PATH } from "@/components/logo";
import { encode } from "uqr";

/** Modules of light margin around the code; the QR spec asks for at least 4. */
export const QUIET_ZONE = 4;

// Fixed colours, never themed: scanners want dark modules on a light background, and the
// downloaded file has to look the same wherever it ends up (poster, slide, dark-mode viewer).
const DARK = "#0a0a0a";
const LIGHT = "#ffffff";
const BRAND = "#baf54e"; // --brand, oklch(0.9 0.2 127)

// From version 7 an alignment pattern sits in the centre, right where the logo would go.
const MAX_LOGO_VERSION = 6;

export interface QrCode {
  /** Standalone SVG document, ready to display or save. */
  svg: string;
  /** Modules per side, quiet zone included. */
  size: number;
  version: number;
  /** Whether the turtle sits in the centre (only when error correction can cover it). */
  logo: boolean;
}

/**
 * A QR code for `text` as an SVG string: dark modules on white with a quiet zone, and the turtle
 * in the centre when the code is small enough to use the highest error correction (H, ~30%
 * recoverable) with the logo covering well under that. Otherwise a plain code at level M.
 */
export function qrCode(text: string): QrCode {
  const withLogo = encode(text, { ecc: "H", border: 0 });
  const logo = withLogo.version <= MAX_LOGO_VERSION;
  const qr = logo ? withLogo : encode(text, { ecc: "M", border: 0 });

  const modules = qr.data.length;
  const size = modules + QUIET_ZONE * 2;
  const box = logo ? logoBox(modules) : null;

  let path = "";
  for (let y = 0; y < modules; y++) {
    const row = qr.data[y]!;
    let x = 0;
    while (x < modules) {
      if (!row[x] || (box && inBox(box, x, y))) {
        x++;
        continue;
      }
      // One rectangle per horizontal run keeps the path short.
      const start = x;
      while (x < modules && row[x] && !(box && inBox(box, x, y))) x++;
      path += `M${start + QUIET_ZONE} ${y + QUIET_ZONE}h${x - start}v1h${start - x}z`;
    }
  }

  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges">`,
    `<rect width="${size}" height="${size}" fill="${LIGHT}"/>`,
    `<path d="${path}" fill="${DARK}"/>`,
    box ? logoSvg(box) : "",
    `</svg>`,
  ].join("");

  return { svg, size, version: qr.version, logo };
}

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** The cleared centre area, in module coordinates (quiet zone excluded). */
export function logoBox(modules: number): Box {
  // About 30% of the width and 18% of the height: ~5–6% of all modules, well inside level H.
  const w = Math.round(modules * 0.3);
  const h = Math.round(modules * 0.18);
  // Centre on whole modules so no module is half covered.
  const x = Math.floor((modules - w) / 2);
  const y = Math.floor((modules - h) / 2);
  return { x, y, w, h };
}

function inBox(box: Box, x: number, y: number) {
  return x >= box.x && x < box.x + box.w && y >= box.y && y < box.y + box.h;
}

function logoSvg(box: Box) {
  const x = box.x + QUIET_ZONE;
  const y = box.y + QUIET_ZONE;
  // The turtle's viewBox is 64×36; fit it inside the box with half a module of padding.
  const pad = 0.5;
  return [
    `<svg x="${x + pad}" y="${y + pad}" width="${box.w - pad * 2}" height="${box.h - pad * 2}" viewBox="0 2 64 36" shape-rendering="geometricPrecision" fill="none" stroke="${DARK}" stroke-width="3.1" stroke-linecap="round" stroke-linejoin="round">`,
    `<path d="${SHELL_PATH}" fill="${BRAND}" stroke="none"/>`,
    `<path d="${TURTLE_PATH}"/>`,
    `<circle cx="54.6" cy="12.8" r="1.55" fill="${DARK}" stroke="none"/>`,
    `</svg>`,
  ].join("");
}
