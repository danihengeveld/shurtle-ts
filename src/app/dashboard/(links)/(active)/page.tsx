import { LinksPage } from "../../_components/links/links-page";

/*
 * /dashboard: active links. The route group gives this list its own segment (and `loading.tsx`), so
 * switching to /dashboard/expired and back swaps segments and shows the skeleton while loading.
 */
export default async function ActiveLinksPage({
  searchParams,
}: PageProps<"/dashboard">) {
  return <LinksPage status="active" searchParams={await searchParams} />;
}
