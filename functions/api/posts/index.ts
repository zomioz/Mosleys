export async function onRequestGet({ env }: { env: any }) {
  const { results } = await env.DB.prepare(
    'SELECT id, title, slug, excerpt, cover_image_key, created_at FROM posts WHERE status = ? ORDER BY created_at DESC'
  )
    .bind('published')
    .all()

  return Response.json(results)
}