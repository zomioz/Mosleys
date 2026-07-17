export async function apiJson<T>(input: RequestInfo | URL, init: RequestInit = {}) {
  const response = await fetch(input, {
    credentials: 'include',
    ...init,
    headers: {
      ...(init.headers || {}),
      ...(init.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    },
  })

  const text = await response.text()
  const data = text ? JSON.parse(text) : null

  if (!response.ok) {
    throw new Error(data?.error || response.statusText || 'Request failed')
  }

  return data as T
}