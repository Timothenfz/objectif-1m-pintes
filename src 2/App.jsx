import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth.jsx'
import { LangProvider } from './hooks/useLang.jsx'
import AuthPage from './pages/AuthPage.jsx'
import FeedPage from './pages/FeedPage.jsx'
import RankingPage from './pages/RankingPage.jsx'
import PostPage from './pages/PostPage.jsx'
import ProfilePage from './pages/ProfilePage.jsx'
import VillesPage from './pages/VillesPage.jsx'
import BadgesPage from './pages/BadgesPage.jsx'
import ChatPage from './pages/ChatPage.jsx'
import CartePage from './pages/CartePage.jsx'
import Nav from './components/Nav.jsx'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <Loader />
  if (!user) return <Navigate to="/auth" replace />
  return children
}

function Loader() {
  return (
    <div style={{ display:'flex',alignItems:'center',justifyContent:'center',height:'100dvh',background:'#0a0a0a' }}>
      <div style={{ width:40,height:40,borderRadius:'50%',border:'2px solid rgba(255,255,255,0.1)',borderTopColor:'#f5a623',animation:'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

function AppContent() {
  const { user } = useAuth()
  return (
    <>
      <Routes>
        <Route path="/auth" element={user ? <Navigate to="/" replace /> : <AuthPage />} />
        <Route path="/" element={<ProtectedRoute><FeedPage /></ProtectedRoute>} />
        <Route path="/classement" element={<ProtectedRoute><RankingPage /></ProtectedRoute>} />
        <Route path="/poster" element={<ProtectedRoute><PostPage /></ProtectedRoute>} />
        <Route path="/villes" element={<ProtectedRoute><VillesPage /></ProtectedRoute>} />
        <Route path="/carte" element={<ProtectedRoute><CartePage /></ProtectedRoute>} />
        <Route path="/badges" element={<ProtectedRoute><BadgesPage /></ProtectedRoute>} />
        <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
        <Route path="/profil" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      </Routes>
      {user && <Nav />}
    </>
  )
}

export default function App() {
  return (
    <LangProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </LangProvider>
  )
}
