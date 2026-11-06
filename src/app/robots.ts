import { siteInfo } from "@/lib/site";
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Short links redirect elsewhere; only the marketing page is worth indexing.
      disallow: ["/dashboard", "/api/"],
    },
    sitemap: new URL("/sitemap.xml", siteInfo.baseUrl).toString(),
  };
}
