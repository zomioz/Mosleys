import { json } from '../lib/http'

export async function onRequestGet({ env }: { env: any }) {
  const result = await env.DB.prepare('SELECT 1 as ok').first<{ ok: number }>()

  return json({ ok: result?.ok === 1, database: 'connected' })
}