import { Link } from 'react-router-dom'

function Accueil() {
  return (
    <section className="page page-home">
      <div className="hero-card">
        <span className="eyebrow">Accueil</span>
        <h1>Mon site simple</h1>
        <p>
          Une base claire pour présenter le site. Les articles sont maintenant sur une page dédiée.
        </p>
        <div className="hero-actions">
          <Link className="button button-primary" to="/articles">
            Voir les articles
          </Link>
        </div>
      </div>

      <section className="panel">
        <h2>Structure du site</h2>
        <p>
          L&apos;accueil sert d&apos;entrée simple, la page articles contient la liste publique, et l&apos;admin reste caché.
        </p>
      </section>
    </section>
  )
}

export default Accueil