import { json } from '../../lib/http'

export async function onRequestGet({ env }: { env: any }) {
  const result = await env.DB.prepare('SELECT COUNT(*) as count FROM users').first<{ count: number }>()

  return json({ needsBootstrap: (result?.count || 0) === 0 })
}