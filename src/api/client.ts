/** Minimal Live Tennis API client (read-only, X-API-Key auth). */

export const BASE_URL = 'https://api.livetennisapi.com/api/public/v1'

/** Error body shape per the OpenAPI `Error` schema. */
interface ApiErrorBody {
  error?: string
  detail?: string
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    /** Stable machine-readable code from the API, e.g. `upgrade_required`. */
    readonly code: string | null,
    readonly detail?: string,
  ) {
    super(`Live Tennis API ${status}${code ? ` (${code})` : ''}`)
    this.name = 'ApiError'
  }
}

export type Params = Record<string, string | number | undefined>

export function buildUrl(path: string, params: Params = {}, base: string = BASE_URL): string {
  const url = new URL(base + path)
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') url.searchParams.set(key, String(value))
  }
  return url.toString()
}

export async function apiGet<T>(
  path: string,
  params: Params,
  apiKey: string,
  fetchImpl: typeof fetch = fetch,
): Promise<T> {
  const response = await fetchImpl(buildUrl(path, params), {
    headers: { 'X-API-Key': apiKey },
  })
  if (!response.ok) {
    let body: ApiErrorBody = {}
    try {
      body = (await response.json()) as ApiErrorBody
    } catch {
      // Non-JSON error body — keep the status only.
    }
    throw new ApiError(response.status, body.error ?? null, body.detail)
  }
  return (await response.json()) as T
}

/**
 * One honest, user-facing message per failure mode. The 403 message states
 * the real tier boundary rather than hiding it: history is a paid tier.
 */
export function friendlyMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 401) {
      return 'Live Tennis API: missing or invalid API key. Add your key in the plugin settings (free key, no card: livetennisapi.com/subscribe/free).'
    }
    if (err.status === 403 && err.code === 'upgrade_required') {
      return 'Live Tennis API: this data is on a paid tier. Completed-match history and H2H need BASIC (or any Historical Data plan); your FREE key covers live scores, fixtures and players.'
    }
    if (err.status === 429) {
      return 'Live Tennis API: rate limited. The FREE tier allows 30 requests/min and 100/day — try again in a minute.'
    }
    return `Live Tennis API error ${err.status}${err.detail ? `: ${err.detail}` : ''}`
  }
  return 'Live Tennis API: network error — could not reach api.livetennisapi.com.'
}
