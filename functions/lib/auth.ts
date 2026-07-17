const SESSION_COOKIE = 'mosleys_admin_session'
const DEFAULT_SECRET = 'dev-secret'

type SessionPayload = {
  email: string
  exp: number
}

function getSecret(env: any) {
  return env.AUTH_SECRET || DEFAULT_SECRET
}

function encodeBase64Url(input: string) {
  return btoa(input).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function decodeBase64Url(input: string) {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/')
  const padded = `${base64}${'='.repeat((4 - (base64.length % 4)) % 4)}`

  return atob(padded)
}

function toHex(bytes: Uint8Array) {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

async function sha256Hex(value: string) {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return toHex(new Uint8Array(hash))
}

async function hmacHex(secret: string, value: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )

  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value))
  return toHex(new Uint8Array(signature))
}

function parseCookie(cookieHeader: string | null, name: string) {
  if (!cookieHeader) return null

  const cookie = cookieHeader
    .split(';')
    .map((chunk) => chunk.trim())
    .find((chunk) => chunk.startsWith(`${name}=`))

  return cookie ? decodeURIComponent(cookie.slice(name.length + 1)) : null
}

function buildCookie(name: string, value: string, options: { maxAge?: number; httpOnly?: boolean }) {
  const segments = [`${name}=${encodeURIComponent(value)}`, 'Path=/', 'SameSite=Lax']

  if (options.httpOnly !== false) {
    segments.push('HttpOnly')
  }

  if (typeof options.maxAge === 'number') {
    segments.push(`Max-Age=${options.maxAge}`)
  }

  return segments.join('; ')
}

export async function hashPassword(email: string, password: string, env: any) {
  return sha256Hex(`${email.toLowerCase().trim()}:${password}:${getSecret(env)}`)
}

export async function createSession(email: string, env: any) {
  const payload: SessionPayload = {
    email: email.toLowerCase().trim(),
    exp: Date.now() + 1000 * 60 * 60 * 24 * 7,
  }

  const encodedPayload = encodeBase64Url(JSON.stringify(payload))
  const signature = await hmacHex(getSecret(env), encodedPayload)

  return `${encodedPayload}.${signature}`
}

export async function verifySession(token: string, env: any) {
  const [payloadPart, signaturePart] = token.split('.')

  if (!payloadPart || !signaturePart) {
    return null
  }

  const expectedSignature = await hmacHex(getSecret(env), payloadPart)

  if (expectedSignature !== signaturePart) {
    return null
  }

  try {
    const payload = JSON.parse(decodeBase64Url(payloadPart)) as SessionPayload

    if (!payload.email || !payload.exp || Date.now() > payload.exp) {
      return null
    }

    return payload
  } catch {
    return null
  }
}

export function createSessionCookie(token: string) {
  return buildCookie(SESSION_COOKIE, token, { maxAge: 60 * 60 * 24 * 7 })
}

export function clearSessionCookie() {
  return buildCookie(SESSION_COOKIE, '', { maxAge: 0 })
}

export function readSessionToken(request: Request) {
  return parseCookie(request.headers.get('Cookie'), SESSION_COOKIE)
}

export async function requireAdmin(request: Request, env: any) {
  const token = readSessionToken(request)

  if (!token) {
    return null
  }

  const session = await verifySession(token, env)

  if (!session) {
    return null
  }

  const user = await env.DB.prepare(
    'SELECT id, email, role FROM users WHERE email = ? AND role = ? LIMIT 1',
  )
    .bind(session.email, 'admin')
    .first<{ id: number; email: string; role: string }>()

  return user
}

export async function comparePassword(email: string, password: string, hash: string, env: any) {
  const nextHash = await hashPassword(email, password, env)
  return nextHash === hash
}