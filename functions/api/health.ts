export async function onRequestGet({ env }: { env: any }) {
  const result = await env.DB.prepare('SELECT 1 as ok').first()
  return Response.json({ ok: result?.ok === 1 })
}