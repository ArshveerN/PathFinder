import { useState } from 'react'
import '../App.css'

function AuthView({ onLogin, onSignup, error }) {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [signupSuccess, setSignupSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (mode === 'login') {
        await onLogin(email, password)
      } else {
        const ok = await onSignup(email, password)
        if (ok) setSignupSuccess(true)
      }
    } finally {
      setLoading(false)
    }
  }

  const switchMode = (newMode) => {
    setMode(newMode)
    setEmail('')
    setPassword('')
    setSignupSuccess(false)
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-branding">
          <h1 className="auth-logo">PathFinder</h1>
          <p className="auth-tagline">Plan your courses. Map your future.</p>
        </div>

        <div className="auth-card">
          <div className="auth-tabs">
            <button
              className={mode === 'login' ? 'auth-tab active' : 'auth-tab'}
              onClick={() => switchMode('login')}
            >
              Login
            </button>
            <button
              className={mode === 'signup' ? 'auth-tab active' : 'auth-tab'}
              onClick={() => switchMode('signup')}
            >
              Sign Up
            </button>
          </div>

          {signupSuccess ? (
            <div className="auth-success">
              <div className="auth-success-icon">&#10003;</div>
              <p>Account created! Check your email to confirm, then log in.</p>
              <button className="auth-submit" onClick={() => switchMode('login')}>
                Go to Login
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="auth-form">
              <h2 className="auth-heading">
                {mode === 'login' ? 'Welcome back' : 'Get started'}
              </h2>
              <p className="auth-subheading">
                {mode === 'login'
                  ? 'Sign in to continue to PathFinder'
                  : 'Create an account to start planning'}
              </p>

              <div className="auth-field">
                <label className="auth-label" htmlFor="auth-email">Email</label>
                <div className="auth-input-wrapper">
                  <span className="auth-input-icon">&#9993;</span>
                  <input
                    id="auth-email"
                    className="auth-input"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div className="auth-field">
                <label className="auth-label" htmlFor="auth-password">Password</label>
                <div className="auth-input-wrapper">
                  <span className="auth-input-icon">&#128272;</span>
                  <input
                    id="auth-password"
                    className="auth-input"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    minLength={6}
                  />
                </div>
              </div>

              {error && <p className="auth-error">{error}</p>}

              <button type="submit" className="auth-submit" disabled={loading}>
                {loading
                  ? 'Please wait...'
                  : mode === 'login'
                    ? 'Sign In'
                    : 'Create Account'}
              </button>

              <p className="auth-switch-text">
                {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                <span
                  className="auth-switch-link"
                  onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}
                >
                  {mode === 'login' ? 'Sign up' : 'Log in'}
                </span>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default AuthView
