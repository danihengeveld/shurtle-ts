import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { ArrowLeftIcon, Link2OffIcon } from "lucide-react";
import Link from "next/link";

/**
 * Unknown ids and other people's links look the same: the page never says whether a link exists.
 */
export default function LinkNotFound() {
  return (
    <div className="container-page py-12 sm:py-16">
      <Empty className="relative isolate overflow-hidden rounded-3xl border border-solid bg-card py-14 shadow-soft sm:py-20">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 mask-[radial-gradient(60%_70%_at_50%_40%,black,transparent)]"
        >
          <div className="size-full shell-pattern" />
        </div>
        <EmptyHeader className="max-w-md">
          <EmptyMedia
            variant="icon"
            className="size-12 rounded-2xl text-muted-foreground [&_svg:not([class*='size-'])]:size-5"
          >
            <Link2OffIcon aria-hidden />
          </EmptyMedia>
          <EmptyTitle className="font-display text-2xl font-semibold text-balance">
            <h1>Link not found</h1>
          </EmptyTitle>
          <EmptyDescription className="text-pretty">
            It may have been deleted, or it belongs to another account.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button asChild variant="outline" className="h-10 sm:h-9">
            <Link href="/dashboard">
              <ArrowLeftIcon aria-hidden />
              Back to your links
            </Link>
          </Button>
        </EmptyContent>
      </Empty>
    </div>
  );
}
