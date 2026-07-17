export function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
}

export async function makeUniqueSlug(env: any, title: string, explicitSlug?: string) {
  const baseSlug = slugify(explicitSlug || title) || `post-${Date.now()}`
  let candidate = baseSlug
  let suffix = 2

  while (true) {
    const exists = await env.DB.prepare('SELECT 1 as found FROM posts WHERE slug = ? LIMIT 1')
      .bind(candidate)
      .first<{ found: number }>()

    if (!exists) {
      return candidate
    }

    candidate = `${baseSlug}-${suffix}`
    suffix += 1
  }
}