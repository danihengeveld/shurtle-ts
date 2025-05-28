import type { MetadataRoute } from 'next'
 
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://shurtle.app',
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 1,
    },
    {
      url: 'https://shurtle.app/dashboard',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0,
    },
    {
      url: 'https://shurtle.app/not-found',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.1,
    }
  ]
}
