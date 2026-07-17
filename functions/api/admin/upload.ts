import { json } from '../../lib/http'
import { requireAdmin } from '../../lib/auth'

function sanitizeFileName(fileName: string) {
  return fileName
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9.]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export async function onRequestPost({ request, env }: { request: Request; env: any }) {
  const admin = await requireAdmin(request, env)

  if (!admin) {
    return json({ error: 'Unauthorized' }, 401)
  }

  const formData = await request.formData().catch(() => null)

  if (!formData) {
    return json({ error: 'Invalid form data' }, 400)
  }

  const file = formData.get('file')

  if (!(file instanceof File)) {
    return json({ error: 'Missing file' }, 400)
  }

  if (!file.type.startsWith('image/')) {
    return json({ error: 'Only images are allowed' }, 400)
  }

  const extension = file.name.includes('.') ? file.name.split('.').pop() || 'bin' : 'bin'
  const key = `image-${Date.now()}-${crypto.randomUUID()}.${sanitizeFileName(extension)}`

  await env.MEDIA_BUCKET.put(key, await file.arrayBuffer(), {
    httpMetadata: { contentType: file.type },
  })

  return json({ ok: true, key, src: `/api/media/${key}` })
}