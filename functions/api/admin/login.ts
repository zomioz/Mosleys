import { comparePassword, createSession, createSessionCookie } from '../../../lib/auth'
import { json } from '../../../lib/http'

export async function onRequestPost({ request, env }: { request: Request; env: any }) {
  const payload = await request.json().catch(() => null)

  if (!payload) {
    return json({ error: 'Invalid JSON body' }, 400)
  }

  const email = String(payload.email || '').trim().toLowerCase()
  const password = String(payload.password || '')

  if (!email || !password) {
    return json({ error: 'Email and password are required' }, 400)
  }

  const user = await env.DB.prepare(
    'SELECT id, email, password_hash, role FROM users WHERE email = ? LIMIT 1',
  )
    .bind(email)
    .first<{ id: number; email: string; password_hash: string; role: string }>()

  if (!user || user.role !== 'admin') {
    return json({ error: 'Invalid credentials' }, 401)
  }

  const ok = await comparePassword(email, password, user.password_hash, env)

  if (!ok) {
    return json({ error: 'Invalid credentials' }, 401)
  }

  const session = await createSession(email, env)

  return json(
    { ok: true, email: user.email },
    200,
    { 'Set-Cookie': createSessionCookie(session) },
  )
}