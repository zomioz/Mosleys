import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

type ArticleData = {
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

function Article() {
  const { slug } = useParams()
  const [article, setArticle] = useState<ArticleData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [imageIndex, setImageIndex] = useState(0)

  const images = useMemo(() => {
    if (!article) {
      return []
    }

    const candidates = article.gallery_image_keys.length > 0 ? article.gallery_image_keys : article.cover_image_key ? [article.cover_image_key] : []

    return candidates.slice(0, 3)
  }, [article])

  const currentImage = images[imageIndex] || images[0]

  function changeImage(direction: 1 | -1) {
    if (images.length <= 1) {
      return
    }

    setImageIndex((current) => (current + direction + images.length) % images.length)
  }

  useEffect(() => {
    let active = true

    async function loadArticle() {
      try {
        const response = await fetch(`/api/posts/${slug}`, { credentials: 'include' })

        if (!response.ok) {
          throw new Error('Article introuvable')
        }

        const data = (await response.json()) as { post: ArticleData }

        if (active) {
          setArticle(data.post)
          setImageIndex(0)
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

    loadArticle()

    return () => {
      active = false
    }
  }, [slug])

  return (
    <section className="page page-post">
      <Link className="button button-secondary" to="/">
        Retour à l&apos;accueil
      </Link>

      {loading ? <div className="panel">Chargement de l&apos;article...</div> : null}
      {error ? <div className="panel form-error">{error}</div> : null}

      {article ? (
        <article className="panel post-article">
          <div className="article-detail-gallery">
            {currentImage ? <img className="post-article-cover" src={`/api/media/${currentImage}`} alt={article.title} /> : null}
            {images.length > 1 ? (
              <>
                <button className="carousel-arrow carousel-arrow-left" type="button" aria-label="Photo précédente" onClick={() => changeImage(-1)}>
                  ‹
                </button>
                <button className="carousel-arrow carousel-arrow-right" type="button" aria-label="Photo suivante" onClick={() => changeImage(1)}>
                  ›
                </button>
                <span className="carousel-count">
                  {imageIndex + 1}/{images.length}
                </span>
              </>
            ) : null}
          </div>
          <p className="post-meta">Mis à jour le {new Date(article.updated_at || article.created_at).toLocaleDateString('fr-FR')}</p>
          <h1>{article.title}</h1>
          <p className="article-price">{formatPrice(article.price_cents)}</p>
          <p className="post-excerpt">{article.excerpt}</p>
          <div className="post-content">
            {article.content.split('\n').map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        </article>
      ) : null}
    </section>
  )
}

export default Article