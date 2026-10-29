import { useEffect, useState } from 'react'
import Navbar from '../components/Navbar.jsx'
import { api } from '../services/api.js'

const emptyStore = { name: '', email: '', address: '', ownerId: '' }
const emptyUser = { name: '', email: '', address: '', password: '', role: 'user' }

function SortButton({ field, label, sortBy, direction, onSort }) {
  return <button type="button" className="table-sort" onClick={() => onSort(field)}>{label}{sortBy === field ? (direction === 'asc' ? ' ↑' : ' ↓') : ''}</button>
}

export default function AdminDashboard({ user, onLogout }) {
  const [activeView, setActiveView] = useState('overview')
  const [stats, setStats] = useState(null)
  const [stores, setStores] = useState([])
  const [users, setUsers] = useState([])
  const [owners, setOwners] = useState([])
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [direction, setDirection] = useState('asc')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const [storeForm, setStoreForm] = useState(emptyStore)
  const [userForm, setUserForm] = useState(emptyUser)
  const [selectedUser, setSelectedUser] = useState(null)

  useEffect(() => {
    api.admin.stats().then(({ statistics }) => setStats(statistics)).catch((requestError) => setError(requestError.message))
    api.admin.users({ role: 'store_owner' }).then(({ users: results }) => setOwners(results)).catch((requestError) => setError(requestError.message))
  }, [refreshKey])

  useEffect(() => {
    if (!['stores', 'users'].includes(activeView)) return undefined
    let active = true
    const params = { search, sortBy, direction }
    const load = activeView === 'stores'
      ? api.admin.stores(params).then(({ stores: results }) => { if (active) setStores(results) })
      : api.admin.users({ ...params, role: roleFilter }).then(({ users: results }) => { if (active) setUsers(results) })
    load.catch((requestError) => { if (active) setError(requestError.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [activeView, search, roleFilter, sortBy, direction, refreshKey])

  function changeView(view) {
    setActiveView(view)
    setLoading(view === 'stores' || view === 'users')
    setSearch('')
    setError('')
    setMessage('')
    setSortBy('name')
    setDirection('asc')
  }

  function toggleSort(field) {
    setLoading(true)
    if (sortBy === field) setDirection((value) => value === 'asc' ? 'desc' : 'asc')
    else { setSortBy(field); setDirection('asc') }
  }

  async function submitStore(event) {
    event.preventDefault()
    setError('')
    setMessage('')
    try {
      await api.admin.createStore(storeForm)
      setStoreForm(emptyStore)
      setMessage('Store created.')
      setRefreshKey((key) => key + 1)
    } catch (requestError) { setError(requestError.message) }
  }

  async function submitUser(event) {
    event.preventDefault()
    setError('')
    setMessage('')
    const errors = {}
    if (userForm.name.trim().length < 20 || userForm.name.trim().length > 60) errors.name = 'Name must be between 20 and 60 characters.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userForm.email.trim())) errors.email = 'Enter a valid email address.'
    if (!userForm.address.trim() || userForm.address.length > 400) errors.address = 'Address is required and must be 400 characters or fewer.'
    if (!/^(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,16}$/.test(userForm.password)) errors.password = 'Use 8 to 16 characters, including an uppercase letter and a special character.'
    if (Object.keys(errors).length) {
      setError(Object.values(errors).join(' '))
      return
    }
    try {
      await api.admin.createUser(userForm)
      setUserForm(emptyUser)
      setMessage('User created.')
      setRefreshKey((key) => key + 1)
    } catch (requestError) { setError(requestError.message) }
  }

  async function openUser(userId) {
    setError('')
    try { setSelectedUser(await api.admin.user(userId)) }
    catch (requestError) { setError(requestError.message) }
  }

  return (
    <div className="app-shell">
      <Navbar user={user} activeView={activeView} onNavigate={changeView} onLogout={onLogout} />
      <main className="dashboard-main">
        {activeView === 'overview' && <>
          <div className="page-heading"><div><p className="eyebrow">ADMINISTRATION</p><h1>Platform overview.</h1><p>A live view of your store rating community.</p></div><span className="admin-date">ROXILLAR / CONTROL</span></div>
          {error && <p className="form-error" role="alert">{error}</p>}
          <section className="stats-grid" aria-label="Platform statistics">
            <article className="stat-panel stat-highlight"><span className="eyebrow">REGISTERED USERS</span><strong>{stats?.total_users ?? '--'}</strong><span>Across every role</span></article>
            <article className="stat-panel"><span className="eyebrow">REGISTERED STORES</span><strong>{stats?.total_stores ?? '--'}</strong><span>Local businesses</span></article>
            <article className="stat-panel"><span className="eyebrow">SUBMITTED RATINGS</span><strong>{stats?.total_ratings ?? '--'}</strong><span>Community feedback</span></article>
          </section>
          <section className="admin-welcome"><div><p className="eyebrow">WORKSPACE</p><h2>Keep the directory useful.</h2><p>Register new businesses, add platform accounts, and review community activity from one place.</p></div><div className="welcome-actions"><button className="button button-primary" onClick={() => changeView('stores')}>Manage stores <span aria-hidden="true">↗</span></button><button className="button button-secondary" onClick={() => changeView('users')}>Manage people</button></div></section>
        </>}

        {activeView === 'stores' && <>
          <div className="page-heading"><div><p className="eyebrow">DIRECTORY MANAGEMENT</p><h1>Stores</h1><p>Create, search, and review registered businesses.</p></div></div>
          {message && <p className="notice" role="status">{message}</p>}{error && <p className="form-error" role="alert">{error}</p>}
          <section className="directory-toolbar admin-toolbar"><label className="search-field"><span aria-hidden="true">⌕</span><input type="search" placeholder="Filter by store, email, or address" value={search} onChange={(event) => setSearch(event.target.value)} /></label><span className="heading-count">{stores.length} STORES</span></section>
          {loading ? <div className="loading-inline"><span className="loader" />Loading stores</div> : stores.length ? <div className="table-wrap"><table><thead><tr><th><SortButton field="name" label="Store" sortBy={sortBy} direction={direction} onSort={toggleSort} /></th><th><SortButton field="email" label="Email" sortBy={sortBy} direction={direction} onSort={toggleSort} /></th><th><SortButton field="address" label="Address" sortBy={sortBy} direction={direction} onSort={toggleSort} /></th><th>Owner</th><th><SortButton field="average_rating" label="Rating" sortBy={sortBy} direction={direction} onSort={toggleSort} /></th></tr></thead><tbody>{stores.map((store) => <tr key={store.id}><td className="table-primary">{store.name}</td><td>{store.email}</td><td>{store.address}</td><td>{store.owner_name || 'Unassigned'}</td><td>{store.average_rating == null ? 'Not rated yet' : `${Number(store.average_rating).toFixed(1)} / 5`}</td></tr>)}</tbody></table></div> : <div className="empty-state compact-empty"><h2>No stores to show</h2><p>Add a store or adjust your search.</p></div>}
          <section className="admin-form-section"><div className="section-heading"><div><p className="eyebrow">NEW LISTING</p><h2>Add a store</h2></div></div><form className="admin-form-grid" onSubmit={submitStore}><label>Store name<input value={storeForm.name} onChange={(event) => setStoreForm({ ...storeForm, name: event.target.value })} maxLength={120} required /></label><label>Store email<input type="email" value={storeForm.email} onChange={(event) => setStoreForm({ ...storeForm, email: event.target.value })} required /></label><label>Store owner<select value={storeForm.ownerId} onChange={(event) => setStoreForm({ ...storeForm, ownerId: event.target.value })}><option value="">No owner assigned</option>{owners.map((owner) => <option value={owner.id} key={owner.id}>{owner.name} ({owner.email})</option>)}</select></label><label className="form-span-two">Address<textarea value={storeForm.address} onChange={(event) => setStoreForm({ ...storeForm, address: event.target.value })} maxLength={400} rows="2" required /></label><div><button className="button button-primary" type="submit">Create store</button></div></form></section>
        </>}

        {activeView === 'users' && <>
          <div className="page-heading"><div><p className="eyebrow">PEOPLE & PERMISSIONS</p><h1>Users</h1><p>Review accounts and create role-specific access.</p></div></div>
          {message && <p className="notice" role="status">{message}</p>}{error && <p className="form-error" role="alert">{error}</p>}
          <section className="directory-toolbar admin-toolbar"><label className="search-field"><span aria-hidden="true">⌕</span><input type="search" placeholder="Filter by name, email, or address" value={search} onChange={(event) => setSearch(event.target.value)} /></label><label className="sort-field">Role<select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}><option value="">All roles</option><option value="admin">Administrator</option><option value="user">Normal user</option><option value="store_owner">Store owner</option></select></label><span className="heading-count">{users.length} PEOPLE</span></section>
          {loading ? <div className="loading-inline"><span className="loader" />Loading users</div> : users.length ? <div className="table-wrap"><table><thead><tr><th><SortButton field="name" label="Name" sortBy={sortBy} direction={direction} onSort={toggleSort} /></th><th><SortButton field="email" label="Email" sortBy={sortBy} direction={direction} onSort={toggleSort} /></th><th><SortButton field="address" label="Address" sortBy={sortBy} direction={direction} onSort={toggleSort} /></th><th><SortButton field="role" label="Role" sortBy={sortBy} direction={direction} onSort={toggleSort} /></th><th /></tr></thead><tbody>{users.map((listedUser) => <tr key={listedUser.id}><td className="table-primary">{listedUser.name}</td><td>{listedUser.email}</td><td>{listedUser.address}</td><td><span className="role-tag">{listedUser.role.replace('_', ' ')}</span></td><td><button className="table-action" type="button" onClick={() => openUser(listedUser.id)}>View details</button></td></tr>)}</tbody></table></div> : <div className="empty-state compact-empty"><h2>No users to show</h2><p>Adjust your search or role filter.</p></div>}
          <section className="admin-form-section"><div className="section-heading"><div><p className="eyebrow">NEW ACCOUNT</p><h2>Add a user</h2></div></div><form className="admin-form-grid" onSubmit={submitUser}><label>Name <span className="field-hint">20-60 characters</span><input value={userForm.name} onChange={(event) => setUserForm({ ...userForm, name: event.target.value })} minLength={20} maxLength={60} required /></label><label>Email<input type="email" value={userForm.email} onChange={(event) => setUserForm({ ...userForm, email: event.target.value })} required /></label><label>Password <span className="field-hint">8-16 characters, uppercase + special</span><input type="password" value={userForm.password} onChange={(event) => setUserForm({ ...userForm, password: event.target.value })} required /></label><label>Role<select value={userForm.role} onChange={(event) => setUserForm({ ...userForm, role: event.target.value })}><option value="user">Normal user</option><option value="admin">Administrator</option><option value="store_owner">Store owner</option></select></label><label className="form-span-two">Address<textarea value={userForm.address} onChange={(event) => setUserForm({ ...userForm, address: event.target.value })} maxLength={400} rows="2" required /></label><div><button className="button button-primary" type="submit">Create account</button></div></form></section>
        </>}
      </main>
      {selectedUser && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedUser(null) }}><section className="detail-modal" role="dialog" aria-modal="true" aria-labelledby="detail-title"><button className="modal-close" type="button" onClick={() => setSelectedUser(null)} aria-label="Close details">×</button><p className="eyebrow">USER DETAILS</p><h2 id="detail-title">{selectedUser.user.name}</h2><dl className="detail-list"><div><dt>Email</dt><dd>{selectedUser.user.email}</dd></div><div><dt>Address</dt><dd>{selectedUser.user.address}</dd></div><div><dt>Role</dt><dd>{selectedUser.user.role.replace('_', ' ')}</dd></div></dl>{selectedUser.stores.length > 0 && <section className="owner-detail"><p className="eyebrow">OWNER STORES</p>{selectedUser.stores.map((store) => <div className="owner-detail-row" key={store.id}><strong>{store.name}</strong><span>{store.average_rating == null ? 'Not rated yet' : `${Number(store.average_rating).toFixed(1)} / 5`}</span></div>)}</section>}</section></div>}
    </div>
  )
}