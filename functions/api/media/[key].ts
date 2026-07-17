export async function onRequestGet({ env, params }: { env: any; params: any }) {
  const key = String(params.key || '')

  if (!key) {
    return new Response('Not found', { status: 404 })
  }

  const object = await env.MEDIA_BUCKET.get(key)

  if (!object) {
    return new Response('Not found', { status: 404 })
  }

  const headers = new Headers()
  object.writeHttpMetadata(headers)
  headers.set('etag', object.httpEtag)
  headers.set('Cache-Control', 'public, max-age=31536000, immutable')

  return new Response(object.body, { headers })
}