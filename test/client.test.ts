import { describe, expect, it } from 'vitest'
import { ApiError, apiGet, buildUrl, friendlyMessage, BASE_URL } from '../src/api/client'

function mockFetch(status: number, body: unknown): typeof fetch {
  return (async () =>
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    })) as unknown as typeof fetch
}

describe('buildUrl', () => {
  it('sets params and drops undefined/empty ones', () => {
    const url = buildUrl('/matches', { status: 'live', tour: undefined, limit: 50 })
    expect(url).toBe(`${BASE_URL}/matches?status=live&limit=50`)
  })
})

describe('apiGet', () => {
  it('sends the X-API-Key header and returns parsed JSON', async () => {
    let capturedHeaders: Record<string, string> | undefined
    const fetchImpl = (async (_url: string, init?: RequestInit) => {
      capturedHeaders = init?.headers as Record<string, string>
      return new Response(JSON.stringify({ data: [], meta: { count: 0 } }), { status: 200 })
    }) as unknown as typeof fetch
    const result = await apiGet<{ data: unknown[] }>('/fixtures', {}, 'k123', fetchImpl)
    expect(capturedHeaders).toEqual({ 'X-API-Key': 'k123' })
    expect(result.data).toEqual([])
  })

  it('throws ApiError carrying the stable error code from the body', async () => {
    const err: unknown = await apiGet('/history/matches', {}, 'k', mockFetch(403, { error: 'upgrade_required' })).catch(
      (e: unknown) => e,
    )
    expect(err).toBeInstanceOf(ApiError)
    expect((err as ApiError).status).toBe(403)
    expect((err as ApiError).code).toBe('upgrade_required')
  })

  it('survives a non-JSON error body', async () => {
    const fetchImpl = (async () => new Response('nope', { status: 500 })) as unknown as typeof fetch
    const err: unknown = await apiGet('/matches', {}, 'k', fetchImpl).catch((e: unknown) => e)
    expect(err).toBeInstanceOf(ApiError)
    expect((err as ApiError).code).toBeNull()
  })
})

describe('friendlyMessage', () => {
  it('403 upgrade_required states the real tier boundary', () => {
    const msg = friendlyMessage(new ApiError(403, 'upgrade_required'))
    expect(msg).toContain('paid tier')
    expect(msg).toContain('FREE key covers live scores, fixtures and players')
  })
  it('401 points at the key setting with the free signup', () => {
    expect(friendlyMessage(new ApiError(401, null))).toContain('livetennisapi.com/subscribe/free')
  })
  it('429 quotes the FREE limits verbatim (30/min, 100/day)', () => {
    const msg = friendlyMessage(new ApiError(429, 'rate_limited'))
    expect(msg).toContain('30 requests/min')
    expect(msg).toContain('100/day')
  })
  it('network failures get a reachability message', () => {
    expect(friendlyMessage(new TypeError('fetch failed'))).toContain('network error')
  })
})
