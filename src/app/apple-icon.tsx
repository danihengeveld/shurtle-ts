import { ImageResponse } from "next/og";
import { AppIconTile } from "./_components/app-icon";

/**
 * 180px is the iOS home-screen size. 192px and 512px exist for the web app manifest
 * (`manifest.ts`), which links them directly.
 */
const APP_ICON_SIZES = [180, 192, 512] as const;

export function generateImageMetadata() {
  return APP_ICON_SIZES.map((size) => ({
    id: String(size),
    size: { width: size, height: size },
    contentType: "image/png",
  }));
}

export default async function AppleIcon({
  id,
}: {
  id: Promise<string | number>;
}) {
  const size = Number(await id);
  return new ImageResponse(<AppIconTile size={size} />, {
    width: size,
    height: size,
  });
}
