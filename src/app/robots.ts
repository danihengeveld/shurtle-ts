import type { MetadataRoute } from 'next'
import { siteInfo } from './site-info'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/not-found'],
      disallow: '/dashboard',
    },
    sitemap: siteInfo + 'sitemap.xml',
  }
}