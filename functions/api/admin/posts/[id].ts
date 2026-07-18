import { json } from '../../../lib/http'
import { parseGalleryImageKeys } from '../../../lib/posts'
import { requireAdmin } from '../../../lib/auth'

export async function onRequestPost({ request, env, params }: { request: Request; env: any; params: any }) {
  try {
    const admin = await requireAdmin(request, env)

    if (!admin) {
      return json({ error: 'Unauthorized' }, 401)
    }

    const id = Number(params.id)

    if (!Number.isInteger(id)) {
      return json({ error: 'Invalid post id' }, 400)
    }

    await env.DB.prepare(
      `UPDATE posts
       SET updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
    )
      .bind(id)
      .run()

    return json({ ok: true })
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Up post failed' }, 500)
  }
}

export async function onRequestDelete({ request, env, params }: { request: Request; env: any; params: any }) {
  try {
    const admin = await requireAdmin(request, env)

    if (!admin) {
      return json({ error: 'Unauthorized' }, 401)
    }

    const id = Number(params.id)

    if (!Number.isInteger(id)) {
      return json({ error: 'Invalid post id' }, 400)
    }

    const existing = await env.DB.prepare(
      'SELECT article_key, cover_image_key, gallery_image_keys FROM posts WHERE id = ? LIMIT 1',
    )
      .bind(id)
      .first<{ article_key: string; cover_image_key: string | null; gallery_image_keys: string | null }>()

    if (!existing) {
      return json({ ok: true })
    }

    const imageKeys = parseGalleryImageKeys(existing.gallery_image_keys)
    if (existing.cover_image_key) {
      imageKeys.push(existing.cover_image_key)
    }

    const uniqueImageKeys = Array.from(new Set(imageKeys.filter(Boolean)))

    const mediaRows = await env.DB.prepare('SELECT r2_key FROM media WHERE post_id = ? OR article_key = ?').bind(id, existing.article_key).all<{ r2_key: string }>()
    const linkedMediaKeys = mediaRows.results.map((row) => row.r2_key)
    const allKeysToRemove = Array.from(new Set([...uniqueImageKeys, ...linkedMediaKeys]))

    if (allKeysToRemove.length > 0) {
      const placeholders = allKeysToRemove.map(() => '?').join(', ')

      await env.DB.prepare(`DELETE FROM media WHERE post_id = ? OR article_key = ? OR r2_key IN (${placeholders})`)
        .bind(id, existing.article_key, ...allKeysToRemove)
        .run()

      await Promise.all(allKeysToRemove.map((key) => env.MEDIA_BUCKET.delete(key).catch(() => null)))
    }

    await env.DB.prepare('DELETE FROM posts WHERE id = ?').bind(id).run()

    return json({ ok: true })
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Delete post failed' }, 500)
  }
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

  const imageKeys = Array.from(new Set([normalizedCover, ...normalizedGallery].filter((key): key is string => Boolean(key))))

  if (imageKeys.length > 0) {
    const placeholders = imageKeys.map(() => '?').join(', ')

    await env.DB.prepare(`UPDATE media SET post_id = ?, article_key = ? WHERE r2_key IN (${placeholders})`)
      .bind(id, articleKey || existing.article_key, ...imageKeys)
      .run()
  }

  return json({ ok: true })
}