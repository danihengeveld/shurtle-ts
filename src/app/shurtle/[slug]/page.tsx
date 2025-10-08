import { ShurtleDetailHeader } from "@/components/shurtle-detail/shurtle-detail-header";
import { ShurtleDetailStats } from "@/components/shurtle-detail/shurtle-detail-stats";
import { ShurtleDetailStatsSkeleton } from "@/components/shurtle-detail/shurtle-detail-stats-skeleton";
import { ShurtleHitsAnalytics } from "@/components/shurtle-detail/shurtle-hits-analytics";
import { ShurtleHitsAnalyticsSkeleton } from "@/components/shurtle-detail/shurtle-hits-analytics-skeleton";
import { ShurtleGeoAnalytics } from "@/components/shurtle-detail/shurtle-geo-analytics";
import { ShurtleGeoAnalyticsSkeleton } from "@/components/shurtle-detail/shurtle-geo-analytics-skeleton";
import { ShurtleRecentHits } from "@/components/shurtle-detail/shurtle-recent-hits";
import { getShurtleDetails } from "@/lib/shurtles";
import { auth } from "@clerk/nextjs/server";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

export const experimental_ppr = true

interface ShurtleDetailPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({
  params,
}: ShurtleDetailPageProps): Promise<Metadata> {
  const { slug } = await params
  
  return {
    title: `Shurtle Details - ${slug}`,
    description: `Analytics and statistics for your shurtle: ${slug}`,
  }
}

export default async function ShurtleDetailPage({ params }: ShurtleDetailPageProps) {
  const { userId } = await auth()
  const { slug } = await params

  if (!userId) {
    notFound()
  }

  // Check if the shurtle exists and belongs to the user
  const shurtle = await getShurtleDetails(slug, userId)
  
  if (!shurtle) {
    notFound()
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <ShurtleDetailHeader shurtle={shurtle} />
      
      <Suspense fallback={<ShurtleDetailStatsSkeleton />}>
        <ShurtleDetailStats slug={slug} />
      </Suspense>
      
      <div className="grid gap-8 lg:grid-cols-2">
        <Suspense fallback={<ShurtleHitsAnalyticsSkeleton />}>
          <ShurtleHitsAnalytics slug={slug} />
        </Suspense>
        
        <Suspense fallback={<ShurtleGeoAnalyticsSkeleton />}>
          <ShurtleGeoAnalytics slug={slug} />
        </Suspense>
      </div>
      
      <ShurtleRecentHits hits={shurtle.hits} />
    </div>
  )
}