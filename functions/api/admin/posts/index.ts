import { json } from '../../../lib/http'
import { makeArticleKey, makeUniqueSlug, parseGalleryImageKeys } from '../../../lib/posts'
import { requireAdmin } from '../../../lib/auth'

export async function onRequestGet({ request, env }: { request: Request; env: any }) {
  const admin = await requireAdmin(request, env)

  if (!admin) {
    return json({ error: 'Unauthorized' }, 401)
  }

  const { results } = await env.DB.prepare(
    'SELECT id, title, slug, article_key, price_cents, excerpt, content, cover_image_key, gallery_image_keys, status, created_at, updated_at FROM posts ORDER BY created_at DESC',
  ).all()

  return json({
    posts: results.map((post: any) => ({
      ...post,
      gallery_image_keys: parseGalleryImageKeys(post.gallery_image_keys),
    })),
  })
}

export async function onRequestPost({ request, env }: { request: Request; env: any }) {
  try {
    const admin = await requireAdmin(request, env)

    if (!admin) {
      return json({ error: 'Unauthorized' }, 401)
    }

    const payload = await request.json().catch(() => null)

    if (!payload) {
      return json({ error: 'Invalid JSON body' }, 400)
    }

    const title = String(payload.title || '').trim()
    const priceCents = Number.isFinite(Number(payload.priceCents)) ? Math.max(0, Math.round(Number(payload.priceCents))) : 0
    const content = String(payload.content || '').trim()
    const excerpt = String(payload.excerpt || '').trim()
    const status = 'published'
    const coverImageKey = String(payload.coverImageKey || '').trim() || null
    const articleKey = String(payload.articleKey || '').trim() || makeArticleKey()
    const galleryImageKeys = parseGalleryImageKeys(payload.galleryImageKeys)
    const slug = await makeUniqueSlug(env, title, String(payload.slug || ''))

    if (!title || !content) {
      return json({ error: 'Title and content are required' }, 400)
    }

    if (galleryImageKeys.length > 3) {
      return json({ error: 'Maximum 3 images allowed' }, 400)
    }

    const normalizedGallery = galleryImageKeys.length > 0 ? galleryImageKeys : coverImageKey ? [coverImageKey] : []
    const normalizedCover = coverImageKey || normalizedGallery[0] || null

    const result = await env.DB.prepare(
      `INSERT INTO posts (title, slug, article_key, price_cents, excerpt, content, cover_image_key, gallery_image_keys, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(title, slug, articleKey, priceCents, excerpt, content, normalizedCover, JSON.stringify(normalizedGallery), status)
      .run()

    const postId = result.meta.last_row_id
    const imageKeys = Array.from(new Set([normalizedCover, ...normalizedGallery].filter((key): key is string => Boolean(key))))

    if (imageKeys.length > 0) {
      const placeholders = imageKeys.map(() => '?').join(', ')

      await env.DB.prepare(`UPDATE media SET post_id = ? WHERE article_key = ? OR r2_key IN (${placeholders})`)
        .bind(postId, articleKey, ...imageKeys)
        .run()
    }

    return json({
      ok: true,
      post: {
        id: postId,
        title,
        slug,
        article_key: articleKey,
        price_cents: priceCents,
        excerpt,
        content,
        cover_image_key: normalizedCover,
        gallery_image_keys: normalizedGallery,
        status,
      },
    })
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Create post failed' }, 500)
  }
}