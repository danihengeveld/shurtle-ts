import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { siteInfo } from "@/lib/site";
import { ClerkProvider } from "@clerk/nextjs";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  // Variable font: no `weight`, so one file covers every weight in use (500–800).
});

export const viewport: Viewport = {
  // Shrink the layout (incl. bottom-sheet dialogs) when the on-screen keyboard opens.
  interactiveWidget: "resizes-content",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafaf6" },
    { media: "(prefers-color-scheme: dark)", color: "#0b120f" },
  ],
};

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
  keywords: [
    "shurtle",
    "url shortener",
    "link shortener",
    "short links",
    "open source",
  ],
  category: "tools",
  // Icons come from the favicon.ico, icon.svg and apple-icon.tsx file conventions.
  openGraph: {
    title: siteInfo.name,
    siteName: siteInfo.name,
    description: siteInfo.description,
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: siteInfo.name,
    description: siteInfo.description,
    creator: siteInfo.author.twitter,
  },
};

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
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            enableColorScheme
            disableTransitionOnChange
          >
            <a
              href="#main"
              className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-100 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
            >
              Skip to content
            </a>
            {/* 400ms: moving the pointer across the links table shouldn't flash a tooltip per row. */}
            <TooltipProvider delayDuration={400}>
              <Navbar />
              <main id="main" className="flex flex-1 flex-col">
                {children}
              </main>
              <Footer />
            </TooltipProvider>
            <Toaster />
          </ThemeProvider>
        </ClerkProvider>
        {/* Their scripts are served from /_vercel/* by Vercel only; elsewhere (local dev, `next start`,
            self-hosting) they'd 404. VERCEL=1 is set on all Vercel builds and deployments. */}
        {process.env.VERCEL === "1" && (
          <>
            <SpeedInsights />
            <Analytics />
          </>
        )}
      </body>
    </html>
  );
}
