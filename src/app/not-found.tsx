import { Button } from "@/components/ui/button";
import { Link2Off } from "lucide-react";
import Link from "next/link";

export default function ShurtleNotFound() {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center text-center px-4">
      <div className="max-w-md space-y-6">
        <div className="flex justify-center">
          <div className="rounded-full bg-muted p-4">
            <Link2Off className="h-12 w-12 text-muted-foreground" />
          </div>
        </div>

        <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl">Shurtle Not Found</h1>

        <p className="text-muted-foreground">
          The shortened URL you&apos;re looking for doesn&apos;t exist. It might have been removed, expired, or never existed in
          the first place.
        </p>

        <div className="space-y-2">
          <p className="font-medium">Would you like to claim this short URL?</p>
          <p className="text-sm text-muted-foreground">
            You can create your own custom short URLs with Shurtle. It&apos;s quick, easy, and free to get started.
          </p>
        </div>

        <Button asChild variant="default" size="lg">
          <Link href="/dashboard">Create This Shurtle</Link>
        </Button>
      </div>
    </div>
  )
}