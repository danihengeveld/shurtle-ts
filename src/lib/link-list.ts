/** Dashboard link list: which links, which page, which search. Client-safe: no server-only imports. */

export const PER_PAGE_OPTIONS = [10, 20, 50] as const;
export type PerPage = (typeof PER_PAGE_OPTIONS)[number];
export const DEFAULT_PER_PAGE: PerPage = 10;
export const MAX_SEARCH_LENGTH = 100;
/** Far beyond any real list; bounds the query offset and the number of distinct cache entries. */
export const MAX_PAGE = 10_000;

/**
 * Which links the list shows; each status is its own route (`/dashboard`, `/dashboard/expired`).
 * Expired links are kept (archived), never deleted automatically.
 */
export type LinkStatus = "active" | "expired";

/** The refinements that stay in the query string. */
export type LinkListSearchParams = {
  page?: string | string[];
  perPage?: string | string[];
  q?: string | string[];
};

export type LinkListQuery = {
  status: LinkStatus;
  page: number;
  perPage: PerPage;
  query: string;
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

/** Parse and clamp untrusted search params into a safe query for `status`. */
export function parseLinkListQuery(
  status: LinkStatus,
  params: LinkListSearchParams,
): LinkListQuery {
  const page = Number.parseInt(first(params.page) ?? "", 10);
  const perPage = Number.parseInt(first(params.perPage) ?? "", 10);
  const query = (first(params.q) ?? "").trim().slice(0, MAX_SEARCH_LENGTH);

  return {
    status,
    page: Number.isSafeInteger(page) && page > 0 ? Math.min(page, MAX_PAGE) : 1,
    perPage: (PER_PAGE_OPTIONS as readonly number[]).includes(perPage)
      ? (perPage as PerPage)
      : DEFAULT_PER_PAGE,
    query,
  };
}

export function linksPath(status: LinkStatus) {
  return status === "expired" ? "/dashboard/expired" : "/dashboard";
}

/** Status from a pathname (`/dashboard/expired` → expired, anything else → active). */
export function statusFromPath(pathname: string): LinkStatus {
  return pathname.replace(/\/$/, "").endsWith("/expired")
    ? "expired"
    : "active";
}

/** Build a list href, omitting params that equal their defaults. */
export function linksHref(
  {
    status = "active",
    page = 1,
    perPage = DEFAULT_PER_PAGE,
    query = "",
  }: Partial<LinkListQuery>,
  hash?: string,
) {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (page > 1) params.set("page", String(page));
  if (perPage !== DEFAULT_PER_PAGE) params.set("perPage", String(perPage));
  const search = params.toString();
  const href = search ? `${linksPath(status)}?${search}` : linksPath(status);
  return hash ? `${href}#${hash}` : href;
}
