const API_URL = import.meta.env.VITE_API_URL ?? '/api/v1'

export interface ApiErrorPayload {
  code: string
  message: string
  details?: unknown[]
}

export class ApiRequestError extends Error {
  readonly status: number
  readonly code: string
  readonly details: unknown[]

  constructor(
    status: number,
    code: string,
    message: string,
    details: unknown[] = [],
  ) {
    super(message)
    this.name = 'ApiRequestError'
    this.status = status
    this.code = code
    this.details = details
  }
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  body?: unknown
  retriedCsrf?: boolean
}

let csrfToken: string | null = null

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text()

  if (!text) {
    return null
  }

  try {
    return JSON.parse(text) as unknown
  } catch {
    return null
  }
}

function getErrorPayload(data: unknown): ApiErrorPayload | null {
  if (
    typeof data === 'object' &&
    data !== null &&
    'error' in data &&
    typeof data.error === 'object' &&
    data.error !== null
  ) {
    const error = data.error as Partial<ApiErrorPayload>

    if (typeof error.code === 'string' && typeof error.message === 'string') {
      return {
        code: error.code,
        message: error.message,
        details: Array.isArray(error.details) ? error.details : [],
      }
    }
  }

  return null
}

async function ensureCsrfToken(force = false): Promise<string> {
  if (csrfToken && !force) {
    return csrfToken
  }

  let response: Response

  try {
    response = await fetch(`${API_URL}/auth/csrf`, {
      credentials: 'include',
      headers: { Accept: 'application/json' },
    })
  } catch {
    throw new ApiRequestError(
      0,
      'NETWORK_ERROR',
      'Не удалось связаться с сервером.',
    )
  }

  const data = await readJson(response)

  if (!response.ok) {
    const error = getErrorPayload(data)
    throw new ApiRequestError(
      response.status,
      error?.code ?? 'HTTP_ERROR',
      error?.message ?? 'Не удалось получить CSRF-токен.',
      error?.details ?? [],
    )
  }

  const token =
    typeof data === 'object' &&
    data !== null &&
    'csrfToken' in data &&
    typeof data.csrfToken === 'string'
      ? data.csrfToken
      : null

  if (!token) {
    throw new ApiRequestError(
      response.status,
      'CSRF_INVALID',
      'Сервер не вернул CSRF-токен.',
    )
  }

  csrfToken = token
  return token
}

/**
 * Единая точка запросов к API.
 * - всегда отправляет cookie;
 * - для POST/PATCH/DELETE добавляет X-CSRF-Token;
 * - приводит ошибки к ApiRequestError с code.
 */
export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const method = options.method ?? 'GET'
  const headers: Record<string, string> = {
    Accept: 'application/json',
  }

  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }

  if (method !== 'GET') {
    headers['X-CSRF-Token'] = await ensureCsrfToken()
  }

  let response: Response

  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      credentials: 'include',
      body:
        options.body !== undefined ? JSON.stringify(options.body) : undefined,
    })
  } catch {
    throw new ApiRequestError(
      0,
      'NETWORK_ERROR',
      'Не удалось связаться с сервером.',
    )
  }

  if (response.status === 204) {
    return undefined as T
  }

  const data = await readJson(response)

  if (!response.ok) {
    const error = getErrorPayload(data)

    if (
      response.status === 403 &&
      error?.code === 'CSRF_INVALID' &&
      !options.retriedCsrf
    ) {
      csrfToken = null
      return apiRequest<T>(path, { ...options, retriedCsrf: true })
    }

    throw new ApiRequestError(
      response.status,
      error?.code ?? 'HTTP_ERROR',
      error?.message ?? 'Запрос не выполнен.',
      error?.details ?? [],
    )
  }

  return data as T
}

export function resetCsrfToken(): void {
  csrfToken = null
}
