import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { ArrowRight, Globe, Lock, Zap } from "lucide-react"
import Link from "next/link"

export default function LandingPage() {
  return (
    <>
      <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center space-y-6 text-center">
            <div className="flex justify-center mb-4">
              <Logo size={80} showText={false} />
            </div>
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">Shurtle</h1>
            <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
              The open source, blazingly fast URL shortener.
            </p>
            <div className="flex flex-wrap justify-center gap-4 mt-6">
              <Link href="/dashboard">
                <Button className="px-8">Get Started</Button>
              </Link>
              <Link href="https://github.com/danihengeveld/shurtle-ts" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="px-8">
                  View on GitHub
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
      <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-center space-y-6 text-center">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Features</h2>
            <p className="mx-auto max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
              Shurtle provides everything you need in a modern URL shortener
            </p>
            <div className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-8 pt-8 md:grid-cols-2 lg:grid-cols-3">
              <div className="flex flex-col items-center text-center space-y-4 p-6 rounded-lg border bg-card text-card-foreground shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 dark:bg-primary/20">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Blazingly Fast</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Built on Next.js middleware for instant redirects with minimal latency.
                </p>
              </div>
              <div className="flex flex-col items-center text-center space-y-4 p-6 rounded-lg border bg-card text-card-foreground shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 dark:bg-primary/20">
                  <Lock className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Secure</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Modern authentication and security practices to keep your links safe.
                </p>
              </div>
              <div className="flex flex-col items-center text-center space-y-4 p-6 rounded-lg border bg-card text-card-foreground shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 dark:bg-primary/20">
                  <Globe className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Open Source</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Fully open source and self-hostable. Contribute to the project on GitHub.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="w-full py-12 md:py-24 lg:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-center space-y-6 text-center">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Get Started Today</h2>
            <p className="mx-auto max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
              Become part of the Shurtle community and start shortening your links with ease.
            </p>
            <div className="mx-auto w-full max-w-sm pt-6">
              <Link href="/dashboard">
                <Button className="w-full">
                  Create Your Account
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
