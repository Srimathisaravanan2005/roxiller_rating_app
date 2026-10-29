import { useState } from 'react'
import { api } from '../services/api.js'

export default function Signup({ onRegistered, onNavigate }) {
  const [form, setForm] = useState({ name: '', email: '', address: '', password: '' })
  const [error, setError] = useState('')
  const [details, setDetails] = useState({})
  const [busy, setBusy] = useState(false)

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
    setDetails((current) => ({ ...current, [field]: '' }))
  }

  async function submit(event) {
    event.preventDefault()
    setError('')
    const errors = {}
    if (form.name.trim().length < 20 || form.name.trim().length > 60) errors.name = 'Use 20 to 60 characters.'
    if (form.address.length > 400) errors.address = 'Use no more than 400 characters.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errors.email = 'Enter a valid email address.'
    if (!/^(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,16}$/.test(form.password)) errors.password = 'Use 8 to 16 characters, including an uppercase letter and a special character.'
    setDetails(errors)
    if (Object.keys(errors).length) return

    setBusy(true)
    try {
      const { user } = await api.auth.register(form)
      onRegistered(user)
    } catch (requestError) {
      setError(requestError.message)
      setDetails(requestError.details || {})
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="auth-layout">
      <section className="auth-panel auth-panel-wide">
        <a className="wordmark" href="/login" onClick={(event) => { event.preventDefault(); onNavigate('/login') }}><span className="brand-mark">R</span><span>roxillar<span className="wordmark-light"> / ratings</span></span></a>
        <div className="auth-content">
          <p className="eyebrow">A PLACE AT THE TABLE</p>
          <h1>Make your local<br />knowledge count.</h1>
          <p className="auth-intro">Create a community member account to explore stores and leave ratings.</p>
          {error && <p className="form-error" role="alert">{error}</p>}
          <form onSubmit={submit} className="form-stack">
            <label>Name <span className="field-hint">20-60 characters</span><input autoComplete="name" value={form.name} onChange={(event) => update('name', event.target.value)} required minLength={20} maxLength={60} />{details.name && <span className="field-error">{details.name}</span>}</label>
            <label>Email address<input type="email" autoComplete="email" value={form.email} onChange={(event) => update('email', event.target.value)} required />{details.email && <span className="field-error">{details.email}</span>}</label>
            <label>Address <span className="field-hint">Up to 400 characters</span><textarea autoComplete="street-address" rows="2" maxLength={400} value={form.address} onChange={(event) => update('address', event.target.value)} required />{details.address && <span className="field-error">{details.address}</span>}</label>
            <label>Password <span className="field-hint">8-16 characters, uppercase + special character</span><input type="password" autoComplete="new-password" value={form.password} onChange={(event) => update('password', event.target.value)} required />{details.password && <span className="field-error">{details.password}</span>}</label>
            <button className="button button-primary" type="submit" disabled={busy}>{busy ? <><span className="button-loader" />Creating account</> : 'Create account'}</button>
          </form>
          <p className="auth-footer">Already registered? <button type="button" className="text-button" onClick={() => onNavigate('/login')}>Sign in</button></p>
        </div>
        <p className="auth-legal">A clearer picture of every neighborhood.</p>
      </section>
      <aside className="auth-aside auth-aside-signup" aria-label="Community note"><div className="aside-number">02 <span>LOCAL KNOWLEDGE</span></div><div className="aside-copy"><span className="aside-mark">R.</span><h2>Better choices<br />start nearby.</h2><p>Discover places worth coming back to, one honest rating at a time.</p></div><div className="aside-bottom"><span>COMMUNITY FIRST</span><span>ALWAYS INDEPENDENT</span></div></aside>
    </main>
  )
}