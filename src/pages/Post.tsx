import { Link, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'

type Post = {
  id: number
  title: string
  slug: string
  excerpt: string
  content: string
  cover_image_key: string | null
  created_at: string
  updated_at: string
}

function PostPage() {
  const { slug } = useParams()
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true

    async function loadPost() {
      try {
        const response = await fetch(`/api/posts/${slug}`, { credentials: 'include' })

        if (!response.ok) {
          throw new Error('Article introuvable')
        }

        const data = (await response.json()) as { post: Post }

        if (mounted) {
          setPost(data.post)
        }
      } catch (error) {
        if (mounted) {
          setError(error instanceof Error ? error.message : 'Erreur inconnue')
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    loadPost()

    return () => {
      mounted = false
    }
  }, [slug])

  return (
    <section className="page page-post">
      <Link className="button button-secondary back-link" to="/">
        Retour
      </Link>
      {loading ? <div className="panel">Chargement de l’article...</div> : null}
      {error ? <div className="panel form-error">{error}</div> : null}
      {post ? (
        <article className="panel post-article">
          {post.cover_image_key ? (
            <img className="post-article-cover" src={`/api/media/${post.cover_image_key}`} alt={post.title} />
          ) : null}
          <p className="post-meta">Mis à jour le {new Date(post.updated_at || post.created_at).toLocaleDateString('fr-FR')}</p>
          <h1>{post.title}</h1>
          <p className="post-excerpt">{post.excerpt}</p>
          <div className="post-content">
            {post.content.split('\n').map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        </article>
      ) : null}
    </section>
  )
}

export default PostPage