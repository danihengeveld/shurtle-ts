import { Footer } from "@/components/layout/footer"
import { Navbar } from "@/components/layout/navbar"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { siteInfo } from "@/lib/site"
import { ClerkProvider } from "@clerk/nextjs"
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import type { Metadata, Viewport } from "next"
import { Bricolage_Grotesque, Geist, Geist_Mono } from "next/font/google"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
})

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafaf6" },
    { media: "(prefers-color-scheme: dark)", color: "#0b120f" },
  ],
}

export const metadata: Metadata = {
  metadataBase: siteInfo.baseUrl,
  title: {
    template: `%s · ${siteInfo.name}`,
    default: `${siteInfo.name} — ${siteInfo.description.replace(/\.$/, "")}`,
  },
  description: siteInfo.description,
  applicationName: siteInfo.name,
  creator: siteInfo.author.name,
  authors: [{ name: siteInfo.author.name, url: siteInfo.author.url }],
  keywords: ["shurtle", "url shortener", "link shortener", "short links", "open source"],
  category: "tools",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
    ],
    apple: { url: "/apple-touch-icon.png", sizes: "180x180" },
    shortcut: "/favicon.ico",
  },
  openGraph: {
    title: siteInfo.name,
    siteName: siteInfo.name,
    description: siteInfo.description,
    url: "/",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: siteInfo.name,
    description: siteInfo.description,
    creator: siteInfo.author.twitter,
  },
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${bricolage.variable}`}
    >
      <body className="flex min-h-dvh flex-col font-sans antialiased">
        <ClerkProvider
          appearance={{
            cssLayerName: "clerk",
            variables: {
              colorPrimary: "var(--primary)",
              colorPrimaryForeground: "var(--primary-foreground)",
              colorBackground: "var(--popover)",
              colorForeground: "var(--popover-foreground)",
              colorMuted: "var(--muted)",
              colorMutedForeground: "var(--muted-foreground)",
              colorInput: "var(--background)",
              colorInputForeground: "var(--foreground)",
              colorBorder: "var(--border)",
              colorRing: "var(--ring)",
              colorDanger: "var(--destructive)",
              colorSuccess: "var(--success)",
              colorWarning: "var(--warning)",
              borderRadius: "var(--radius)",
              fontFamily: "var(--font-geist-sans)",
            },
          }}
        >
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem enableColorScheme disableTransitionOnChange>
            <a
              href="#main"
              className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-100 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
            >
              Skip to content
            </a>
            <Navbar />
            <main id="main" className="flex flex-1 flex-col">
              {children}
            </main>
            <Footer />
            <Toaster />
          </ThemeProvider>
        </ClerkProvider>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  )
}
