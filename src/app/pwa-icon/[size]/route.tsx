import { ImageResponse } from "next/og";
import { AppIconTile } from "../../_components/app-icon";

/**
 * The web app manifest's icons (`manifest.ts`). A plain route handler rather than the `icon` /
 * `apple-icon` conventions, which would add a `<link>` tag to every page for each size.
 */
const SIZES = ["192", "512"];

export function generateStaticParams() {
  return SIZES.map((size) => ({ size }));
}

export async function GET(
  _request: Request,
  { params }: RouteContext<"/pwa-icon/[size]">,
) {
  const { size } = await params;
  if (!SIZES.includes(size)) return new Response(null, { status: 404 });

  const pixels = Number(size);
  return new ImageResponse(<AppIconTile size={pixels} />, {
    width: pixels,
    height: pixels,
  });
}
