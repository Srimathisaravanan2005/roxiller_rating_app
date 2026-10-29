import { useState } from 'react'

export default function RatingForm({ initialRating, onSubmit, disabled = false }) {
  const [rating, setRating] = useState(initialRating || '')

  return (
    <form className="rating-form" onSubmit={(event) => { event.preventDefault(); if (rating) onSubmit(Number(rating)) }}>
      <label className="rating-label">Your rating
        <select aria-label="Your rating from 1 to 5" value={rating} onChange={(event) => setRating(event.target.value)} required disabled={disabled}>
          <option value="" disabled>Choose 1-5</option>
          {[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} {value === 1 ? 'point' : 'points'}</option>)}
        </select>
      </label>
      <button type="submit" className="button button-small button-secondary" disabled={disabled || !rating}>{disabled ? 'Saving' : initialRating ? 'Update' : 'Rate store'}</button>
    </form>
  )
}