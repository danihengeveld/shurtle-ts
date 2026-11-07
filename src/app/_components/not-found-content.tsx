import { LogoMark } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import styles from "./not-found.module.css";
import { NotFoundVariant, PendingScript } from "./not-found-variant";
import { StatusPage, StatusText, statusCta } from "./status-view";

/** The 404 page. Server-rendered except for the variant picker (not-found-variant.tsx). */
export function NotFoundContent() {
  const generic = <GenericNotFound />;

  return (
    <StatusPage
      className={styles.root}
      // The pending script sets `data-pending` on this element before hydration.
      suppressHydrationWarning
      backdropClassName="[mask-image:radial-gradient(ellipse_60%_70%_at_75%_50%,black_10%,transparent_75%)] max-lg:[mask-image:radial-gradient(ellipse_100%_50%_at_50%_80%,black_10%,transparent_75%)]"
      prelude={<PendingScript />}
    >
      <Suspense fallback={generic}>
        <NotFoundVariant generic={generic} />
      </Suspense>
    </StatusPage>
  );
}

function GenericNotFound() {
  return (
    <>
      <StatusText
        eyebrow="404 · Page not found"
        markerClassName="bg-brand-ink"
        title="This page has gone into its shell."
        actions={
          <>
            <Button asChild size="lg" className={statusCta}>
              <Link href="/">
                <ArrowLeft />
                Back to home
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className={statusCta}>
              <Link href="/dashboard">Open dashboard</Link>
            </Button>
          </>
        }
      >
        We couldn&rsquo;t find what you were looking for. If you followed a
        short link, it may have been deleted or mistyped.
      </StatusText>

      <div
        aria-hidden="true"
        className="flex items-center justify-center font-display text-[8rem] leading-none font-extrabold tracking-[-0.06em] select-none sm:text-[11rem] lg:justify-end"
      >
        <span>4</span>
        <LogoMark className="mx-[0.06em] h-[0.62em] translate-y-[0.06em]" />
        <span>4</span>
      </div>
    </>
  );
}
