import { siteInfo } from "@/lib/site";
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Pages that shouldn't be indexed (dashboard, status pages) say so with `robots: noindex`
      // metadata instead: a crawler blocked here would never fetch the page to see it.
      disallow: ["/api/"],
    },
    sitemap: new URL("/sitemap.xml", siteInfo.baseUrl).toString(),
  };
}
