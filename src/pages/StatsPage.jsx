import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth.jsx'
import Avatar from '../components/Avatar.jsx'
import ProfileAvatar from '../components/ProfileAvatar.jsx'

// ─── CLASSEMENT ───────────────────────────────────────────────
const MEDALS = ['🥇', '🥈', '🥉']
const PERIODS = [
  { id: 'alltime', label: 'All Time' },
  { id: 'month',   label: 'Ce mois' },
  { id: 'week',    label: 'Semaine' },
  { id: 'today',   label: "Aujourd'hui" },
]

function getDateFilter(period) {
  const now = new Date()
  if (period === 'today') return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  if (period === 'week') { const s = new Date(now); s.setDate(now.getDate() - now.getDay()); s.setHours(0,0,0,0); return s.toISOString() }
  if (period === 'month') return new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  return null
}

function Row({ profile, rank, isMe, value, period, onPress }) {
  const daysInactive = profile.derniere_activite
    ? Math.floor((Date.now() - new Date(profile.derniere_activite).getTime()) / 86400000)
    : 999
  const inactive = daysInactive >= 30 && period === 'alltime'

  return (
    <div onClick={onPress} style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 14px',
      background: isMe ? 'rgba(245,166,35,0.06)' : 'transparent',
      borderBottom: '1px solid var(--border)',
      borderLeft: isMe ? '3px solid var(--am)' : '3px solid transparent',
      cursor: 'pointer',
    }}>
      <div style={{ width: 26, textAlign: 'center', flexShrink: 0, fontSize: rank < 3 ? 18 : 13, fontFamily: rank < 3 ? 'inherit' : 'Bebas Neue,sans-serif', color: 'var(--tx2)' }}>
        {rank < 3 ? MEDALS[rank] : rank + 1}
      </div>
      <Avatar username={profile.username} avatarUrl={profile.avatar_url} size={38} border />
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
            : profile.derniere_activite ? new Date(profile.derniere_activite).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : '—'}
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontFamily: 'Bebas Neue,sans-serif', fontSize: 22, color: rank === 0 ? 'var(--am)' : 'var(--tx)', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 9, color: 'var(--tx2)' }}>pintes</div>
      </div>
    </div>
  )
}

function ClassementTab({ me }) {
  const navigate = useNavigate()
  const [period, setPeriod] = useState('alltime')
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => { fetchRanking() }, [period])

  async function fetchRanking() {
    setLoading(true)
    const dateFilter = getDateFilter(period)
    if (period === 'alltime') {
      const { data } = await supabase.from('profiles').select('*').gt('total_perso', 0).order('total_perso', { ascending: false })
      setProfiles(data || [])
    } else {
      const { data: pintesData } = await supabase
        .from('pintes')
        .select('user_id, profiles(id, username, avatar_url, date_arrivee, derniere_activite)')
        .not('user_id', 'is', null)
        .gte('created_at', dateFilter)
      const counts = {}; const profileMap = {}
      ;(pintesData || []).forEach(p => {
        counts[p.user_id] = (counts[p.user_id] || 0) + 1
        if (p.profiles) profileMap[p.user_id] = p.profiles
      })
      const ranked = Object.entries(counts).map(([uid, cnt]) => ({ ...profileMap[uid], _count: cnt })).sort((a, b) => b._count - a._count)
      setProfiles(ranked)
    }
    setLoading(false)
  }

  function getValue(p) { return period === 'alltime' ? (p.total_perso || 0) : (p._count || 0) }
  const filtered = profiles.filter(p => p.username?.toLowerCase().includes(search.toLowerCase()))
  const totalPintes = profiles.reduce((s, p) => s + getValue(p), 0)
  const myRank = filtered.findIndex(p => p.id === me?.id)
  const maxVal = filtered.length ? getValue(filtered[0]) : 1

  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--tx2)', padding: '0 16px 10px' }}>
        {profiles.length} membre{profiles.length > 1 ? 's' : ''} · {totalPintes.toLocaleString('fr-FR')} pintes
        {myRank >= 0 && ` · tu es #${myRank + 1}`}
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
            cursor: 'pointer', fontFamily: 'DM Sans,sans-serif',
          }}>{p.label}</button>
        ))}
      </div>

      {/* Podium top 3 */}
      {!loading && filtered.length >= 3 && search === '' && (
        <div style={{ padding: '0 14px 12px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 8 }}>
          {[filtered[1], filtered[0], filtered[2]].map((p, idx) => {
            const realRank = idx === 0 ? 1 : idx === 1 ? 0 : 2
            const height = realRank === 0 ? 90 : realRank === 1 ? 65 : 50
            const size = realRank === 0 ? 44 : 36
            return (
              <div key={p.id} onClick={() => navigate(`/u/${p.id}`)} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                <div style={{ width: size, height: size, borderRadius: '50%', background: 'var(--bg3)', border: `2px solid ${realRank === 0 ? 'var(--am)' : 'var(--border)'}`, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {p.avatar_url
                    ? <img src={p.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ fontSize: realRank === 0 ? 18 : 14, fontWeight: 700, color: realRank === 0 ? 'var(--am)' : 'var(--tx2)' }}>{p.username?.[0]?.toUpperCase()}</span>
                  }
                </div>
                <div style={{ fontSize: 10, color: realRank === 0 ? 'var(--tx)' : 'var(--tx2)', fontWeight: realRank === 0 ? 600 : 400, textAlign: 'center', maxWidth: 70, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.username}</div>
                <div style={{ fontSize: 11, color: 'var(--am)', fontWeight: 700 }}>{getValue(p)} 🍺</div>
                <div style={{ width: '100%', height, background: 'var(--card-bg)', border: `1px solid ${realRank === 0 ? 'rgba(245,166,35,0.3)' : 'var(--border)'}`, borderRadius: '8px 8px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: realRank === 0 ? 26 : 20 }}>
                  {MEDALS[realRank]}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Recherche */}
      <div style={{ padding: '0 14px 10px' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..."
          style={{ width: '100%', padding: '9px 12px', background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--tx)', fontSize: 13, fontFamily: 'DM Sans,sans-serif', outline: 'none', boxSizing: 'border-box' }} />
      </div>

      {/* Liste (à partir du 4ème) */}
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 14, margin: '0 14px', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--tx2)', fontSize: 13 }}>Chargement...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--tx2)', fontSize: 13 }}>Aucun résultat</div>
        ) : (
          filtered.map((p, i) => (
            <Row key={p.id || i} profile={p} rank={i} isMe={p.id === me?.id} value={getValue(p)} period={period} maxVal={maxVal} onPress={() => navigate(`/u/${p.id}`)} />
          ))
        )}
      </div>
    </div>
  )
}

// ─── STATS ────────────────────────────────────────────────────
function StatsTab() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [chartData, setChartData] = useState([])

  useEffect(() => { fetchStats() }, [])

  async function fetchStats() {
    setLoading(true)
    try {
      const [
        { count: total },
        { count: today },
        { count: thisWeek },
        { count: thisMonth },
        { data: firstPinte },
        { data: topUser },
        { data: daily },
      ] = await Promise.all([
        supabase.from('pintes').select('*', { count: 'exact', head: true }),
        supabase.from('pintes').select('*', { count: 'exact', head: true }).not('user_id', 'is', null).gte('created_at', new Date(new Date().setHours(0,0,0,0)).toISOString()),
        supabase.from('pintes').select('*', { count: 'exact', head: true }).not('user_id', 'is', null).gte('created_at', (() => { const d = new Date(); d.setDate(d.getDate()-d.getDay()); d.setHours(0,0,0,0); return d.toISOString() })()),
        supabase.from('pintes').select('*', { count: 'exact', head: true }).not('user_id', 'is', null).gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
        supabase.from('pintes').select('created_at').not('user_id', 'is', null).order('created_at', { ascending: true }).limit(1),
        supabase.from('profiles').select('username, total_perso').order('total_perso', { ascending: false }).limit(1),
        supabase.from('pintes').select('created_at').not('user_id', 'is', null).order('created_at', { ascending: false }).limit(300),
      ])

      const days = {}
      for (let i = 6; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0,0,0,0)
        days[d.toDateString()] = 0
      }
      ;(daily || []).forEach(p => {
        const d = new Date(p.created_at).toDateString()
        if (d in days) days[d]++
      })
      setChartData(Object.entries(days).map(([d, count]) => ({ label: new Date(d).toLocaleDateString('fr-FR', { weekday: 'short' }), count })))

      const daysRunning = firstPinte?.[0] ? Math.max(1, Math.floor((Date.now() - new Date(firstPinte[0].created_at).getTime()) / 86400000)) : 1
      setStats({
        total: total || 0, today: today || 0, thisWeek: thisWeek || 0, thisMonth: thisMonth || 0,
        daysRunning,
        avgPerDay: Math.round((total || 0) / daysRunning * 10) / 10,
        pct: ((total || 0) / 1000000 * 100).toFixed(3),
        topUser: topUser?.[0],
        daysLeft: Math.round((1000000 - (total || 0)) / Math.max(1, Math.round((total || 0) / daysRunning))),
      })
    } catch(e) { console.error(e) }
    setLoading(false)
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--tx2)' }}>Chargement...</div>
  if (!stats) return null

  const maxBar = Math.max(...chartData.map(d => d.count), 1)

  return (
    <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Progression */}
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 14, padding: 14 }}>
        <div style={{ fontFamily: 'Bebas Neue,sans-serif', fontSize: 16, color: 'var(--tx)', marginBottom: 8 }}>🎯 PROGRESSION</div>
        <div style={{ fontFamily: 'Bebas Neue,sans-serif', fontSize: 36, color: 'var(--am)', lineHeight: 1 }}>
          {stats.total.toLocaleString('fr-FR')}
        </div>
        <div style={{ fontSize: 11, color: 'var(--tx2)', marginBottom: 10 }}>/ 1 000 000 pintes · {stats.pct}%</div>
        <div style={{ height: 8, background: 'var(--bg3)', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ height: 8, background: 'linear-gradient(90deg,#c4841a,#f5a623)', borderRadius: 4, width: `${Math.max(parseFloat(stats.pct), 0.02)}%`, transition: 'width .5s' }} />
        </div>
        {stats.daysLeft > 0 && (
          <div style={{ fontSize: 10, color: 'var(--tx2)', marginTop: 6 }}>À ce rythme : objectif dans ~{stats.daysLeft} jours</div>
        )}
      </div>

      {/* Grille */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {[
          { label: "Aujourd'hui", value: stats.today, icon: '📅' },
          { label: 'Cette semaine', value: stats.thisWeek, icon: '📆' },
          { label: 'Ce mois', value: stats.thisMonth, icon: '🗓' },
          { label: 'Moy. / jour', value: stats.avgPerDay, icon: '📊' },
          { label: 'Jours actifs', value: stats.daysRunning, icon: '⏱' },
          { label: 'Record perso', value: stats.topUser ? `${stats.topUser.total_perso} — ${stats.topUser.username}` : '—', icon: '👑' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 14px' }}>
            <div style={{ fontSize: 18, marginBottom: 4 }}>{s.icon}</div>
            <div style={{ fontFamily: 'Bebas Neue,sans-serif', fontSize: s.label === 'Record perso' ? 13 : 22, color: 'var(--am)', lineHeight: 1.2 }}>{s.value}</div>
            <div style={{ fontSize: 10, color: 'var(--tx2)', marginTop: 3 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Graphe 7 jours */}
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 14, padding: 14, marginBottom: 4 }}>
        <div style={{ fontFamily: 'Bebas Neue,sans-serif', fontSize: 16, color: 'var(--tx)', marginBottom: 12 }}>📈 7 DERNIERS JOURS</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 90 }}>
          {chartData.map((d, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
              <div style={{ fontSize: 9, color: 'var(--tx2)' }}>{d.count || ''}</div>
              <div style={{ width: '100%', background: i === chartData.length - 1 ? 'var(--am)' : 'rgba(245,166,35,0.3)', borderRadius: '4px 4px 0 0', height: `${Math.max((d.count / maxBar) * 55, d.count > 0 ? 4 : 0)}px`, transition: 'height .4s' }} />
              <div style={{ fontSize: 9, color: 'var(--tx2)' }}>{d.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── PAGE PRINCIPALE ──────────────────────────────────────────
export default function StatsPage() {
  const [tab, setTab] = useState('classement')
  const { profile: me } = useAuth()

  return (
    <div style={{ minHeight: '100dvh', paddingBottom: 90, background: 'var(--bg)' }}>
      <div style={{ padding: '52px 16px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <div style={{ fontFamily: 'Bebas Neue,sans-serif', fontSize: 13, color: 'var(--am)', letterSpacing: '.08em' }}>CLASSEMENTS & STATS</div>
          <div style={{ fontFamily: 'Bebas Neue,sans-serif', fontSize: 32, color: 'var(--tx)', lineHeight: 1 }}>STATS</div>
        </div>
        <ProfileAvatar />
      </div>

      {/* Onglets principaux */}
      <div style={{ margin: '0 14px 14px', background: 'var(--bg3)', borderRadius: 12, padding: 4, display: 'flex', gap: 4 }}>
        {[{ id: 'classement', label: '🏆 Classement' }, { id: 'stats', label: '📊 Stats' }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, padding: '9px 0', borderRadius: 8, cursor: 'pointer',
            background: tab === t.id ? 'var(--card-bg)' : 'transparent',
            border: tab === t.id ? '1px solid var(--border)' : '1px solid transparent',
            color: tab === t.id ? 'var(--tx)' : 'var(--tx2)',
            fontSize: 12, fontWeight: tab === t.id ? 600 : 400,
            fontFamily: 'DM Sans,sans-serif', transition: 'all .15s',
          }}>{t.label}</button>
        ))}
      </div>

      {tab === 'classement' ? <ClassementTab me={me} /> : <StatsTab />}
    </div>
  )
}
