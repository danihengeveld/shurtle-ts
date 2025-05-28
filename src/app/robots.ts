import type { MetadataRoute } from 'next'
 
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/not-found'],
      disallow: '/dashboard',
    },
    sitemap: 'https://shurtle.app/sitemap.xml',
  }
}