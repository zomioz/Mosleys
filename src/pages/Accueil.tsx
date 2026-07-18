import { Link } from 'react-router-dom'
import logoSrc from '../assets/hero.png'

const transparentLogoSrc = '/mosleys-logo-transparent.png'

function Accueil() {
  return (
    <section className="page page-home">
      <div className="hero-card">
        <div className="home-logo-wrap" aria-hidden="true">
          <img
            className="home-logo"
            src={transparentLogoSrc}
            alt="Mosleys AUTO"
            onError={(event) => {
              event.currentTarget.src = logoSrc
            }}
          />
        </div>
        <span className="eyebrow">Mosleys AUTO</span>
        <h1>Un projet de Roy et Timothy Wheeler</h1>
        <p>
          Ébauche du site catalogue de Mosleys AUTO.
        </p>
        <div className="hero-actions">
          <Link className="button button-primary" to="/articles">
            Voir les articles
          </Link>
        </div>
      </div>

      <section className="panel accent-panel">
        <span className="eyebrow">Très bientôt</span>
        <h2>Les prochaines sections du catalogue</h2>
        <p>
          Catalogue occasion, catalogue location, liste des véhicules en fourrière.
        </p>
      </section>
    </section>
  )
}

export default Accueil