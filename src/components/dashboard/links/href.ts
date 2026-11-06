import { dashboardHref, type DashboardQuery } from "@/lib/pagination"

/** Build a list href for `basePath` (the lib helper always targets `/dashboard`). */
export function linksHref(basePath: string, query: Partial<DashboardQuery>, hash?: string) {
  const href = dashboardHref(query).replace(/^\/dashboard/, basePath)
  return hash ? `${href}#${hash}` : href
}
