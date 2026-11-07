import { siteInfo } from "@/lib/site";
import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: siteInfo.baseUrl.toString(),
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: new URL("/demo", siteInfo.baseUrl).toString(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];
}
