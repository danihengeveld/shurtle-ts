import { siteInfo } from "@/lib/site";
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteInfo.name,
    short_name: siteInfo.name,
    description: siteInfo.description,
    lang: "en-US",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    theme_color: "#0b120f",
    background_color: "#0b120f",
    icons: [
      {
        src: "/web-app-manifest-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/web-app-manifest-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
