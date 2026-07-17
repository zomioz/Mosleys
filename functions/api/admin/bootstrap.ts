import { createSession, createSessionCookie, hashPassword } from '../../lib/auth'
import { json } from '../../lib/http'

export async function onRequestPost({ request, env }: { request: Request; env: any }) {
  const payload = await request.json().catch(() => null)

  if (!payload) {
    return json({ error: 'Invalid JSON body' }, 400)
  }

  const token = String(payload.token || '')
  const email = String(payload.email || '').trim().toLowerCase()
  const password = String(payload.password || '')

  if (!env.BOOTSTRAP_TOKEN || token !== env.BOOTSTRAP_TOKEN) {
    return json({ error: 'Invalid bootstrap token' }, 403)
  }

  const existing = await env.DB.prepare('SELECT COUNT(*) as count FROM users').first<{ count: number }>()

  if ((existing?.count || 0) > 0) {
    return json({ error: 'Admin already exists' }, 409)
  }

  if (!email || !password) {
    return json({ error: 'Email and password are required' }, 400)
  }

  const passwordHash = await hashPassword(email, password, env)

  await env.DB.prepare('INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)')
    .bind(email, passwordHash, 'admin')
    .run()

  const session = await createSession(email, env)

  return json(
    { ok: true, bootstrap: true },
    200,
    { 'Set-Cookie': createSessionCookie(session) },
  )
}