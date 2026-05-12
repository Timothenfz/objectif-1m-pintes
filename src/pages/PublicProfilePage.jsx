import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth.jsx'
import { BADGES, RARITY_COLORS } from '../lib/badges.js'
import Avatar from '../components/Avatar.jsx'

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return "à l'instant"
  if (m < 60) return `il y a ${m}min`
  const h = Math.floor(m / 60)
  if (h < 24) return `il y a ${h}h`
  return `il y a ${Math.floor(h / 24)}j`
}

export default function PublicProfilePage() {
  const { userId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [profile, setProfile] = useState(null)
  const [pintes, setPintes] = useState([])
  const [badges, setBadges] = useState([])
  const [rankAllTime, setRankAllTime] = useState(null)
  const [rankWeek, setRankWeek] = useState(null)
  const [pintesWeek, setPintesWeek] = useState(0)
  const [loading, setLoading] = useState(true)
  const [zoomedImage, setZoomedImage] = useState(null)

  useEffect(() => {
    if (userId) fetchAll()
  }, [userId])

  async function fetchAll() {
    setLoading(true)

    // Profil
    const { data: prof } = await supabase
      .from('profiles')
      .select('id, username, avatar_url, ville, total_perso, date_arrivee')
      .eq('id', userId)
      .single()

    if (!prof) { navigate('/'); return }
    setProfile(prof)

    // Dernières pintes
    const { data: pintesData } = await supabase
      .from('pintes')
      .select('id, numero_global, photo_url, lieu, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(9)
    setPintes(pintesData || [])

    // Badges débloqués
    const { data: badgesData } = await supabase
      .from('badges_utilisateur')
      .select('badge_id')
      .eq('user_id', userId)
    setBadges(new Set((badgesData || []).map(b => b.badge_id)))

    // Rang all-time
    const { data: allProfiles } = await supabase
      .from('profiles')
      .select('id')
      .order('total_perso', { ascending: false })
    const rank = (allProfiles || []).findIndex(p => p.id === userId)
    setRankAllTime(rank >= 0 ? rank + 1 : null)

    // Pintes cette semaine
    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    weekStart.setHours(0, 0, 0, 0)

    const { count: weekCount } = await supabase
      .from('pintes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', weekStart.toISOString())
    setPintesWeek(weekCount || 0)

    // Rang cette semaine
    const { data: weekData } = await supabase
      .from('pintes')
      .select('user_id')
      .gte('created_at', weekStart.toISOString())
      .not('user_id', 'is', null)

    const weekCounts = {}
    for (const p of (weekData || [])) {
      weekCounts[p.user_id] = (weekCounts[p.user_id] || 0) + 1
    }
    const weekRanked = Object.entries(weekCounts).sort((a, b) => b[1] - a[1])
    const weekRank = weekRanked.findIndex(([id]) => id === userId)
    setRankWeek(weekRank >= 0 ? weekRank + 1 : null)

    setLoading(false)
  }

  const isMe = user?.id === userId
  const unlockedBadges = BADGES.filter(b => badges.has(b.id))

  if (loading) return (
    <div style={{ height: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', border: '2px solid var(--border)', borderTopColor: 'var(--am)', animation: 'spin .8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  if (!profile) return null

  return (
    <div style={{ minHeight: '100dvh', paddingBottom: 100, background: 'var(--bg)' }}>

      {/* Zoom image */}
      {zoomedImage && (
        <div onClick={() => setZoomedImage(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <img src={zoomedImage} alt="" style={{ maxWidth: '100%', maxHeight: '90dvh', borderRadius: 12, objectFit: 'contain' }} />
          <button onClick={() => setZoomedImage(null)} style={{ position: 'absolute', top: 16, right: 16, width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer' }}>✕</button>
        </div>
      )}

      {/* Header */}
      <div style={{ padding: '52px 16px 16px', borderBottom: '1px solid var(--border)' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'var(--tx2)', fontSize: 13, cursor: 'pointer', marginBottom: 16, padding: 0 }}>
          ‹ Retour
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Avatar username={profile.username} avatarUrl={profile.avatar_url} size={64} border />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'Bebas Neue,sans-serif', fontSize: 28, color: 'var(--tx)', lineHeight: 1 }}>
              {profile.username}
            </div>
            {profile.ville && (
              <div style={{ fontSize: 12, color: 'var(--tx2)', marginTop: 3 }}>📍 {profile.ville}</div>
            )}
            {profile.date_arrivee && (
              <div style={{ fontSize: 11, color: 'var(--tx2)', marginTop: 2 }}>
                Membre depuis {new Date(profile.date_arrivee).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
              </div>
            )}
          </div>
          {isMe && (
            <button onClick={() => navigate('/profil')} style={{ padding: '8px 14px', borderRadius: 10, background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--tx2)', fontSize: 12, cursor: 'pointer' }}>
              Modifier
            </button>
          )}
        </div>
      </div>

      <div style={{ padding: '14px 14px 0', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 14, padding: '14px 10px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'Bebas Neue,sans-serif', fontSize: 28, color: 'var(--am)', lineHeight: 1 }}>{profile.total_perso || 0}</div>
            <div style={{ fontSize: 10, color: 'var(--tx2)', marginTop: 3 }}>pintes total</div>
          </div>
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 14, padding: '14px 10px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'Bebas Neue,sans-serif', fontSize: 28, color: 'var(--am)', lineHeight: 1 }}>
              {rankAllTime ? `#${rankAllTime}` : '—'}
            </div>
            <div style={{ fontSize: 10, color: 'var(--tx2)', marginTop: 3 }}>rang all time</div>
          </div>
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 14, padding: '14px 10px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'Bebas Neue,sans-serif', fontSize: 28, color: 'var(--am)', lineHeight: 1 }}>
              {rankWeek ? `#${rankWeek}` : '—'}
            </div>
            <div style={{ fontSize: 10, color: 'var(--tx2)', marginTop: 3 }}>rang semaine</div>
          </div>
        </div>

        {/* Pintes cette semaine */}
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 14, padding: '14px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 32 }}>📅</div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--tx2)' }}>Cette semaine</div>
            <div style={{ fontFamily: 'Bebas Neue,sans-serif', fontSize: 22, color: 'var(--am)', lineHeight: 1 }}>
              {pintesWeek} pinte{pintesWeek > 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {/* Badges débloqués */}
        {unlockedBadges.length > 0 && (
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 14, padding: '14px' }}>
            <div style={{ fontFamily: 'Bebas Neue,sans-serif', fontSize: 16, color: 'var(--tx)', marginBottom: 10 }}>
              🎖 BADGES ({unlockedBadges.length})
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {unlockedBadges.map(badge => {
                const colors = RARITY_COLORS[badge.rarity]
                return (
                  <div key={badge.id} title={badge.name_fr} style={{
                    background: colors.bg, border: `1px solid ${colors.border}`,
                    borderRadius: 10, padding: '6px 10px',
                    display: 'flex', alignItems: 'center', gap: 5,
                  }}>
                    <span style={{ fontSize: 16 }}>{badge.icon}</span>
                    <span style={{ fontSize: 11, color: colors.text, fontWeight: 500 }}>{badge.name_fr}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Dernières pintes */}
        {pintes.length > 0 && (
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 14, padding: '14px' }}>
            <div style={{ fontFamily: 'Bebas Neue,sans-serif', fontSize: 16, color: 'var(--tx)', marginBottom: 10 }}>
              🍺 DERNIÈRES PINTES
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
              {pintes.map(p => (
                <div key={p.id} style={{ position: 'relative', aspectRatio: '1', borderRadius: 10, overflow: 'hidden', background: 'var(--bg3)', cursor: p.photo_url ? 'zoom-in' : 'default' }}
                  onClick={() => p.photo_url && setZoomedImage(p.photo_url)}>
                  {p.photo_url ? (
                    <img src={p.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>🍺</div>
                  )}
                  <div style={{ position: 'absolute', bottom: 4, left: 4, background: 'rgba(0,0,0,0.6)', borderRadius: 6, padding: '2px 5px', fontSize: 9, color: '#fff', fontFamily: 'Bebas Neue,sans-serif' }}>
                    #{p.numero_global}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {pintes.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--tx2)' }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>🍺</div>
            <div style={{ fontSize: 13 }}>Aucune pinte postée pour l'instant</div>
          </div>
        )}
      </div>
    </div>
  )
}
