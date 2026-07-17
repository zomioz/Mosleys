import { json } from '../../lib/http'

export async function onRequestGet({ env, params }: { env: any; params: any }) {
  const slug = String(params.slug || '')

  const post = await env.DB.prepare(
    `SELECT id, title, slug, excerpt, content, cover_image_key, status, created_at, updated_at
     FROM posts
     WHERE slug = ? AND status = ?
     LIMIT 1`,
  )
    .bind(slug, 'published')
    .first()

  if (!post) {
    return json({ error: 'Post not found' }, 404)
  }

  return json({ post })
}