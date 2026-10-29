import { useState } from 'react'
import { api } from '../services/api.js'

export default function Login({ onLogin, onNavigate, notice }) {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setError('')
    if (!form.email.trim() || !form.password) {
      setError('Enter your email and password to continue.')
      return
    }
    setBusy(true)
    try {
      const { user } = await api.auth.login(form)
      onLogin(user)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="auth-layout">
      <section className="auth-panel">
        <a className="wordmark" href="/login" onClick={(event) => { event.preventDefault(); onNavigate('/login') }}>
          <span className="brand-mark">R</span><span>roxillar<span className="wordmark-light"> / ratings</span></span>
        </a>
        <div className="auth-content">
          <p className="eyebrow">STORE RATING PLATFORM</p>
          <h1>Good to see<br />you again.</h1>
          <p className="auth-intro">Sign in to discover trusted local stores and share your experience.</p>
          {notice && <p className="notice" role="status">{notice}</p>}
          {error && <p className="form-error" role="alert">{error}</p>}
          <form onSubmit={submit} className="form-stack">
            <label>Email address<input type="email" autoComplete="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required /></label>
            <label>Password<input type="password" autoComplete="current-password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required /></label>
            <button className="button button-primary" type="submit" disabled={busy}>{busy ? <><span className="button-loader" />Signing in</> : 'Sign in'}</button>
          </form>
          <p className="auth-footer">New to Roxillar? <button type="button" className="text-button" onClick={() => onNavigate('/signup')}>Create an account</button></p>
        </div>
        <p className="auth-legal">A clearer picture of every neighborhood.</p>
      </section>
      <aside className="auth-aside" aria-label="Platform summary">
        <div className="aside-number">01 <span>COMMUNITY, IN FOCUS</span></div>
        <div className="aside-copy"><div className="rating-stamp">5 / 5</div><h2>Every visit<br />has a story.</h2><p>Real ratings from people who know their neighborhood.</p></div>
        <div className="aside-bottom"><span>LOCAL KNOWLEDGE</span><span>BUILT ON TRUST</span></div>
      </aside>
    </main>
  )
}