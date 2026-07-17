import { json } from '../../../lib/http'
import { makeUniqueSlug } from '../../../lib/posts'
import { requireAdmin } from '../../../lib/auth'

export async function onRequestGet({ request, env }: { request: Request; env: any }) {
  const admin = await requireAdmin(request, env)

  if (!admin) {
    return json({ error: 'Unauthorized' }, 401)
  }

  const { results } = await env.DB.prepare(
    'SELECT id, title, slug, excerpt, content, cover_image_key, status, created_at, updated_at FROM posts ORDER BY created_at DESC',
  ).all()

  return json({ posts: results })
}

export async function onRequestPost({ request, env }: { request: Request; env: any }) {
  const admin = await requireAdmin(request, env)

  if (!admin) {
    return json({ error: 'Unauthorized' }, 401)
  }

  const payload = await request.json().catch(() => null)

  if (!payload) {
    return json({ error: 'Invalid JSON body' }, 400)
  }

  const title = String(payload.title || '').trim()
  const content = String(payload.content || '').trim()
  const excerpt = String(payload.excerpt || '').trim()
  const status = String(payload.status || 'draft').trim() === 'published' ? 'published' : 'draft'
  const coverImageKey = String(payload.coverImageKey || '').trim() || null
  const slug = await makeUniqueSlug(env, title, String(payload.slug || ''))

  if (!title || !content) {
    return json({ error: 'Title and content are required' }, 400)
  }

  const result = await env.DB.prepare(
    `INSERT INTO posts (title, slug, excerpt, content, cover_image_key, status)
     VALUES (?, ?, ?, ?, ?, ?)`,
  )
    .bind(title, slug, excerpt, content, coverImageKey, status)
    .run()

  return json({
    ok: true,
    post: {
      id: result.meta.last_row_id,
      title,
      slug,
      excerpt,
      content,
      cover_image_key: coverImageKey,
      status,
    },
  })
}