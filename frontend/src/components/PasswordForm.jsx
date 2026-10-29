import { useState } from 'react'

export default function PasswordForm({ onSubmit }) {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setError('')
    setMessage('')
    if (!/^(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,16}$/.test(form.newPassword)) {
      setError('Use 8 to 16 characters, including an uppercase letter and a special character.')
      return
    }
    if (form.newPassword !== form.confirmPassword) {
      setError('The new passwords do not match.')
      return
    }
    setBusy(true)
    try {
      const result = await onSubmit({ currentPassword: form.currentPassword, newPassword: form.newPassword })
      setMessage(result.message)
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="settings-panel">
      <div className="section-heading"><div><p className="eyebrow">SECURITY</p><h2>Change password</h2></div></div>
      <p className="muted-copy">Choose a new password you have not used here before.</p>
      {message && <p className="notice" role="status">{message}</p>}
      {error && <p className="form-error" role="alert">{error}</p>}
      <form className="form-stack compact-form" onSubmit={submit}>
        <label>Current password<input type="password" autoComplete="current-password" value={form.currentPassword} onChange={(event) => setForm({ ...form, currentPassword: event.target.value })} required /></label>
        <label>New password<input type="password" autoComplete="new-password" value={form.newPassword} onChange={(event) => setForm({ ...form, newPassword: event.target.value })} required /></label>
        <label>Confirm new password<input type="password" autoComplete="new-password" value={form.confirmPassword} onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })} required /></label>
        <button className="button button-primary" type="submit" disabled={busy}>{busy ? 'Updating' : 'Update password'}</button>
      </form>
    </section>
  )
}