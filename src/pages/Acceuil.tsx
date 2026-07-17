function Acceuil() {
	return (
		<section className="page page-home">
			<div className="hero-card">
				<span className="eyebrow">Cloudflare Pages</span>
				<h1>Base de test propre depuis zéro</h1>
				<p>
					Cette page d&apos;accueil sert à valider le routing, la navbar et le
					déploiement Cloudflare Pages avant d&apos;aller plus loin.
				</p>

				<div className="hero-actions">
					<a className="button button-primary" href="/contact">
						Aller sur Contact
					</a>
					<a className="button button-secondary" href="https://developers.cloudflare.com/pages/">
						Doc Pages
					</a>
				</div>
			</div>

			<div className="grid two-columns">
				<article className="panel">
					<h2>Ce qu’on vérifie</h2>
					<ul className="check-list">
						<li>La page `/` répond bien dans le navigateur.</li>
						<li>La navbar change d&apos;état selon la route active.</li>
						<li>Le refresh sur une route interne reste compatible Pages.</li>
					</ul>
				</article>

				<article className="panel accent-panel">
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
		</section>
	)
}

export default Acceuil
