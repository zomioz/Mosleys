import { json } from '../../lib/http'
import { requireAdmin } from '../../lib/auth'

export async function onRequestGet({ request, env }: { request: Request; env: any }) {
  const user = await requireAdmin(request, env)

  if (!user) {
    return json({ authenticated: false }, 401)
  }

  return json({ authenticated: true, user: { id: user.id, email: user.email, role: user.role } })
}