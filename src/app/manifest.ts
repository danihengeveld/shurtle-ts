import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Shurtle',
    short_name: 'Shurtle',
    description: 'An open source and blazingly fast URL shortener.',
    lang: '',
    start_url: '/dashboard',
    icons: [
      {
        src: "/web-app-manifest-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable"
      },
      {
        src: "/web-app-manifest-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable"
      }
    ],
    theme_color: "#ffffff",
    background_color: "#020618",
    display: "standalone"
  }
}