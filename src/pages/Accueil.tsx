import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

type PostSummary = {
  id: number
  title: string
  slug: string
  excerpt: string
  content: string
  cover_image_key: string | null
  created_at: string
}

function Accueil() {
  const [posts, setPosts] = useState<PostSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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
    <section className="page page-home">
      <div className="hero-card">
        <span className="eyebrow">Accueil</span>
        <h1>Mon site simple</h1>
        <p>
          Une base claire pour afficher les articles publics et gérer le contenu depuis un espace admin caché.
        </p>
      </div>

      <section className="panel">
        <h2>Articles publiés</h2>
        {loading ? <p>Chargement...</p> : null}
        {error ? <p className="form-error">{error}</p> : null}
        {!loading && !error && posts.length === 0 ? <p>Aucun article pour le moment.</p> : null}

        <div className="posts-grid">
          {posts.map((post) => (
            <article key={post.id} className="post-card">
              {post.cover_image_key ? (
                <img className="post-cover" src={`/api/media/${post.cover_image_key}`} alt={post.title} />
              ) : null}
              <div className="post-card-content">
                <p className="post-meta">{new Date(post.created_at).toLocaleDateString('fr-FR')}</p>
                <h3>{post.title}</h3>
                <p>{post.excerpt || post.content.slice(0, 140)}</p>
                <Link className="button button-secondary" to={`/post/${post.slug}`}>
                  Lire l&apos;article
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </section>
  )
}

export default Accueil