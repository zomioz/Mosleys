import { NavLink } from 'react-router-dom'

const links = [
  { to: '/', label: 'Accueil' },
  { to: '/admin', label: 'Admin' },
  { to: '/contact', label: 'Contact' },
]

function Navbar() {
  return (
    <header className="navbar">
      <NavLink className="brand" to="/">
        <span className="brand-mark">M</span>
        <span className="brand-text">
          <strong>Mosleys</strong>
          <small>Cloudflare Pages content base</small>
        </span>
      </NavLink>

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
