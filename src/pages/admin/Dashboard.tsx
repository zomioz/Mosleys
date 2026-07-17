import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiJson } from '../../lib/api'

type User = {
  id: number
  email: string
  role: string
}

type Post = {
  id: number
  title: string
  slug: string
  excerpt: string
  content: string
  cover_image_key: string | null
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
  const [previewSrc, setPreviewSrc] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    status: 'draft' as 'draft' | 'published',
    coverImageKey: '',
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
      excerpt: '',
      content: '',
      status: 'draft',
      coverImageKey: '',
    })
    setPreviewSrc('')
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
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    setUploading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('file', file)

      const result = await apiJson<{ key: string; src: string }>('/api/admin/upload', {
        method: 'POST',
        body: formData,
      })

      setForm((current) => ({ ...current, coverImageKey: result.key }))
      setPreviewSrc(result.src)
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
      if (editingId) {
        await apiJson(`/api/admin/posts/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(form),
        })
      } else {
        await apiJson('/api/admin/posts', {
          method: 'POST',
          body: JSON.stringify(form),
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
      excerpt: post.excerpt,
      content: post.content,
      status: post.status,
      coverImageKey: post.cover_image_key || '',
    })
    setPreviewSrc(post.cover_image_key ? `/api/media/${post.cover_image_key}` : '')
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
            </label>

            <label className="form-field form-field-full">
              <span>Extrait</span>
              <textarea value={form.excerpt} onChange={(event) => setForm({ ...form, excerpt: event.target.value })} rows={3} />
            </label>

            <label className="form-field form-field-full">
              <span>Contenu</span>
              <textarea value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} rows={10} required />
            </label>

            <label className="form-field">
              <span>Statut</span>
              <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as 'draft' | 'published' })}>
                <option value="draft">Brouillon</option>
                <option value="published">Publié</option>
              </select>
            </label>

            <label className="form-field">
              <span>Image liée</span>
              <input value={form.coverImageKey} onChange={(event) => setForm({ ...form, coverImageKey: event.target.value })} placeholder="Clé R2" />
            </label>

            <label className="form-field form-field-full upload-field">
              <span>Uploader une image</span>
              <input type="file" accept="image/*" onChange={handleUpload} />
              {uploading ? <p>Upload en cours...</p> : null}
              {previewSrc ? <img className="upload-preview" src={previewSrc} alt="Aperçu" /> : null}
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
              <article key={post.id} className="admin-post-item">
                {post.cover_image_key ? (
                  <img className="admin-post-thumb" src={`/api/media/${post.cover_image_key}`} alt={post.title} />
                ) : null}
                <div className="admin-post-content">
                  <p className="post-meta">{post.status} - {post.slug}</p>
                  <h3>{post.title}</h3>
                  <p>{post.excerpt || post.content.slice(0, 120)}</p>
                </div>
                <button className="button button-secondary delete-button" type="button" onClick={() => handleEdit(post)}>
                  Modifier
                </button>
                <button className="button button-secondary delete-button" type="button" onClick={() => handleDelete(post.id)}>
                  Supprimer
                </button>
              </article>
            ))}
          </div>
        </section>
      </div>
    </section>
  )
}

export default Dashboard