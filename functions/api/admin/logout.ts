import { clearSessionCookie } from '../../lib/auth'
import { json } from '../../lib/http'

export async function onRequestPost() {
  return json({ ok: true }, 200, { 'Set-Cookie': clearSessionCookie() })
}