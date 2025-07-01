import type { MetadataRoute } from 'next'
import { siteInfo } from './site-info'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: siteInfo.baseUrl.toString(),
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 1,
    },
    {
      url: siteInfo.baseUrl + 'not-found',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.1,
    }
  ]
}
