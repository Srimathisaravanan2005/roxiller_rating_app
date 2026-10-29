import { useEffect, useState } from 'react'
import Navbar from '../components/Navbar.jsx'
import PasswordForm from '../components/PasswordForm.jsx'
import { api } from '../services/api.js'

export default function OwnerDashboard({ user, onLogout }) {
  const [activeView, setActiveView] = useState('overview')
  const [data, setData] = useState({ stores: [], ratings: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    api.ratings.ownerSummary()
      .then((result) => { if (active) setData(result) })
      .catch((requestError) => { if (active) setError(requestError.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  return (
    <div className="app-shell">
      <Navbar user={user} activeView={activeView} onNavigate={setActiveView} onLogout={onLogout} />
      {activeView === 'account' ? <main className="dashboard-main"><div className="page-heading"><div><p className="eyebrow">YOUR ACCOUNT</p><h1>Account settings</h1><p>Manage your sign-in details.</p></div></div><PasswordForm onSubmit={api.auth.changePassword} /></main> : (
        <main className="dashboard-main">
          <div className="page-heading"><div><p className="eyebrow">STORE OWNER</p><h1>Your store, in view.</h1><p>Ratings and feedback from your customers.</p></div></div>
          {error && <p className="form-error" role="alert">{error}</p>}
          {loading ? <div className="loading-inline"><span className="loader" />Loading ratings</div> : data.stores.length ? <>
            <section className="owner-store-grid">{data.stores.map((store) => <article className="owner-summary" key={store.id}><div className="summary-top"><span className="eyebrow">STORE RATING</span><span className="owner-store-dot" /></div><h2>{store.name}</h2><div className="owner-rating-number">{store.average_rating == null ? '--' : Number(store.average_rating).toFixed(1)}<span>/ 5</span></div><p>{store.average_rating == null ? 'No ratings have been submitted yet.' : `${store.rating_count} customer ${Number(store.rating_count) === 1 ? 'rating' : 'ratings'}`}</p></article>)}</section>
            <section className="data-section"><div className="section-heading"><div><p className="eyebrow">CUSTOMER FEEDBACK</p><h2>People who rated your store</h2></div><span className="heading-count">{data.ratings.length} RATINGS</span></div>
              {data.ratings.length ? <div className="table-wrap"><table><thead><tr><th>Customer</th><th>Email</th><th>Store</th><th>Rating</th><th>Updated</th></tr></thead><tbody>{data.ratings.map((rating, index) => <tr key={`${rating.store_id}-${rating.user_email}-${index}`}><td>{rating.user_name}</td><td>{rating.user_email}</td><td>{rating.store_name}</td><td><span className="rating-pill">{rating.rating} / 5</span></td><td>{new Date(rating.updated_at).toLocaleDateString()}</td></tr>)}</tbody></table></div> : <div className="empty-state compact-empty"><h2>No ratings yet</h2><p>Customer ratings will appear here.</p></div>}
            </section>
          </> : <div className="empty-state"><span className="empty-symbol">R</span><h2>No store is linked to your account</h2><p>Ask an administrator to associate a store with this account.</p></div>}
        </main>
      )}
    </div>
  )
}