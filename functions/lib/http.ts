export function json(body: unknown, status = 200, headers: HeadersInit = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...headers,
    },
  })
}

export function text(body: string, status = 200, headers: HeadersInit = {}) {
  return new Response(body, {
    status,
    headers,
  })
}