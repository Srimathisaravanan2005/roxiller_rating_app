import { useEffect, useState } from 'react'
import AdminDashboard from './pages/AdminDashboard.jsx'
import Login from './pages/Login.jsx'
import OwnerDashboard from './pages/OwnerDashboard.jsx'
import Signup from './pages/Signup.jsx'
import UserDashboard from './pages/UserDashboard.jsx'
import { api } from './services/api.js'
import './App.css'

function dashboardPath(role) {
  return role === 'admin' ? '/admin' : role === 'store_owner' ? '/owner' : '/user'
}

function App() {
  const [path, setPath] = useState(window.location.pathname)
  const [user, setUser] = useState(null)
  const [checkingSession, setCheckingSession] = useState(true)
  const [notice, setNotice] = useState('')

  function navigate(nextPath, message = '') {
    if (window.location.pathname !== nextPath) window.history.pushState({}, '', nextPath)
    setPath(nextPath)
    setNotice(message)
  }

  useEffect(() => {
    const handlePopState = () => setPath(window.location.pathname)
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  useEffect(() => {
    let active = true
    api.auth.me()
      .then(({ user: sessionUser }) => {
        if (!active) return
        setUser(sessionUser)
        if (window.location.pathname === '/' || window.location.pathname === '/login' || window.location.pathname === '/signup') {
          navigate(dashboardPath(sessionUser.role))
        }
      })
      .catch(() => {
        if (active) setUser(null)
      })
      .finally(() => {
        if (active) setCheckingSession(false)
      })
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (checkingSession) return
    if (!user && !['/login', '/signup'].includes(path)) {
      window.history.replaceState({}, '', '/login')
    }
    if (user) {
      const expectedPath = dashboardPath(user.role)
      if (!path.startsWith(expectedPath)) window.history.replaceState({}, '', expectedPath)
    }
  }, [checkingSession, path, user])

  async function handleLogout() {
    try { await api.auth.logout() } finally {
      setUser(null)
      navigate('/login', 'You are signed out.')
    }
  }

  if (checkingSession) {
    return <main className="loading-screen"><span className="loader" />Loading your workspace</main>
  }

  if (!user && path === '/signup') {
    return <Signup onRegistered={setUser} onNavigate={navigate} notice={notice} />
  }
  if (!user) return <Login onLogin={setUser} onNavigate={navigate} notice={notice} />
  if (user.role === 'admin') return <AdminDashboard user={user} onLogout={handleLogout} />
  if (user.role === 'store_owner') return <OwnerDashboard user={user} onLogout={handleLogout} />
  return <UserDashboard user={user} onLogout={handleLogout} />
}

export default App
