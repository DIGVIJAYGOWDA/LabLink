import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

type ApiModule = typeof import('@/services/api')
let api: ApiModule

beforeAll(async () => {
  api = await import('@/services/api')
})

afterEach(() => {
  vi.unstubAllGlobals()
})

function mockFetch(response: Partial<Response> | Error) {
  const fn = response instanceof Error ? vi.fn().mockRejectedValue(response) : vi.fn().mockResolvedValue(response)
  vi.stubGlobal('fetch', fn)
  return fn
}

describe('apiRequest', () => {
  it('returns parsed JSON on success and sends a JSON body', async () => {
    const fetchFn = mockFetch({ ok: true, status: 200, json: async () => ({ id: 'b1' }) })
    await expect(api.apiRequest('/api/bookings', { method: 'POST', body: { a: 1 } })).resolves.toEqual({ id: 'b1' })
    const [url, init] = fetchFn.mock.calls[0]
    expect(url).toBe('http://localhost:8000/api/bookings')
    expect(init).toMatchObject({ method: 'POST', body: '{"a":1}', headers: { 'Content-Type': 'application/json' } })
  })

  it('returns undefined for 204 No Content', async () => {
    mockFetch({ ok: true, status: 204, json: async () => ({}) })
    await expect(api.apiRequest('/api/x', { method: 'DELETE' })).resolves.toBeUndefined()
  })

  it('maps the backend error envelope to ApiError', async () => {
    mockFetch({
      ok: false,
      status: 409,
      json: async () => ({ error: { code: 'slot_unavailable', message: 'Slot taken', details: [] } }),
    })
    const err = await api.apiRequest('/api/bookings').catch((e: unknown) => e)
    expect(err).toBeInstanceOf(api.ApiError)
    expect(err).toMatchObject({ status: 409, code: 'slot_unavailable', message: 'Slot taken' })
  })

  it('uses the field message for validation errors', async () => {
    mockFetch({
      ok: false,
      status: 422,
      json: async () => ({
        error: { code: 'validation_error', message: 'Invalid', details: [{ field: 'purpose', message: 'Too short' }] },
      }),
    })
    await expect(api.apiRequest('/api/bookings')).rejects.toMatchObject({ field: 'purpose', message: 'Too short' })
  })

  it('keeps a generic message when the error body is not JSON', async () => {
    mockFetch({ ok: false, status: 500, json: async () => Promise.reject(new SyntaxError('bad')) })
    await expect(api.apiRequest('/api/x')).rejects.toMatchObject({ code: 'http_error', message: 'Request failed (500).' })
  })

  it('reports a network error when the server is unreachable', async () => {
    mockFetch(new TypeError('Failed to fetch'))
    await expect(api.apiRequest('/api/x')).rejects.toMatchObject({ status: 0, code: 'network_error' })
  })
})

describe('errorMessage', () => {
  it('returns the error message or the fallback', () => {
    expect(api.errorMessage(new Error('Boom'))).toBe('Boom')
    expect(api.errorMessage('nope', 'Fallback')).toBe('Fallback')
  })
})
