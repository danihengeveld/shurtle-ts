import type { Metadata } from "next";
import { LinksPage } from "../_components/links/links-page";

export const metadata: Metadata = {
  title: "Expired links",
};

/** /dashboard/expired: links past their expiry date, kept with their click history. */
export default async function ExpiredLinksPage({
  searchParams,
}: PageProps<"/dashboard/expired">) {
  return <LinksPage status="expired" searchParams={await searchParams} />;
}
