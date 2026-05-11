import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth.jsx'
import Avatar from '../components/Avatar.jsx'

const MEDALS = ['🥇', '🥈', '🥉']

const PERIODS = [
  { id: 'alltime', label: 'All Time' },
  { id: 'month',   label: 'Ce mois' },
  { id: 'week',    label: 'Semaine' },
  { id: 'today',   label: "Aujourd'hui" },
]

function getDateFilter(period) {
  const now = new Date()
  if (period === 'today') {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    return start.toISOString()
  }
  if (period === 'week') {
    const start = new Date(now)
    start.setDate(now.getDate() - now.getDay())
    start.setHours(0,0,0,0)
    return start.toISOString()
  }
  if (period === 'month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    return start.toISOString()
  }
  return null
}

function Row({ profile, rank, isMe, value, period }) {
  const daysInactive = profile.derniere_activite
    ? Math.floor((Date.now() - new Date(profile.derniere_activite).getTime()) / 86400000)
    : 999
  const inactive = daysInactive >= 30 && period === 'alltime'

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 14px',
      background: isMe ? 'rgba(245,166,35,0.06)' : 'transparent',
      borderBottom: '1px solid var(--border)',
      borderLeft: isMe ? '3px solid var(--am)' : '3px solid transparent',
    }}>
      <div style={{ width: 26, textAlign: 'center', flexShrink: 0, fontSize: rank < 3 ? 18 : 13, fontFamily: rank < 3 ? 'inherit' : 'Bebas Neue,sans-serif', color: 'var(--tx2)' }}>
        {rank < 3 ? MEDALS[rank] : rank + 1}
      </div>

      <Avatar
        username={profile.username}
        avatarUrl={profile.avatar_url}
        size={38}
        border
      />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--tx)', display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {profile.username}
          {isMe && <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 20, background: 'rgba(245,166,35,0.2)', color: 'var(--am)', flexShrink: 0 }}>toi</span>}
          {inactive && <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 20, background: 'rgba(239,68,68,0.15)', color: '#f87171', flexShrink: 0 }}>inactif</span>}
        </div>
        <div style={{ height: 3, background: 'var(--bg3)', borderRadius: 2, marginTop: 5 }}>
          <div style={{ height: 3, borderRadius: 2, background: 'var(--am)', width: `${Math.round((value / Math.max(value, 1)) * 100)}%` }} />
        </div>
        <div style={{ fontSize: 10, color: 'var(--tx2)', marginTop: 2 }}>
          {period === 'alltime'
            ? `depuis ${Math.floor((Date.now() - new Date(profile.date_arrivee || Date.now()).getTime()) / 86400000)}j`
            : profile.derniere_activite ? new Date(profile.derniere_activite).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : '—'
          }
        </div>
      </div>

      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontFamily: 'Bebas Neue,sans-serif', fontSize: 22, color: rank === 0 ? 'var(--am)' : 'var(--tx)', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 9, color: 'var(--tx2)' }}>pintes</div>
      </div>
    </div>
  )
}

import ProfileAvatar from '../components/ProfileAvatar.jsx'

export default function RankingPage() {
  const [period, setPeriod] = useState('alltime')
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const { profile: me } = useAuth()

  useEffect(() => { fetchRanking() }, [period])

  async function fetchRanking() {
    setLoading(true)
    const dateFilter = getDateFilter(period)

    if (period === 'alltime') {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .gt('total_perso', 0)
        .order('total_perso', { ascending: false })
      setProfiles(data || [])
    } else {
      // Pour les périodes filtrées, on compte les pintes depuis la date
      const { data: pintesData } = await supabase
        .from('pintes')
        .select('user_id, profiles(id, username, avatar_url, date_arrivee, derniere_activite)')
        .not('user_id', 'is', null)
        .gte('created_at', dateFilter)

      // Compter par user
      const counts = {}
      const profileMap = {}
      ;(pintesData || []).forEach(p => {
        const uid = p.user_id
        counts[uid] = (counts[uid] || 0) + 1
        if (p.profiles) profileMap[uid] = p.profiles
      })

      const ranked = Object.entries(counts)
        .map(([uid, cnt]) => ({ ...profileMap[uid], _count: cnt }))
        .sort((a, b) => b._count - a._count)

      setProfiles(ranked)
    }
    setLoading(false)
  }

  function getValue(p) {
    return period === 'alltime' ? p.total_perso : p._count
  }

  const filtered = profiles.filter(p => p.username?.toLowerCase().includes(search.toLowerCase()))
  const totalPintes = profiles.reduce((s, p) => s + getValue(p), 0)
  const myRank = filtered.findIndex(p => p.id === me?.id)
  const maxVal = filtered.length ? getValue(filtered[0]) : 1

  return (
    <div style={{ minHeight: '100dvh', paddingBottom: 90, background: 'var(--bg)' }}>
      {/* Header */}
      <div style={{ padding: '52px 16px 14px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
          <div style={{ fontFamily: 'Bebas Neue,sans-serif', fontSize: 32, color: 'var(--tx)' }}>CLASSEMENT</div>
          <ProfileAvatar />
        </div>
        <div style={{ fontSize: 11, color: 'var(--tx2)', marginTop: 2 }}>
          {profiles.length} membre{profiles.length > 1 ? 's' : ''} · {totalPintes.toLocaleString('fr-FR')} pintes
          {myRank >= 0 && ` · tu es #${myRank + 1}`}
        </div>
      </div>

      {/* Onglets période */}
      <div style={{ display: 'flex', gap: 6, padding: '0 14px 12px', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {PERIODS.map(p => (
          <button key={p.id} onClick={() => setPeriod(p.id)} style={{
            flexShrink: 0, padding: '7px 14px', borderRadius: 20,
            background: period === p.id ? 'var(--am)' : 'var(--bg3)',
            border: `1px solid ${period === p.id ? 'var(--am)' : 'var(--border)'}`,
            color: period === p.id ? '#0d0d0d' : 'var(--tx2)',
            fontSize: 12, fontWeight: period === p.id ? 500 : 400,
            cursor: 'pointer', fontFamily: 'DM Sans,sans-serif', transition: 'all .15s',
          }}>{p.label}</button>
        ))}
      </div>

      {/* Stats rapides */}
      <div style={{ display: 'flex', gap: 8, padding: '0 14px 12px', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {[
          { label: 'Pintes', value: totalPintes.toLocaleString('fr-FR') },
          { label: 'Membres', value: profiles.length },
          { label: 'Actifs', value: profiles.filter(p => p.derniere_activite && (Date.now()-new Date(p.derniere_activite).getTime()) < 30*86400000).length },
          { label: 'Objectif', value: '1M' },
        ].map(s => (
          <div key={s.label} style={{ flexShrink: 0, background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 10, padding: '8px 12px', textAlign: 'center', minWidth: 62 }}>
            <div style={{ fontFamily: 'Bebas Neue,sans-serif', fontSize: 20, color: 'var(--am)' }}>{s.value}</div>
            <div style={{ fontSize: 9, color: 'var(--tx2)', marginTop: 1 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Recherche */}
      <div style={{ padding: '0 14px 10px' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..."
          style={{ width: '100%', padding: '9px 12px', background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--tx)', fontSize: 13, fontFamily: 'DM Sans,sans-serif', outline: 'none' }} />
      </div>

      {/* Liste */}
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 14, margin: '0 14px', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--tx2)', fontSize: 13 }}>Chargement...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--tx2)', fontSize: 13 }}>
            {period === 'today' ? "Personne n'a posté aujourd'hui encore !" : 'Aucun résultat'}
          </div>
        ) : (
          filtered.map((p, i) => (
            <Row
              key={p.id}
              profile={p}
              rank={i}
              isMe={p.id === me?.id}
              value={getValue(p)}
              period={period}
              maxVal={maxVal}
            />
          ))
        )}
      </div>
    </div>
  )
}
