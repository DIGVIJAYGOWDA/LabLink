// HTTP client for the LabLink backend. The base URL comes from VITE_API_BASE_URL (see frontend/.env.example).
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000').replace(/\/$/, '')

interface ErrorEnvelope {
  error?: { code?: string; message?: string; details?: { field?: string | null; message: string }[] }
}

/** Error with the backend's error code, so the UI can react (e.g. highlight a form field). */
export class ApiError extends Error {
  status: number
  code: string
  field?: string

  constructor(status: number, code: string, message: string, field?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.field = field
  }
}

export async function apiRequest<T>(path: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
  const hasBody = options.body !== undefined
  let res: Response
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      method: options.method ?? 'GET',
      headers: hasBody ? { 'Content-Type': 'application/json' } : undefined,
      body: hasBody ? JSON.stringify(options.body) : undefined,
    })
  } catch {
    throw new ApiError(0, 'network_error', 'Cannot reach the LabLink server. Check that the backend is running.')
  }

  if (!res.ok) {
    let code = 'http_error'
    let message = `Request failed (${res.status}).`
    let field: string | undefined
    try {
      const data = (await res.json()) as ErrorEnvelope
      const detail = data.error?.details?.[0]
      code = data.error?.code ?? code
      message = data.error?.message ?? message
      field = detail?.field ?? undefined
      if (code === 'validation_error' && detail && detail.message !== message) message = detail.message
    } catch {
      // non-JSON error body: keep the generic message
    }
    throw new ApiError(res.status, code, message, field)
  }

  return (res.status === 204 ? undefined : await res.json()) as T
}

export function apiGet<T>(path: string): Promise<T> {
  return apiRequest<T>(path)
}

/** User-facing message for any thrown value. */
export function errorMessage(err: unknown, fallback = 'Something went wrong. Please try again.') {
  return err instanceof Error && err.message ? err.message : fallback
}
