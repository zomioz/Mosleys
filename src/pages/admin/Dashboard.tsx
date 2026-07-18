import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiJson } from '../../lib/api'

function createArticleKey() {
  return `art_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`
}

function formatPrice(priceCents: number) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'USD',
  }).format(priceCents / 100)
}

function getLinkedImageKeys(post: Post) {
  const keys = [post.cover_image_key, ...post.gallery_image_keys]

  return Array.from(new Set(keys.filter((key): key is string => Boolean(key))))
}

type User = {
  id: number
  email: string
  role: string
}

type Post = {
  id: number
  title: string
  slug: string
  article_key: string
  price_cents: number
  excerpt: string
  content: string
  cover_image_key: string | null
  gallery_image_keys: string[]
  status: 'draft' | 'published'
  created_at: string
  updated_at: string
}

function Dashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [previewSrcs, setPreviewSrcs] = useState<string[]>([])
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState({
    title: '',
    slug: '',
    price: '',
    excerpt: '',
    content: '',
    coverImageKey: '',
    galleryImageKeys: [] as string[],
    articleKey: createArticleKey(),
  })

  const publishedCount = useMemo(
    () => posts.filter((post) => post.status === 'published').length,
    [posts],
  )

  async function loadPosts() {
    try {
      const data = await apiJson<{ posts: Post[] }>('/api/admin/posts')
      setPosts(data.posts || [])
      setError('')
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Impossible de charger les posts')
    }
  }

  function resetForm() {
    setEditingId(null)
    setForm({
      title: '',
      slug: '',
      price: '',
      excerpt: '',
      content: '',
      coverImageKey: '',
      galleryImageKeys: [],
      articleKey: createArticleKey(),
    })
    setPreviewSrcs([])
  }

  useEffect(() => {
    let mounted = true

    async function bootstrap() {
      try {
        const meResponse = await fetch('/api/admin/me', { credentials: 'include' })

        if (meResponse.status === 401) {
          navigate('/admin/login', { replace: true })
          return
        }

        if (!meResponse.ok) {
          throw new Error(`HTTP ${meResponse.status}`)
        }

        const me = (await meResponse.json()) as { authenticated?: boolean; user?: User }

        if (!me.authenticated || !me.user) {
          navigate('/admin/login', { replace: true })
          return
        }

        if (mounted) {
          setUser(me.user)
        }

        await loadPosts()
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erreur inconnue'

        if (message.includes('Unauthorized') || message.includes('HTTP 401')) {
          navigate('/admin/login', { replace: true })
          return
        }

        if (mounted) {
          setError(`API admin indisponible: ${message}`)
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    bootstrap()

    return () => {
      mounted = false
    }
  }, [navigate])

  async function handleLogout() {
    await apiJson('/api/admin/logout', { method: 'POST' })
    navigate('/admin/login', { replace: true })
  }

  async function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || [])

    if (files.length === 0) {
      return
    }

    if (form.galleryImageKeys.length >= 3) {
      setError('Tu peux ajouter au maximum 3 images par article')
      event.target.value = ''
      return
    }

    const filesToUpload = files.slice(0, 3 - form.galleryImageKeys.length)

    setUploading(true)
    setError('')

    try {
      const uploads: Array<{ key: string; src: string }> = []

      for (const file of filesToUpload) {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('articleKey', form.articleKey)

        const result = await apiJson<{ key: string; src: string }>('/api/admin/upload', {
          method: 'POST',
          body: formData,
        })

        uploads.push(result)
      }

      setForm((current) => {
        const galleryImageKeys = [...current.galleryImageKeys, ...uploads.map((upload) => upload.key)].slice(0, 3)

        return {
          ...current,
          coverImageKey: current.coverImageKey || galleryImageKeys[0] || '',
          galleryImageKeys,
        }
      })

      setPreviewSrcs((current) => [...current, ...uploads.map((upload) => upload.src)].slice(0, 3))
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Upload impossible')
    } finally {
      setUploading(false)
      event.target.value = ''
    }
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError('')

    try {
      const priceCents = Math.max(0, Math.round(Number(String(form.price).replace(',', '.')) * 100) || 0)

      if (editingId) {
        await apiJson(`/api/admin/posts/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify({
            ...form,
            priceCents,
          }),
        })
      } else {
        await apiJson('/api/admin/posts', {
          method: 'POST',
          body: JSON.stringify({
            ...form,
            priceCents,
          }),
        })
      }

      resetForm()
      await loadPosts()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Enregistrement impossible')
    } finally {
      setSaving(false)
    }
  }

  function handleEdit(post: Post) {
    setEditingId(post.id)
    setForm({
      title: post.title,
      slug: post.slug,
      price: String(post.price_cents / 100),
      excerpt: post.excerpt,
      content: post.content,
      coverImageKey: post.cover_image_key || '',
      galleryImageKeys: post.gallery_image_keys.length > 0 ? post.gallery_image_keys : post.cover_image_key ? [post.cover_image_key] : [],
      articleKey: post.article_key,
    })
    setPreviewSrcs((post.gallery_image_keys.length > 0 ? post.gallery_image_keys : post.cover_image_key ? [post.cover_image_key] : []).map((key) => `/api/media/${key}`))
  }

  function removeGalleryImage(index: number) {
    setForm((current) => {
      const galleryImageKeys = current.galleryImageKeys.filter((_, currentIndex) => currentIndex !== index)

      return {
        ...current,
        galleryImageKeys,
        coverImageKey: galleryImageKeys[0] || '',
      }
    })
    setPreviewSrcs((current) => current.filter((_, currentIndex) => currentIndex !== index))
  }

  async function handleDelete(id: number) {
    if (!confirm('Supprimer ce post ?')) {
      return
    }

    setError('')

    try {
      await apiJson(`/api/admin/posts/${id}`, { method: 'DELETE' })
      await loadPosts()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Suppression impossible')
    }
  }

  if (loading) {
    return <section className="page auth-page"><div className="panel">Chargement du tableau de bord...</div></section>
  }

  return (
    <section className="page admin-page">
      <div className="hero-card admin-hero">
        <span className="eyebrow">Admin connecté</span>
        <h1>Tableau de bord</h1>
        <p>
          Connecté en tant que <strong>{user?.email}</strong>. Tu peux créer, supprimer et préparer les images.
        </p>

        <div className="hero-actions">
          <button className="button button-primary" type="button" onClick={handleLogout}>
            Se déconnecter
          </button>
          <button className="button button-secondary" type="button" onClick={resetForm}>
            Nouveau post
          </button>
          <Link className="button button-secondary" to="/">
            Voir le site
          </Link>
        </div>
      </div>

      <div className="grid two-columns dashboard-stats">
        <article className="panel stat-card">
          <span className="eyebrow">Total</span>
          <h2>{posts.length}</h2>
          <p>Posts dans D1</p>
        </article>
        <article className="panel stat-card">
          <span className="eyebrow">Publié</span>
          <h2>{publishedCount}</h2>
          <p>Posts visibles publiquement</p>
        </article>
      </div>

      <div className="grid two-columns admin-grid">
        <section className="panel">
          <div className="section-header">
            <div>
              <span className="eyebrow">Créer</span>
              <h2>{editingId ? 'Modifier le post' : 'Nouveau post'}</h2>
            </div>
          </div>

          <form className="form-grid" onSubmit={handleCreate}>
            <label className="form-field">
              <span>Titre</span>
              <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required />
            </label>

            <label className="form-field">
              <span>Slug optionnel</span>
              <input value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} />
              <small>Optionnel: si tu le remplis, il sert d&apos;URL personnalisée. Sinon, il est généré depuis le titre.</small>
            </label>

            <label className="form-field">
              <span>Prix en dollars</span>
              <input
                value={form.price}
                onChange={(event) => setForm({ ...form, price: event.target.value })}
                type="number"
                min="0"
                step="0.01"
                placeholder="12.00"
              />
            </label>

            <label className="form-field form-field-full">
              <span>Extrait</span>
              <small>Résumé court affiché sur les cartes et avant le contenu complet.</small>
              <textarea value={form.excerpt} onChange={(event) => setForm({ ...form, excerpt: event.target.value })} rows={3} />
            </label>

            <label className="form-field form-field-full">
              <span>Contenu</span>
              <textarea value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} rows={10} required />
            </label>

            <label className="form-field form-field-full upload-field">
              <span>Uploader jusqu&apos;à 3 images</span>
              <small>Les images sont automatiquement liées à cet article via sa clé technique.</small>
              <input type="file" accept="image/*" multiple onChange={handleUpload} />
              {uploading ? <p>Upload en cours...</p> : null}
              {previewSrcs.length > 0 ? (
                <div className="upload-previews">
                  {previewSrcs.map((src, index) => (
                    <div key={src} className="upload-preview-item">
                      <img className="upload-preview" src={src} alt={`Aperçu ${index + 1}`} />
                      <button className="button button-secondary" type="button" onClick={() => removeGalleryImage(index)}>
                        Retirer
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
            </label>

            <label className="form-field">
              <span>Clé technique</span>
              <input value={form.articleKey} readOnly />
            </label>

            {error ? <p className="form-error form-field-full">{error}</p> : null}

            <button className="button button-primary form-submit form-field-full" type="submit" disabled={saving}>
              {saving ? 'Enregistrement...' : editingId ? 'Mettre à jour' : 'Créer le post'}
            </button>
          </form>
        </section>

        <section className="panel">
          <div className="section-header">
            <div>
              <span className="eyebrow">Gestion</span>
              <h2>Posts existants</h2>
            </div>
          </div>

          <div className="admin-posts-list">
            {posts.length === 0 ? <p>Aucun post pour le moment.</p> : null}
            {posts.map((post) => (
              (() => {
                const linkedImageKeys = getLinkedImageKeys(post)

                return (
              <article key={post.id} className="admin-post-item">
                {post.cover_image_key ? <img className="admin-post-thumb" src={`/api/media/${post.cover_image_key}`} alt={post.title} /> : null}
                <div className="admin-post-content">
                  <p className="post-meta">{post.slug}</p>
                  <h3>{post.title}</h3>
                  <p className="article-price">{formatPrice(post.price_cents)}</p>
                  <p>{post.excerpt || post.content.slice(0, 120)}</p>
                  <div className="admin-post-media-strip" aria-label="Images liées">
                    {linkedImageKeys.length > 0 ? (
                      linkedImageKeys.map((key) => (
                        <img key={key} className="admin-post-media-thumb" src={`/api/media/${key}`} alt={post.title} />
                      ))
                    ) : (
                      <p className="admin-post-media-empty">Aucune image liée</p>
                    )}
                  </div>
                </div>
                <button className="button button-secondary delete-button" type="button" onClick={() => handleEdit(post)}>
                  Modifier
                </button>
                <button className="button button-secondary delete-button" type="button" onClick={() => handleDelete(post.id)}>
                  Supprimer
                </button>
              </article>
                )
              })()
            ))}
          </div>
        </section>
      </div>
    </section>
  )
}

export default Dashboard