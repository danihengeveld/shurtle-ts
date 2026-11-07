import { Skeleton } from "@/components/ui/skeleton";
import { LinkAnalyticsSkeleton } from "../../dashboard/_components/analytics/link-analytics-skeleton";

export default function Loading() {
  return (
    <div className="container-page py-8 sm:py-10 lg:py-12">
      <Skeleton aria-hidden className="mb-8 h-[4.5rem] rounded-2xl sm:mb-10" />
      <LinkAnalyticsSkeleton actions={false} />
    </div>
  );
}
