import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiJson } from '../lib/api'

type PostSummary = {
  id: number
  title: string
  slug: string
  article_key: string
  price_cents: number
  excerpt: string
  content: string
  cover_image_key: string | null
  gallery_image_keys: string[]
  created_at: string
  updated_at: string
}

function formatPrice(priceCents: number) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'USD',
  }).format(priceCents / 100)
}

function Articles() {
  const [posts, setPosts] = useState<PostSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [imageIndexes, setImageIndexes] = useState<Record<number, number>>({})
  const [isEditing, setIsEditing] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [editForm, setEditForm] = useState({
    title: '',
    slug: '',
    price: '',
    excerpt: '',
    content: '',
  })

  const expandedPost = useMemo(() => posts.find((post) => post.id === expandedId) || null, [expandedId, posts])

  async function loadPosts() {
    const response = await fetch('/api/posts', { credentials: 'include' })

    if (!response.ok) {
      throw new Error('Impossible de charger les articles')
    }

    const data = (await response.json()) as { posts: PostSummary[] }
    setPosts(data.posts || [])
  }

  async function loadAdminState() {
    try {
      const response = await fetch('/api/admin/me', { credentials: 'include' })

      if (!response.ok) {
        setIsAdmin(false)
        return
      }

      const data = (await response.json()) as { authenticated?: boolean }
      setIsAdmin(Boolean(data.authenticated))
    } catch {
      setIsAdmin(false)
    }
  }

  function getImages(post: PostSummary) {
    const images = post.gallery_image_keys.length > 0 ? post.gallery_image_keys : post.cover_image_key ? [post.cover_image_key] : []

    return images.slice(0, 3)
  }

  function changeImage(postId: number, direction: 1 | -1, total: number) {
    if (total <= 1) {
      return
    }

    setImageIndexes((current) => {
      const currentIndex = current[postId] || 0
      const nextIndex = (currentIndex + direction + total) % total

      return { ...current, [postId]: nextIndex }
    })
  }

  function renderCarousel(post: PostSummary, variant: 'card' | 'detail') {
    const images = getImages(post)
    const currentIndex = imageIndexes[post.id] || 0
    const currentImage = images[currentIndex] || images[0]

    if (!currentImage) {
      return <div className="article-media article-media-empty">Pas de photo</div>
    }

    return (
      <div className={`article-media article-media-${variant}`}>
        <img src={`/api/media/${currentImage}`} alt={post.title} />
        {images.length > 1 ? (
          <>
            <button
              className="carousel-arrow carousel-arrow-left"
              type="button"
              aria-label="Photo précédente"
              onClick={(event) => {
                event.stopPropagation()
                changeImage(post.id, -1, images.length)
              }}
            >
              ‹
            </button>
            <button
              className="carousel-arrow carousel-arrow-right"
              type="button"
              aria-label="Photo suivante"
              onClick={(event) => {
                event.stopPropagation()
                changeImage(post.id, 1, images.length)
              }}
            >
              ›
            </button>
            <span className="carousel-count">
              {currentIndex + 1}/{images.length}
            </span>
          </>
        ) : null}
      </div>
    )
  }

  useEffect(() => {
    let active = true

    async function bootstrap() {
      try {
        await Promise.all([loadPosts(), loadAdminState()])
        if (active) {
          setError('')
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Erreur inconnue')
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    bootstrap()

    return () => {
      active = false
    }
  }, [])

  function startEdit(post: PostSummary) {
    setIsEditing(true)
    setEditForm({
      title: post.title,
      slug: post.slug,
      price: String(post.price_cents / 100),
      excerpt: post.excerpt,
      content: post.content,
    })
  }

  function openEdit(post: PostSummary) {
    setExpandedId(post.id)
    startEdit(post)
  }

  function closeModal() {
    setExpandedId(null)
    setIsEditing(false)
  }

  async function handleAdminDelete(post: PostSummary) {
    if (!confirm(`Supprimer l'annonce "${post.title}" ?`)) {
      return
    }

    setSubmitting(true)
    try {
      await apiJson(`/api/admin/posts/${post.id}`, { method: 'DELETE' })
      await loadPosts()
      closeModal()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Suppression impossible')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleAdminUp(post: PostSummary) {
    setSubmitting(true)
    try {
      await apiJson(`/api/admin/posts/${post.id}`, { method: 'POST' })
      await loadPosts()
      setExpandedId(post.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Remontée impossible')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleAdminSave(post: PostSummary) {
    setSubmitting(true)
    try {
      const priceCents = Math.max(0, Math.round(Number(String(editForm.price).replace(',', '.')) * 100) || 0)

      await apiJson(`/api/admin/posts/${post.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          title: editForm.title,
          slug: editForm.slug,
          excerpt: editForm.excerpt,
          content: editForm.content,
          priceCents,
          coverImageKey: post.cover_image_key,
          galleryImageKeys: post.gallery_image_keys,
          articleKey: post.article_key,
        }),
      })

      await loadPosts()
      setIsEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Modification impossible')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="page page-articles">
      <section className="panel">
        <div className="section-header">
          <div>
            <span className="eyebrow">Liste</span>
            <h2>Articles publiés</h2>
          </div>
        </div>
        {loading ? <p>Chargement...</p> : null}
        {error ? <p className="form-error">{error}</p> : null}
        {!loading && !error && posts.length === 0 ? <p>Aucun article pour le moment.</p> : null}

        <div className="articles-grid">
          {posts.map((post) => (
            <article
              key={post.id}
              className={`article-card ${expandedId === post.id ? 'article-card-active' : ''}`}
              onClick={() => setExpandedId(post.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  setExpandedId(post.id)
                }
              }}
            >
              {renderCarousel(post, 'card')}

              <div className="article-card-content">
                {isAdmin ? <p className="post-meta">{new Date(post.updated_at || post.created_at).toLocaleDateString('fr-FR')}</p> : null}
                <h3>{post.title}</h3>
                <p className="article-price">{formatPrice(post.price_cents)}</p>
                <p className="article-snippet">{post.excerpt || post.content.slice(0, 110)}</p>
                <div className="article-card-actions">
                  <button className="button button-secondary" type="button">
                    Afficher
                  </button>
                  <Link className="button button-secondary" to={`/post/${post.slug}`} onClick={(event) => event.stopPropagation()}>
                    Voir le lien de l'annonce
                  </Link>
                  {isAdmin ? (
                    <>
                      <button
                        className="button button-secondary"
                        type="button"
                        disabled={submitting}
                        onClick={(event) => {
                          event.stopPropagation()
                          void handleAdminUp(post)
                        }}
                      >
                        UP
                      </button>
                      <button
                        className="button button-secondary"
                        type="button"
                        disabled={submitting}
                        onClick={(event) => {
                          event.stopPropagation()
                          openEdit(post)
                        }}
                      >
                        Modifier l'annonce
                      </button>
                      <button
                        className="button button-secondary"
                        type="button"
                        disabled={submitting}
                        onClick={(event) => {
                          event.stopPropagation()
                          void handleAdminDelete(post)
                        }}
                      >
                        Supprimer l'annonce
                      </button>
                    </>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {expandedPost ? (
        <div className="article-modal-backdrop" role="dialog" aria-modal="true" aria-label={`Détail ${expandedPost.title}`} onClick={closeModal}>
          <article className="panel article-modal" onClick={(event) => event.stopPropagation()}>
            <button className="article-modal-close" type="button" aria-label="Fermer" onClick={closeModal}>
              ×
            </button>

            <div className="article-detail-gallery">{renderCarousel(expandedPost, 'detail')}</div>

            <div className="article-detail-copy">
              <div className="article-detail-header">
                <div>
                  <span className="eyebrow">Vue agrandie</span>
                  <h2>{isEditing ? 'Modifier l\'annonce' : expandedPost.title}</h2>
                </div>
              </div>

              {isAdmin ? <p className="post-meta">{new Date(expandedPost.updated_at || expandedPost.created_at).toLocaleDateString('fr-FR')}</p> : null}

              {isEditing ? (
                <form
                  className="form-grid"
                  onSubmit={(event) => {
                    event.preventDefault()
                    void handleAdminSave(expandedPost)
                  }}
                >
                  <label className="form-field">
                    <span>Titre</span>
                    <input value={editForm.title} onChange={(event) => setEditForm({ ...editForm, title: event.target.value })} required />
                  </label>
                  <label className="form-field">
                    <span>Slug</span>
                    <input value={editForm.slug} onChange={(event) => setEditForm({ ...editForm, slug: event.target.value })} />
                  </label>
                  <label className="form-field">
                    <span>Prix en dollars</span>
                    <input value={editForm.price} onChange={(event) => setEditForm({ ...editForm, price: event.target.value })} type="number" min="0" step="0.01" />
                  </label>
                  <label className="form-field form-field-full">
                    <span>Extrait</span>
                    <textarea rows={3} value={editForm.excerpt} onChange={(event) => setEditForm({ ...editForm, excerpt: event.target.value })} />
                  </label>
                  <label className="form-field form-field-full">
                    <span>Contenu</span>
                    <textarea rows={8} value={editForm.content} onChange={(event) => setEditForm({ ...editForm, content: event.target.value })} required />
                  </label>
                  <div className="article-admin-actions">
                    <button className="button button-primary" type="submit" disabled={submitting}>
                      {submitting ? 'Enregistrement...' : 'Enregistrer'}
                    </button>
                    <button className="button button-secondary" type="button" disabled={submitting} onClick={() => setIsEditing(false)}>
                      Annuler
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <p className="article-price">{formatPrice(expandedPost.price_cents)}</p>
                  <p className="article-excerpt">{expandedPost.excerpt}</p>
                  <div className="article-content">
                    {expandedPost.content.split('\n').map((paragraph, index) => (
                      <p key={index}>{paragraph}</p>
                    ))}
                  </div>
                </>
              )}
            </div>
          </article>
        </div>
      ) : null}
    </section>
  )
}

export default Articles