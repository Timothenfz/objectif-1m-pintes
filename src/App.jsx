import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth.jsx'
import { LangProvider } from './hooks/useLang.jsx'
import { ThemeProvider } from './hooks/useTheme.jsx'
import { useState, useEffect } from 'react'
import AuthPage from './pages/AuthPage.jsx'
import FeedPage from './pages/FeedPage.jsx'
import PostPage from './pages/PostPage.jsx'
import ProfilePage from './pages/ProfilePage.jsx'
import CartePage from './pages/CartePage.jsx'
import BadgesPage from './pages/BadgesPage.jsx'
import ChatPage from './pages/ChatPage.jsx'
import AdminPage from './pages/AdminPage.jsx'
import InstallPage from './pages/InstallPage.jsx'
import CGUPage from './pages/CGUPage.jsx'
import StatsPage from './pages/StatsPage.jsx'
import ClansPage from './pages/ClansPage.jsx'
import PublicProfilePage from './pages/PublicProfilePage.jsx'
import Nav from './components/Nav.jsx'
import CGUPopup from './components/CGUPopup.jsx'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <Loader />
  if (!user) return <Navigate to="/auth" replace />
  return children
}

function Loader() {
  return (
    <div style={{ display:'flex',alignItems:'center',justifyContent:'center',height:'100dvh',background:'var(--bg)' }}>
      <div style={{ width:40,height:40,borderRadius:'50%',border:'2px solid var(--border)',borderTopColor:'var(--am)',animation:'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

function AppContent() {
  const { user } = useAuth()
  const [showCGU, setShowCGU] = useState(false)

  useEffect(() => {
    if (user && !localStorage.getItem('cgu_accepted')) setShowCGU(true)
  }, [user])

  function acceptCGU() {
    localStorage.setItem('cgu_accepted', '1')
    setShowCGU(false)
  }

  return (
    <>
      {showCGU && <CGUPopup onAccept={acceptCGU} />}
      <Routes>
        <Route path="/auth" element={user ? <Navigate to="/" replace /> : <AuthPage />} />
        <Route path="/" element={<ProtectedRoute><FeedPage /></ProtectedRoute>} />
        <Route path="/stats" element={<ProtectedRoute><StatsPage /></ProtectedRoute>} />
        <Route path="/clans" element={<ProtectedRoute><ClansPage /></ProtectedRoute>} />
        <Route path="/poster" element={<ProtectedRoute><PostPage /></ProtectedRoute>} />
        <Route path="/carte" element={<ProtectedRoute><CartePage /></ProtectedRoute>} />
        <Route path="/badges" element={<ProtectedRoute><BadgesPage /></ProtectedRoute>} />
        <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
        <Route path="/installer" element={<ProtectedRoute><InstallPage /></ProtectedRoute>} />
        <Route path="/cgu" element={<ProtectedRoute><CGUPage /></ProtectedRoute>} />
        <Route path="/profil" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/u/:userId" element={<ProtectedRoute><PublicProfilePage /></ProtectedRoute>} />
        <Route path="/classement" element={<Navigate to="/stats" replace />} />
      </Routes>
      {user && !showCGU && <Nav />}
    </>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <LangProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </LangProvider>
    </ThemeProvider>
  )
}
