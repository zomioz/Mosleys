import { NavLink } from 'react-router-dom'

const links = [
  { to: '/', label: 'Accueil' },
  { to: '/contact', label: 'Contact' },
]

function Navbar() {
  return (
    <header className="navbar">
      <a className="brand" href="/">
        <span className="brand-mark">M</span>
        <span className="brand-text">
          <strong>Mosleys</strong>
          <small>Cloudflare Pages test base</small>
        </span>
      </a>

      <nav className="nav-links" aria-label="Navigation principale">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/'}
            className={({ isActive }) =>
              isActive ? 'nav-link nav-link-active' : 'nav-link'
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </header>
  )
}

export default Navbar
