import { useState } from 'react'
import '../App.css'

function AuthView({ onLogin, onSignup, error }) {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [signupSuccess, setSignupSuccess] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (mode === 'login') {
      onLogin(email, password)
    } else {
      const ok = await onSignup(email, password)
      if (ok) setSignupSuccess(true)
    }
  }

  const switchMode = (newMode) => {
    setMode(newMode)
    setEmail('')
    setPassword('')
    setSignupSuccess(false)
  }

  return (
    <div className="app">
      <header className="header">
        <h1>PathFinder</h1>
      </header>

      <div className="auth-container">
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
              <p>Account created! Check your email to confirm, then log in.</p>
              <button className="auth-submit" onClick={() => switchMode('login')}>
                Go to Login
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="auth-form">
              <label className="auth-label">Email</label>
              <input
                className="auth-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
              />

              <label className="auth-label">Password</label>
              <input
                className="auth-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
              />

              {error && <p className="auth-error">{error}</p>}

              <button type="submit" className="auth-submit">
                {mode === 'login' ? 'Login' : 'Create Account'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default AuthView
