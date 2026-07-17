import { json } from '../../lib/http'

export async function onRequestGet({ env }: { env: any }) {
  try {
    const result = await env.DB.prepare('SELECT COUNT(*) as count FROM users').first<{ count: number }>()

    return json({ needsBootstrap: (result?.count || 0) === 0 })
  } catch (error) {
    const message = error instanceof Error ? error.message.toLowerCase() : ''

    if (message.includes('no such table') || message.includes('users')) {
      return json({ needsBootstrap: true })
    }

    return json({ needsBootstrap: false })
  }
}