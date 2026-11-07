import { ImageResponse } from "next/og";
import { AppIconTile } from "./_components/app-icon";

/** iOS home-screen icon. The web app manifest's sizes come from `pwa-icon/[size]/route.tsx`. */
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(<AppIconTile size={size.width} />, size);
}
