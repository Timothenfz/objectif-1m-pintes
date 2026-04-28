import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth.jsx'

const MEDALS = ['🥇', '🥈', '🥉']

function Row({ profile, rank, isMe }) {
  const daysInactive = profile.derniere_activite
    ? Math.floor((Date.now() - new Date(profile.derniere_activite).getTime()) / 86400000)
    : 999
  const inactive = daysInactive >= 30

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 16px',
      background: isMe ? 'rgba(245,166,35,0.06)' : 'transparent',
      borderBottom: '1px solid var(--border)',
      borderLeft: isMe ? '3px solid var(--amber)' : '3px solid transparent',
      animation: `fadeUp 0.3s ${rank * 0.03}s ease both`,
      opacity: 0,
      animationFillMode: 'forwards',
    }}>
      <div style={{
        width: 28, textAlign: 'center', flexShrink: 0,
        fontFamily: rank < 3 ? 'inherit' : 'Bebas Neue',
        fontSize: rank < 3 ? 20 : 16,
        color: rank < 3 ? 'inherit' : 'var(--text2)',
      }}>
        {rank < 3 ? MEDALS[rank] : rank + 1}
      </div>

      <div style={{
        width: 40, height: 40, borderRadius: '50%',
        background: `hsl(${(profile.username?.charCodeAt(0) || 0) * 15 % 360}, 40%, 22%)`,
        border: `2px solid hsl(${(profile.username?.charCodeAt(0) || 0) * 15 % 360}, 60%, 45%)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 16, fontWeight: 500,
        color: `hsl(${(profile.username?.charCodeAt(0) || 0) * 15 % 360}, 80%, 70%)`,
        flexShrink: 0,
      }}>
        {(profile.username || '?')[0].toUpperCase()}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 14, fontWeight: 500,
          display: 'flex', alignItems: 'center', gap: 6,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {profile.username}
          {inactive && (
            <span style={{
              fontSize: 10, padding: '1px 6px', borderRadius: 20,
              background: 'rgba(220,50,50,0.15)', color: '#ff6b6b',
              flexShrink: 0,
            }}>inactif</span>
          )}
          {isMe && (
            <span style={{
              fontSize: 10, padding: '1px 6px', borderRadius: 20,
              background: 'rgba(245,166,35,0.2)', color: 'var(--amber)',
              flexShrink: 0,
            }}>toi</span>
          )}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>
          depuis {profile.date_arrivee
            ? new Date(profile.date_arrivee).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
            : '—'}
          {profile.dernier_numero_global ? ` · dernier #${profile.dernier_numero_global}` : ''}
        </div>
      </div>

      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{
          fontFamily: 'Bebas Neue', fontSize: 24,
          color: rank === 0 ? 'var(--amber)' : 'var(--text)',
          lineHeight: 1,
        }}>
          {profile.total_perso}
        </div>
        <div style={{ fontSize: 10, color: 'var(--text2)' }}>pintes</div>
      </div>
    </div>
  )
}

export default function RankingPage() {
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [view, setView] = useState('total')
  const { profile: me } = useAuth()

  useEffect(() => { fetchRanking() }, [])

  async function fetchRanking() {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('total_perso', { ascending: false })
    setProfiles(data || [])
    setLoading(false)
  }

  const filtered = profiles
    .filter(p => p.username?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => view === 'total' ? b.total_perso - a.total_perso : b.total_perso - a.total_perso)

  const totalPintes = profiles.reduce((s, p) => s + (p.total_perso || 0), 0)
  const myRank = profiles.findIndex(p => p.id === me?.id)

  return (
    <div style={{ minHeight: '100dvh', paddingBottom: 90 }}>
      {/* Header */}
      <div style={{ padding: '56px 20px 16px' }}>
        <h2 style={{ fontSize: 36, color: 'var(--foam)' }}>CLASSEMENT</h2>
        <p style={{ fontSize: 13, color: 'var(--text2)', marginTop: 2 }}>
          {profiles.length} membres · {totalPintes.toLocaleString('fr-FR')} pintes au total
          {myRank >= 0 && ` · tu es #${myRank + 1}`}
        </p>
      </div>

      {/* Stats rapides */}
      <div style={{ display: 'flex', gap: 10, padding: '0 16px 16px', overflowX: 'auto' }}>
        {[
          { label: 'Total', value: totalPintes.toLocaleString('fr-FR') },
          { label: 'Membres', value: profiles.length },
          { label: 'Actifs', value: profiles.filter(p => {
            if (!p.derniere_activite) return false
            return (Date.now() - new Date(p.derniere_activite).getTime()) < 30 * 86400000
          }).length },
          { label: 'Objectif', value: '1M' },
        ].map(s => (
          <div key={s.label} style={{
            flexShrink: 0,
            background: 'var(--bg2)', border: '1px solid var(--border)',
            borderRadius: 12, padding: '10px 14px', textAlign: 'center', minWidth: 70,
          }}>
            <div style={{ fontFamily: 'Bebas Neue', fontSize: 22, color: 'var(--amber)' }}>{s.value}</div>
            <div style={{ fontSize: 10, color: 'var(--text2)', marginTop: 1 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{ padding: '0 16px 12px' }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher un membre..."
          style={{
            width: '100%', padding: '10px 14px',
            background: 'var(--bg2)', border: '1px solid var(--border)',
            borderRadius: 10, color: 'var(--text)', fontSize: 14, outline: 'none',
          }}
        />
      </div>

      {/* Liste */}
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', margin: '0 16px', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text2)' }}>Chargement...</div>
        ) : filtered.map((p, i) => (
          <Row key={p.id} profile={p} rank={i} isMe={p.id === me?.id} />
        ))}
      </div>
    </div>
  )
}
