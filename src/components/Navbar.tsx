import { useEffect, useMemo, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'

const links = [
  { to: '/', label: 'Accueil' },
  { to: '/articles', label: 'Articles' },
]

function Navbar() {
  const location = useLocation()
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false)

  useEffect(() => {
    let active = true

    async function checkAdminSession() {
      try {
        const response = await fetch('/api/admin/me', { credentials: 'include' })

        if (!active) {
          return
        }

        if (!response.ok) {
          setIsAdminAuthenticated(false)
          return
        }

        const data = (await response.json()) as { authenticated?: boolean }
        setIsAdminAuthenticated(Boolean(data.authenticated))
      } catch {
        if (active) {
          setIsAdminAuthenticated(false)
        }
      }
    }

    checkAdminSession()

    return () => {
      active = false
    }
  }, [location.pathname])

  const visibleLinks = useMemo(
    () => (isAdminAuthenticated ? [...links, { to: '/admin', label: 'Admin' }] : links),
    [isAdminAuthenticated],
  )

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
        {visibleLinks.map((link) => (
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
