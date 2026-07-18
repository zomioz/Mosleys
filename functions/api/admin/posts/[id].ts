import { json } from '../../../lib/http'
import { parseGalleryImageKeys } from '../../../lib/posts'
import { requireAdmin } from '../../../lib/auth'

export async function onRequestDelete({ request, env, params }: { request: Request; env: any; params: any }) {
  const admin = await requireAdmin(request, env)

  if (!admin) {
    return json({ error: 'Unauthorized' }, 401)
  }

  const id = Number(params.id)

  if (!Number.isInteger(id)) {
    return json({ error: 'Invalid post id' }, 400)
  }

  const existing = await env.DB.prepare(
    'SELECT cover_image_key, gallery_image_keys FROM posts WHERE id = ? LIMIT 1',
  )
    .bind(id)
    .first<{ cover_image_key: string | null; gallery_image_keys: string | null }>()

  if (!existing) {
    return json({ ok: true })
  }

  const imageKeys = parseGalleryImageKeys(existing.gallery_image_keys)
  if (existing.cover_image_key) {
    imageKeys.push(existing.cover_image_key)
  }

  const uniqueImageKeys = Array.from(new Set(imageKeys.filter(Boolean)))

  if (uniqueImageKeys.length > 0) {
    const placeholders = uniqueImageKeys.map(() => '?').join(', ')

    await env.DB.prepare(`DELETE FROM media WHERE r2_key IN (${placeholders})`)
      .bind(...uniqueImageKeys)
      .run()

    await Promise.all(uniqueImageKeys.map((key) => env.MEDIA_BUCKET.delete(key).catch(() => null)))
  }

  await env.DB.prepare('DELETE FROM posts WHERE id = ?').bind(id).run()

  return json({ ok: true })
}

export async function onRequestPut({ request, env, params }: { request: Request; env: any; params: any }) {
  const admin = await requireAdmin(request, env)

  if (!admin) {
    return json({ error: 'Unauthorized' }, 401)
  }

  const id = Number(params.id)

  if (!Number.isInteger(id)) {
    return json({ error: 'Invalid post id' }, 400)
  }

  const payload = await request.json().catch(() => null)

  if (!payload) {
    return json({ error: 'Invalid JSON body' }, 400)
  }

  const title = String(payload.title || '').trim()
  const priceCents = Number.isFinite(Number(payload.priceCents)) ? Math.max(0, Math.round(Number(payload.priceCents))) : 0
  const excerpt = String(payload.excerpt || '').trim()
  const content = String(payload.content || '').trim()
  const coverImageKey = String(payload.coverImageKey || '').trim() || null
  const galleryImageKeys = parseGalleryImageKeys(payload.galleryImageKeys)
  const status = 'published'
  const articleKey = String(payload.articleKey || '').trim()

  if (!title || !content) {
    return json({ error: 'Title and content are required' }, 400)
  }

  if (galleryImageKeys.length > 3) {
    return json({ error: 'Maximum 3 images allowed' }, 400)
  }

  const existing = await env.DB.prepare('SELECT article_key, cover_image_key, gallery_image_keys FROM posts WHERE id = ? LIMIT 1')
    .bind(id)
    .first<{ article_key: string; cover_image_key: string | null; gallery_image_keys: string | null }>()

  if (!existing) {
    return json({ error: 'Post not found' }, 404)
  }

  const normalizedGallery = galleryImageKeys.length > 0 ? galleryImageKeys : parseGalleryImageKeys(existing.gallery_image_keys)
  const normalizedCover = coverImageKey || normalizedGallery[0] || existing.cover_image_key || null

  await env.DB.prepare(
    `UPDATE posts
     SET title = ?, price_cents = ?, excerpt = ?, content = ?, cover_image_key = ?, gallery_image_keys = ?, article_key = ?, status = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
  )
    .bind(title, priceCents, excerpt, content, normalizedCover, JSON.stringify(normalizedGallery), articleKey || existing.article_key, status, id)
    .run()

  return json({ ok: true })
}