const navigation = {
  admin: [['overview', 'Overview'], ['stores', 'Stores'], ['users', 'People']],
  user: [['stores', 'Find stores'], ['account', 'Account']],
  store_owner: [['overview', 'Rating overview'], ['account', 'Account']],
}

export default function Navbar({ user, activeView, onNavigate, onLogout }) {
  return (
    <header className="topbar">
      <a className="wordmark topbar-brand" href="/" onClick={(event) => event.preventDefault()}>
        <span className="brand-mark">R</span><span>roxillar<span className="wordmark-light"> / ratings</span></span>
      </a>
      <nav className="primary-nav" aria-label="Main navigation">
        {(navigation[user.role] || []).map(([view, label]) => (
          <button key={view} type="button" className={`nav-link ${activeView === view ? 'is-active' : ''}`} onClick={() => onNavigate(view)} aria-current={activeView === view ? 'page' : undefined}>{label}</button>
        ))}
      </nav>
      <div className="topbar-user">
        <span className="user-initial" aria-hidden="true">{user.name.trim().charAt(0).toUpperCase()}</span>
        <span className="user-summary"><strong>{user.name}</strong><small>{user.role.replace('_', ' ')}</small></span>
        <button type="button" className="button button-quiet logout-button" onClick={onLogout}>Sign out</button>
      </div>
    </header>
  )
}