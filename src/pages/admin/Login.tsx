import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiJson } from '../../lib/api'

type AdminInit = {
  needsBootstrap: boolean
}

function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [bootstrapToken, setBootstrapToken] = useState('')
  const [needsBootstrap, setNeedsBootstrap] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true

    async function loadInit() {
      try {
        const meResponse = await fetch('/api/admin/me', { credentials: 'include' })

        if (meResponse.ok) {
          const me = (await meResponse.json()) as { authenticated?: boolean }

          if (me.authenticated) {
            navigate('/admin', { replace: true })
            return
          }
        }

        const initResponse = await fetch('/api/admin/init', { credentials: 'include' })

        if (initResponse.ok) {
          const initData = (await initResponse.json()) as AdminInit

          if (mounted) {
            setNeedsBootstrap(initData.needsBootstrap)
          }
        } else if (mounted) {
          setNeedsBootstrap(false)
        }
      } catch (error) {
        if (mounted) {
          setNeedsBootstrap(false)
        }
      } finally {
        if (mounted) {
          setError('')
          setLoading(false)
        }
      }
    }

    loadInit()

    return () => {
      mounted = false
    }
  }, [navigate])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      if (needsBootstrap) {
        await apiJson('/api/admin/bootstrap', {
          method: 'POST',
          body: JSON.stringify({ email, password, token: bootstrapToken }),
        })
      } else {
        await apiJson('/api/admin/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        })
      }

      navigate('/admin', { replace: true })
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Connexion impossible')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <section className="page auth-page"><div className="panel">Chargement...</div></section>
  }

  return (
    <section className="page auth-page">
      <div className="panel auth-panel">
        <span className="eyebrow">Admin</span>
        <h1>{needsBootstrap ? 'Créer le premier admin' : 'Connexion admin'}</h1>
        <p>
          {needsBootstrap
            ? 'Renseigne le token de bootstrap Cloudflare, puis ton email et ton mot de passe.'
            : 'Connecte-toi pour gérer les posts et envoyer les images dans R2.'}
        </p>

        <form className="form-grid" onSubmit={handleSubmit}>
          <label className="form-field">
            <span>Email</span>
            <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required />
          </label>

          <label className="form-field">
            <span>Mot de passe</span>
            <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" required />
          </label>

          {needsBootstrap ? (
            <label className="form-field">
              <span>Token de bootstrap</span>
              <input value={bootstrapToken} onChange={(event) => setBootstrapToken(event.target.value)} type="password" required />
            </label>
          ) : null}

          {error ? <p className="form-error">{error}</p> : null}

          <button className="button button-primary form-submit" type="submit" disabled={submitting}>
            {submitting ? 'En cours...' : needsBootstrap ? 'Créer l’admin' : 'Se connecter'}
          </button>
        </form>

        <div className="auth-links">
          <Link className="button button-secondary" to="/">
            Retour au site
          </Link>
        </div>
      </div>
    </section>
  )
}

export default Login
