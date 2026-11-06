/** Dashboard list parameters. Client-safe: no server-only imports. */

export const PER_PAGE_OPTIONS = [10, 20, 50] as const
export type PerPage = (typeof PER_PAGE_OPTIONS)[number]
export const DEFAULT_PER_PAGE: PerPage = 10
export const MAX_SEARCH_LENGTH = 100

export type DashboardSearchParams = {
  page?: string | string[]
  perPage?: string | string[]
  q?: string | string[]
  /** Slug to prefill in the create dialog (opens it), e.g. from the "claim this slug" CTA. */
  new?: string | string[]
}

export type DashboardQuery = {
  page: number
  perPage: PerPage
  query: string
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

/** Parse and clamp untrusted search params into a safe query. */
export function parseDashboardQuery(params: DashboardSearchParams): DashboardQuery {
  const page = Number.parseInt(first(params.page) ?? "", 10)
  const perPage = Number.parseInt(first(params.perPage) ?? "", 10)
  const query = (first(params.q) ?? "").trim().slice(0, MAX_SEARCH_LENGTH)

  return {
    page: Number.isSafeInteger(page) && page > 0 ? page : 1,
    perPage: (PER_PAGE_OPTIONS as readonly number[]).includes(perPage) ? (perPage as PerPage) : DEFAULT_PER_PAGE,
    query,
  }
}

/** Build a dashboard href, omitting params that equal their defaults. */
export function dashboardHref({ page = 1, perPage = DEFAULT_PER_PAGE, query = "" }: Partial<DashboardQuery>) {
  const params = new URLSearchParams()
  if (query) params.set("q", query)
  if (page > 1) params.set("page", String(page))
  if (perPage !== DEFAULT_PER_PAGE) params.set("perPage", String(perPage))
  const search = params.toString()
  return search ? `/dashboard?${search}` : "/dashboard"
}
