import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.jsx'

export default function ProfileAvatar() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const hue = (profile?.username?.charCodeAt(0) || 0) * 15 % 360

  return (
    <button
      onClick={() => navigate('/profil')}
      style={{
        width: 34, height: 34, borderRadius: '50%',
        overflow: 'hidden', border: `2px solid #f5a623`,
        background: `hsl(${hue},40%,16%)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', flexShrink: 0, padding: 0,
        boxShadow: '0 2px 8px rgba(245,166,35,0.3)',
      }}
    >
      {profile?.avatar_url ? (
        <img src={profile.avatar_url} alt={profile.username}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <span style={{ fontSize: 13, fontWeight: 500, color: `hsl(${hue},80%,70%)` }}>
          {(profile?.username || '?')[0].toUpperCase()}
        </span>
      )}
    </button>
  )
}
