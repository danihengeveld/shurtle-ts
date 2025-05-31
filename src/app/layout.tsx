import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { ClerkProvider } from "@clerk/nextjs";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { VercelToolbar } from '@vercel/toolbar/next';
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { siteInfo } from "./site-info";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#020618" },
  ]
}

export const metadata: Metadata = {
  title: {
    template: `%s | ${siteInfo.name}`,
    default: siteInfo.name,
  },
  metadataBase: siteInfo.baseUrl,
  description: siteInfo.description,
  creator: "Dani Hengeveld",
  authors: [
    {
      name: "Dani Hengeveld",
      url: "https://dani.hengeveld.dev"
    }
  ],
  keywords: [
    "shurtle",
    "url shortener",
    "open source"
  ],
  category: "tools",
  icons: {
    icon: [
      {
        url: "/favicon-96x96.png",
        sizes: "96x96",
        type: "image/png"
      },
      {
        url: "/favicon.svg",
        type: "image/svg+xml"
      }
    ],
    apple: {
      url: "/apple-touch-icon.png",
      sizes: "180x180"
    },
    shortcut: "/favicon.ico",
  },
  openGraph: {
    title: siteInfo.name,
    siteName: siteInfo.name,
    description: siteInfo.description,
    url: siteInfo.baseUrl,
    type: "website",
    images: [
      {
        url: "/images/shurtle-logo-light-bg.png",
        width: 1024,
        height: 1024,
        alt: "Shurtle logo on light background"
      }
    ],
    locale: "en_US"
  },
  twitter: {
    card: "summary_large_image",
    title: siteInfo.name,
    description: siteInfo.description,
    images: [
      {
        url: "/images/shurtle-logo-light-bg.png",
        width: 1024,
        height: 1024,
        alt: "Shurtle logo on light background"
      },
    ],
    creator: "@Dani_Hengeveld"
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const shouldInjectToolbar = process.env.NODE_ENV === 'development';
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            enableColorScheme
            disableTransitionOnChange
          >
            <Navbar />
            <main className="flex-1" role="main">{children}</main>
            <Footer />
            <Toaster />
          </ThemeProvider>
          {shouldInjectToolbar && <VercelToolbar />}
          <SpeedInsights />
          <Analytics />
        </body>
      </html>
    </ClerkProvider >
  );
}
