import { linksHref, parseLinkListQuery } from "@/lib/link-list";
import { redirect } from "next/navigation";
import { LinksPage } from "../_components/links/links-page";

/*
 * /dashboard: active links. The route group gives this list its own segment (and `loading.tsx`), so
 * switching to /dashboard/expired and back swaps segments and shows the skeleton while loading.
 */
export default async function ActiveLinksPage({
  searchParams,
}: PageProps<"/dashboard">) {
  const params = await searchParams;
  // Before the expired list had its own route it was `/dashboard?status=expired`; keep old links working.
  if (params.status === "expired") {
    redirect(linksHref(parseLinkListQuery("expired", params)));
  }
  return <LinksPage status="active" searchParams={params} />;
}
