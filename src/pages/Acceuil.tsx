import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'

type Post = {
	id: number
	title: string
	slug: string
	excerpt: string
	content: string
	cover_image_key: string | null
	created_at: string
}

function Acceuil() {
	const [posts, setPosts] = useState<Post[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState('')

	useEffect(() => {
		let mounted = true

		async function loadPosts() {
			try {
				const response = await fetch('/api/posts', { credentials: 'include' })

				if (!response.ok) {
					throw new Error('Impossible de charger les posts publics')
				}

				const data = (await response.json()) as { posts: Post[] }

				if (mounted) {
					setPosts(data.posts || [])
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

		loadPosts()

		return () => {
			mounted = false
		}
	}, [])

	return (
		<section className="page page-home">
			<div className="hero-card hero-card-home">
				<span className="eyebrow">Cloudflare Pages</span>
				<h1>Base publique prête pour tes posts</h1>
				<p>
					Cette base affiche les posts publics, protège l&apos;administration,
					stocke le contenu dans D1 et les images dans R2.
				</p>

				<div className="hero-actions">
					<Link className="button button-primary" to="/admin/login">
						Aller à l&apos;admin
					</Link>
					<Link className="button button-secondary" to="/contact">
						Page de test
					</Link>
				</div>
			</div>

			<div className="grid two-columns">
				<article className="panel accent-panel">
					<h2>Ce qui est déjà branché</h2>
					<ul className="check-list">
						<li>Route publique `/api/posts`</li>
						<li>Authentification admin</li>
						<li>Upload d’images vers R2</li>
						<li>Création et suppression de posts</li>
					</ul>
				</article>

				<article className="panel">
					<h2>Déploiement attendu</h2>
					<p>
						Build command: <code>npm run build</code>
					</p>
					<p>
						Output directory: <code>dist</code>
					</p>
					<p>
						Redirection SPA: <code>public/_redirects</code>
					</p>
				</article>
			</div>

			<section className="panel section-block">
				<div className="section-header">
					<div>
						<span className="eyebrow">Articles</span>
						<h2>Derniers posts publiés</h2>
					</div>
				</div>

				{loading ? <p>Chargement des posts...</p> : null}
				{error ? <p className="form-error">{error}</p> : null}

				{!loading && !error && posts.length === 0 ? <p>Aucun post publié pour l’instant.</p> : null}

				<div className="posts-grid">
					{posts.map((post) => (
						<article key={post.id} className="post-card">
							{post.cover_image_key ? (
								<img className="post-cover" src={`/api/media/${post.cover_image_key}`} alt={post.title} />
							) : null}
							<div className="post-card-content">
								<p className="post-meta">Publié le {new Date(post.created_at).toLocaleDateString('fr-FR')}</p>
								<h3>{post.title}</h3>
								<p>{post.excerpt || post.content.slice(0, 160)}</p>
								<Link className="button button-secondary" to={`/post/${post.slug}`}>
									Lire l’article
								</Link>
							</div>
						</article>
					))}
				</div>
			</section>
		</section>
	)
}

export default Acceuil
