import { useState, type FormEvent } from 'react'
import { useAuth } from '../lib/auth'

type Mode = 'signin' | 'signup'

export default function AuthPage() {
  const { signInWithEmail, signUpWithEmail, signInWithGoogle } = useAuth()

  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccessMessage(null)
    setLoading(true)

    try {
      if (mode === 'signin') {
        await signInWithEmail(email, password)
      } else {
        await signUpWithEmail(email, password)
        setSuccessMessage('Account created. Check your email to confirm your address.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogle() {
    setError(null)
    setLoading(true)
    try {
      await signInWithGoogle()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed.')
      setLoading(false)
    }
  }

  function toggleMode() {
    setMode(prev => (prev === 'signin' ? 'signup' : 'signin'))
    setError(null)
    setSuccessMessage(null)
  }

  return (
    <div className="auth-page">
      <header className="top-header">
        <div className="top-header-inner">
          <span className="top-header-title">DROBE</span>
        </div>
      </header>

      <main className="auth-main">
        <h1 className="auth-heading">
          {mode === 'signin' ? 'Welcome back' : 'Create account'}
        </h1>
        <p className="auth-sub">
          {mode === 'signin'
            ? 'Sign in to your wardrobe.'
            : 'Start building your wardrobe.'}
        </p>

        {error && (
          <div className="error-banner" role="alert">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="success-banner" role="status">
            {successMessage}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <label className="auth-label" htmlFor="auth-email">
            Email
          </label>
          <input
            id="auth-email"
            className="auth-input"
            type="email"
            autoComplete="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            disabled={loading}
          />

          <label className="auth-label" htmlFor="auth-password">
            Password
          </label>
          <input
            id="auth-password"
            className="auth-input"
            type="password"
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            disabled={loading}
          />

          <button
            type="submit"
            className={`auth-submit-btn${loading ? ' skeleton' : ''}`}
            disabled={loading}
          >
            {loading
              ? '\u00A0'
              : mode === 'signin'
              ? 'Sign in'
              : 'Create account'}
          </button>
        </form>

        <div className="auth-divider">
          <span>or</span>
        </div>

        <button
          type="button"
          className="auth-google-btn"
          onClick={handleGoogle}
          disabled={loading}
        >
          Continue with Google
        </button>

        <p className="auth-toggle">
          {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button type="button" className="auth-toggle-btn" onClick={toggleMode}>
            {mode === 'signin' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </main>
    </div>
  )
}
