import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

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
}

function formatPrice(priceCents: number) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(priceCents / 100)
}

function Articles() {
  const [posts, setPosts] = useState<PostSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [imageIndexes, setImageIndexes] = useState<Record<number, number>>({})

  const expandedPost = useMemo(
    () => posts.find((post) => post.id === expandedId) || posts[0] || null,
    [expandedId, posts],
  )

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

    async function loadPosts() {
      try {
        const response = await fetch('/api/posts', { credentials: 'include' })

        if (!response.ok) {
          throw new Error('Impossible de charger les articles')
        }

        const data = (await response.json()) as { posts: PostSummary[] }

        if (active) {
          setPosts(data.posts || [])
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

    loadPosts()

    return () => {
      active = false
    }
  }, [])

  return (
    <section className="page page-articles">
      <div className="hero-card">
        <span className="eyebrow">Articles</span>
        <h1>Les articles</h1>
        <p>
          Chaque article est présenté dans une carte indépendante. Le clic ouvre une vue agrandie sur la même page.
        </p>
      </div>

      {expandedPost ? (
        <article className="panel article-detail" aria-label="Aperçu détaillé">
          <div className="article-detail-gallery">{renderCarousel(expandedPost, 'detail')}</div>

          <div className="article-detail-copy">
            <div className="article-detail-header">
              <div>
                <span className="eyebrow">Vue agrandie</span>
                <h2>{expandedPost.title}</h2>
              </div>
              <button className="button button-secondary" type="button" onClick={() => setExpandedId(null)}>
                Fermer
              </button>
            </div>

            <p className="article-price">{formatPrice(expandedPost.price_cents)}</p>
            <p className="article-excerpt">{expandedPost.excerpt}</p>
            <div className="article-content">
              {expandedPost.content.split('\n').map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </div>
        </article>
      ) : null}

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
              className={`article-card ${expandedPost?.id === post.id ? 'article-card-active' : ''}`}
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
                <p className="post-meta">{new Date(post.created_at).toLocaleDateString('fr-FR')}</p>
                <h3>{post.title}</h3>
                <p className="article-price">{formatPrice(post.price_cents)}</p>
                <p>{post.excerpt || post.content.slice(0, 140)}</p>
                <div className="article-card-actions">
                  <button className="button button-secondary" type="button">
                    Ouvrir
                  </button>
                  <Link className="button button-secondary" to={`/post/${post.slug}`} onClick={(event) => event.stopPropagation()}>
                    Page dédiée
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </section>
  )
}

export default Articles