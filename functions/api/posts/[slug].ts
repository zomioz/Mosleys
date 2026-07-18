import { json } from '../../lib/http'
import { parseGalleryImageKeys } from '../../lib/posts'

export async function onRequestGet({ env, params }: { env: any; params: any }) {
  const slug = String(params.slug || '')

  const post = await env.DB.prepare(
    `SELECT id, title, slug, article_key, price_cents, excerpt, content, cover_image_key, gallery_image_keys, status, created_at, updated_at
     FROM posts
     WHERE slug = ? AND status = ?
     LIMIT 1`,
  )
    .bind(slug, 'published')
    .first()

  if (!post) {
    return json({ error: 'Post not found' }, 404)
  }

  return json({
    post: {
      ...post,
      gallery_image_keys: parseGalleryImageKeys((post as any).gallery_image_keys),
    },
  })
}