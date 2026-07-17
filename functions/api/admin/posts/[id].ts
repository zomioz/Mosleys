import { json } from '../../../../lib/http'
import { requireAdmin } from '../../../../lib/auth'

export async function onRequestDelete({ request, env, params }: { request: Request; env: any; params: any }) {
  const admin = await requireAdmin(request, env)

  if (!admin) {
    return json({ error: 'Unauthorized' }, 401)
  }

  const id = Number(params.id)

  if (!Number.isInteger(id)) {
    return json({ error: 'Invalid post id' }, 400)
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
  const excerpt = String(payload.excerpt || '').trim()
  const content = String(payload.content || '').trim()
  const coverImageKey = String(payload.coverImageKey || '').trim() || null
  const status = String(payload.status || 'draft').trim() === 'published' ? 'published' : 'draft'

  if (!title || !content) {
    return json({ error: 'Title and content are required' }, 400)
  }

  await env.DB.prepare(
    `UPDATE posts
     SET title = ?, excerpt = ?, content = ?, cover_image_key = ?, status = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
  )
    .bind(title, excerpt, content, coverImageKey, status, id)
    .run()

  return json({ ok: true })
}