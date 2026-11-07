import { LinkAnalyticsSkeleton } from "../../_components/analytics/link-analytics-skeleton";

export default function Loading() {
  return (
    <div className="container-page py-8 sm:py-10 lg:py-12">
      <LinkAnalyticsSkeleton />
    </div>
  );
}
