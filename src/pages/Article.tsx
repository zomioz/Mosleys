import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

type ArticleData = {
  id: number
  title: string
  slug: string
  excerpt: string
  content: string
  cover_image_key: string | null
  created_at: string
  updated_at: string
}

function Article() {
  const { slug } = useParams()
  const [article, setArticle] = useState<ArticleData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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
          {article.cover_image_key ? (
            <img className="post-article-cover" src={`/api/media/${article.cover_image_key}`} alt={article.title} />
          ) : null}
          <p className="post-meta">Mis à jour le {new Date(article.updated_at || article.created_at).toLocaleDateString('fr-FR')}</p>
          <h1>{article.title}</h1>
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