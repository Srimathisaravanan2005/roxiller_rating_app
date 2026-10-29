import { useEffect, useState } from 'react'
import Navbar from '../components/Navbar.jsx'
import PasswordForm from '../components/PasswordForm.jsx'
import StoreCard from '../components/StoreCard.jsx'
import { api } from '../services/api.js'

export default function UserDashboard({ user, onLogout }) {
  const [activeView, setActiveView] = useState('stores')
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [direction, setDirection] = useState('asc')
  const [stores, setStores] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let active = true
    api.stores.list({ search, sortBy, direction })
      .then(({ stores: results }) => { if (active) { setStores(results); setError('') } })
      .catch((requestError) => { if (active) setError(requestError.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [search, sortBy, direction, refreshKey])

  async function saveRating(storeId, rating) {
    await api.ratings.save(storeId, rating)
    setLoading(true)
    setRefreshKey((key) => key + 1)
  }

  function updateSearch(value) {
    setLoading(true)
    setSearch(value)
  }

  function updateSort(field) {
    setLoading(true)
    setSortBy(field)
  }

  function updateDirection() {
    setLoading(true)
    setDirection((value) => value === 'asc' ? 'desc' : 'asc')
  }

  return (
    <div className="app-shell">
      <Navbar user={user} activeView={activeView} onNavigate={setActiveView} onLogout={onLogout} />
      {activeView === 'account' ? <main className="dashboard-main"><div className="page-heading"><div><p className="eyebrow">YOUR ACCOUNT</p><h1>Account settings</h1><p>Manage your sign-in details.</p></div></div><PasswordForm onSubmit={api.auth.changePassword} /></main> : (
        <main className="dashboard-main">
          <div className="page-heading"><div><p className="eyebrow">STORE DIRECTORY</p><h1>Find your next favorite.</h1><p>Explore local stores and ratings from the community.</p></div><span className="heading-count">{stores.length} STORES</span></div>
          <section className="directory-toolbar" aria-label="Store search and sorting">
            <label className="search-field"><span aria-hidden="true">⌕</span><input type="search" placeholder="Search by store or address" value={search} onChange={(event) => updateSearch(event.target.value)} /></label>
            <label className="sort-field">Sort by<select value={sortBy} onChange={(event) => updateSort(event.target.value)}><option value="name">Store name</option><option value="address">Address</option><option value="average_rating">Overall rating</option></select></label>
            <button type="button" className="button button-quiet sort-direction" onClick={updateDirection} aria-label={`Sort ${direction === 'asc' ? 'descending' : 'ascending'}`}>{direction === 'asc' ? 'A-Z ↑' : 'Z-A ↓'}</button>
          </section>
          {error && <p className="form-error" role="alert">{error}</p>}
          {loading ? <div className="loading-inline"><span className="loader" />Loading stores</div> : stores.length ? <section className="store-list" aria-label="Stores">{stores.map((store) => <StoreCard key={store.id} store={store} onRate={saveRating} />)}</section> : <div className="empty-state"><span className="empty-symbol">/</span><h2>No stores found</h2><p>Try a different store name or address.</p></div>}
          <p className="directory-note">Signed in as {user.email}</p>
        </main>
      )}
    </div>
  )
}