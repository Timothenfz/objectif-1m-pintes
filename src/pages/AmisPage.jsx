import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth.jsx'
import Avatar from '../components/Avatar.jsx'

function timeAgo(d) {
  const diff = Date.now() - new Date(d).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return "à l'instant"
  if (m < 60) return `${m}min`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}j`
}

export default function AmisPage() {
  const { user, profile } = useAuth()
  const [tab, setTab] = useState('feed')
  const [feedAmis, setFeedAmis] = useState([])
  const [amis, setAmis] = useState([])
  const [membres, setMembres] = useState([])
  const [followingIds, setFollowingIds] = useState(new Set())
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    const [{ data: followingData }, { data: membresData }] = await Promise.all([
      supabase.from('amis').select('following_id').eq('follower_id', user.id),
      supabase.from('profiles').select('id, username, avatar_url, total_perso, ville, derniere_activite').order('username'),
    ])

    const ids = new Set((followingData || []).map(f => f.following_id))
    setFollowingIds(ids)
    setMembres(membresData || [])

    // Feed des amis
    if (ids.size > 0) {
      const { data: pintesAmis } = await supabase
        .from('pintes')
        .select('*, profiles(username, avatar_url)')
        .in('user_id', [...ids])
        .order('created_at', { ascending: false })
        .limit(30)
      setFeedAmis(pintesAmis || [])
    }

    // Liste amis
    const { data: amisData } = await supabase
      .from('profiles').select('id, username, avatar_url, total_perso, ville')
      .in('id', ids.size > 0 ? [...ids] : ['00000000-0000-0000-0000-000000000000'])
    setAmis(amisData || [])
    setLoading(false)
  }

  async function toggleFollow(targetId) {
    if (followingIds.has(targetId)) {
      await supabase.from('amis').delete().eq('follower_id', user.id).eq('following_id', targetId)
      setFollowingIds(prev => { const n = new Set(prev); n.delete(targetId); return n })
      setAmis(prev => prev.filter(a => a.id !== targetId))
    } else {
      await supabase.from('amis').insert({ follower_id: user.id, following_id: targetId })
      setFollowingIds(prev => new Set([...prev, targetId]))
      const ami = membres.find(m => m.id === targetId)
      if (ami) setAmis(prev => [...prev, ami])
    }
  }

  const filteredMembres = membres.filter(m =>
    m.id !== user.id && m.username?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ minHeight: '100dvh', paddingBottom: 100, background: 'var(--bg)' }}>
      <div style={{ padding: '52px 16px 14px' }}>
        <div style={{ fontFamily: 'Bebas Neue,sans-serif', fontSize: 32, color: 'var(--tx)' }}>AMIS</div>
        <div style={{ fontSize: 11, color: 'var(--tx2)', marginTop: 2 }}>
          {followingIds.size} ami{followingIds.size > 1 ? 's' : ''} suivi{followingIds.size > 1 ? 's' : ''}
        </div>
      </div>

      {/* Onglets */}
      <div style={{ display: 'flex', gap: 6, padding: '0 14px 12px', background: 'var(--bg3)', margin: '0 14px 14px', borderRadius: 10 }}>
        {[['feed', '🍺 Feed amis'], ['amis', '👥 Mes amis'], ['decouvrir', '🔍 Découvrir']].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{
            flex: 1, padding: '8px 4px', borderRadius: 8, border: 'none',
            background: tab === id ? 'var(--am)' : 'transparent',
            color: tab === id ? '#0d0d0d' : 'var(--tx2)',
            fontSize: 11, fontWeight: tab === id ? 500 : 400,
            cursor: 'pointer', fontFamily: 'DM Sans,sans-serif',
          }}>{label}</button>
        ))}
      </div>

      {/* FEED AMIS */}
      {tab === 'feed' && (
        <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {followingIds.size === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--tx2)' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>👥</div>
              <div style={{ fontSize: 14, color: 'var(--tx)' }}>Suis des amis pour voir leur feed !</div>
              <div style={{ fontSize: 12, marginTop: 6 }}>Va dans "Découvrir" pour trouver des membres</div>
            </div>
          ) : feedAmis.map(p => (
            <div key={p.id} style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px' }}>
                <Avatar username={p.profiles?.username} avatarUrl={p.profiles?.avatar_url} size={36} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--tx)' }}>{p.profiles?.username}</div>
                  <div style={{ fontSize: 11, color: 'var(--tx2)' }}>{p.lieu || 'Lieu inconnu'} · {timeAgo(p.created_at)}</div>
                </div>
                <div style={{ background: 'var(--am)', color: '#0d0d0d', fontFamily: 'Bebas Neue,sans-serif', fontSize: 15, padding: '3px 9px', borderRadius: 20 }}>#{p.numero_global}</div>
              </div>
              <div style={{ aspectRatio: '4/3', background: 'var(--bg3)' }}>
                <img src={p.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MES AMIS */}
      {tab === 'amis' && (
        <div style={{ padding: '0 14px' }}>
          {amis.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--tx2)' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🤷</div>
              <div style={{ fontSize: 14 }}>Tu ne suis personne encore</div>
            </div>
          ) : (
            <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
              {amis.map((ami, i) => (
                <div key={ami.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderBottom: i < amis.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <Avatar username={ami.username} avatarUrl={ami.avatar_url} size={38} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--tx)' }}>{ami.username}</div>
                    <div style={{ fontSize: 11, color: 'var(--tx2)' }}>{ami.ville || '—'} · {ami.total_perso} pintes</div>
                  </div>
                  <button onClick={() => toggleFollow(ami.id)} style={{
                    padding: '6px 12px', borderRadius: 20, fontSize: 12,
                    background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                    color: '#f87171', cursor: 'pointer', fontFamily: 'DM Sans,sans-serif',
                  }}>Ne plus suivre</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* DÉCOUVRIR */}
      {tab === 'decouvrir' && (
        <div style={{ padding: '0 14px' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un membre..."
            style={{ width: '100%', padding: '9px 12px', background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--tx)', fontSize: 13, fontFamily: 'DM Sans,sans-serif', outline: 'none', marginBottom: 12 }} />
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
            {filteredMembres.map((m, i) => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderBottom: i < filteredMembres.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <Avatar username={m.username} avatarUrl={m.avatar_url} size={38} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--tx)' }}>{m.username}</div>
                  <div style={{ fontSize: 11, color: 'var(--tx2)' }}>{m.ville || '—'} · {m.total_perso} pintes</div>
                </div>
                <button onClick={() => toggleFollow(m.id)} style={{
                  padding: '6px 14px', borderRadius: 20, fontSize: 12,
                  background: followingIds.has(m.id) ? 'var(--bg3)' : 'var(--am)',
                  border: `1px solid ${followingIds.has(m.id) ? 'var(--border)' : 'var(--am)'}`,
                  color: followingIds.has(m.id) ? 'var(--tx2)' : '#0d0d0d',
                  cursor: 'pointer', fontFamily: 'DM Sans,sans-serif', fontWeight: 500,
                  transition: 'all .15s',
                }}>
                  {followingIds.has(m.id) ? 'Suivi ✓' : 'Suivre'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
