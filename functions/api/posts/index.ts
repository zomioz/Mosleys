import { json } from '../../lib/http'
import { parseGalleryImageKeys } from '../../lib/posts'

export async function onRequestGet({ env }: { env: any }) {
  const { results } = await env.DB.prepare(
    `SELECT id, title, slug, article_key, price_cents, excerpt, content, cover_image_key, gallery_image_keys, created_at, updated_at
     FROM posts
     WHERE status = ?
     ORDER BY updated_at DESC`,
  )
    .bind('published')
    .all()

  return json({
    posts: results.map((post: any) => ({
      ...post,
      gallery_image_keys: parseGalleryImageKeys(post.gallery_image_keys),
    })),
  })
}