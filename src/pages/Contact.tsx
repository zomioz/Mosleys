function Contact() {
	return (
		<section className="page page-contact">
			<div className="hero-card">
				<span className="eyebrow">Page de test</span>
				<h1>Contact</h1>
				<p>
					Cette page sert à vérifier une deuxième route, le style de la navbar
					et le comportement Cloudflare Pages sur un accès direct.
				</p>
			</div>

			<div className="grid three-columns">
				<article className="panel">
					<h2>Email</h2>
					<p>hello@mosleys.dev</p>
				</article>
				<article className="panel">
					<h2>GitHub</h2>
					<p>Repo neuf connecté à Cloudflare Pages.</p>
				</article>
				<article className="panel">
					<h2>Statut</h2>
					<p>Route de test prête pour le déploiement.</p>
				</article>
			</div>
		</section>
	)
}

export default Contact
