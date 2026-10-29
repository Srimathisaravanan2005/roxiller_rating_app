import { useState } from 'react'
import RatingForm from './RatingForm.jsx'

export default function StoreCard({ store, onRate }) {
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const average = store.average_rating == null ? 'Not rated yet' : `${Number(store.average_rating).toFixed(1)} / 5`

  async function submit(rating) {
    setBusy(true)
    setMessage('')
    try {
      await onRate(store.id, rating)
      setMessage('Rating saved.')
    } catch (error) {
      setMessage(error.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <article className="store-row">
      <div className="store-monogram" aria-hidden="true">{store.name.charAt(0).toUpperCase()}</div>
      <div className="store-details"><h3>{store.name}</h3><p>{store.address}</p><small>{store.email}</small></div>
      <div className="store-rating"><span className="eyebrow">OVERALL RATING</span><strong>{average}</strong><small>{Number(store.rating_count || 0)} {Number(store.rating_count) === 1 ? 'rating' : 'ratings'}</small></div>
      <div className="store-your-rating"><span className="eyebrow">YOUR RATING</span><strong>{store.user_rating ? `${store.user_rating} / 5` : 'Not rated'}</strong></div>
      <div className="store-action"><RatingForm initialRating={store.user_rating} onSubmit={submit} disabled={busy} />{message && <small className={message === 'Rating saved.' ? 'success-text' : 'field-error'} role="status">{message}</small>}</div>
    </article>
  )
}