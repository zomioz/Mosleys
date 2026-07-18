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
  let data: any = null

  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = text
    }
  }

  if (!response.ok) {
    if (typeof data === 'string') {
      throw new Error(data || response.statusText || 'Request failed')
    }

    throw new Error(data?.error || response.statusText || 'Request failed')
  }

  return data as T
}