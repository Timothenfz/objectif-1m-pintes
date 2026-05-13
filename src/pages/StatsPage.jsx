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
        <div style={{ fontSize: 10, color: 'var(--tx2)', marginTop: 4 }}>
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
const PINTE_LITRES = 0.568

function StatCard({ emoji, title, value, sub, color }) {
  return (
    <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 16, padding: '16px 14px', display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{ fontSize: 36, flexShrink: 0 }}>{emoji}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, color: 'var(--tx2)', marginBottom: 2 }}>{title}</div>
        <div style={{ fontFamily: 'Bebas Neue,sans-serif', fontSize: 28, color: color || 'var(--am)', lineHeight: 1 }}>{value}</div>
        {sub && <div style={{ fontSize: 11, color: 'var(--tx2)', marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  )
}

function StatsTab() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchStats() }, [])

  async function fetchStats() {
    setLoading(true)
    try {
      const [
        { count: totalPintes },
        { count: pintesReelles },
        { count: membres },
        { data: topUser },
        { data: firstPinte },
      ] = await Promise.all([
        supabase.from('pintes').select('*', { count: 'exact', head: true }),
        supabase.from('pintes').select('*', { count: 'exact', head: true }).not('user_id', 'is', null),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).gt('total_perso', 0),
        supabase.from('profiles').select('username, total_perso').order('total_perso', { ascending: false }).limit(1),
        supabase.from('pintes').select('created_at').not('user_id', 'is', null).order('created_at', { ascending: true }).limit(1),
      ])

      const total = totalPintes || 0
      const reelles = pintesReelles || 0
      const litres = Math.round(total * PINTE_LITRES)
      // Date de lancement du groupe : 19 avril 2026
      const dateLancement = new Date('2026-04-19T00:00:00.000Z')
      const jours = Math.max(1, Math.floor((Date.now() - dateLancement.getTime()) / 86400000))

      setStats({
        total, membres: membres || 0, litres,
        litresParJour: (Math.round(reelles * PINTE_LITRES) / jours).toFixed(1),
        pintesParJour: (reelles / jours).toFixed(1),
        piscines: (litres / 2500000).toFixed(6),
        baignoires: Math.round(litres / 200),
        camions: (litres / 30000).toFixed(3),
        euros: Math.round(total * 8),
        jours,
        topUser: topUser?.[0],
        pctObjectif: ((total / 1000000) * 100).toFixed(3),
        joursRestants: total > 0 ? Math.round((1000000 - total) / (total / jours)) : '∞',
      })
    } catch(e) { console.error(e) }
    setLoading(false)
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--tx2)' }}>Chargement...</div>
  if (!stats) return null

  return (
    <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>

      {/* Objectif */}
      <div style={{ background: 'linear-gradient(135deg, rgba(245,166,35,0.15), rgba(245,166,35,0.05))', border: '1px solid rgba(245,166,35,0.3)', borderRadius: 16, padding: '20px 16px', textAlign: 'center' }}>
        <div style={{ fontSize: 13, color: 'var(--am)', fontWeight: 500, marginBottom: 6, letterSpacing: '.05em' }}>OBJECTIF 1 MILLION</div>
        <div style={{ fontFamily: 'Bebas Neue,sans-serif', fontSize: 52, color: 'var(--am)', lineHeight: 1 }}>{stats.total.toLocaleString('fr-FR')}</div>
        <div style={{ fontSize: 13, color: 'var(--tx2)', marginBottom: 12 }}>pintes / 1 000 000</div>
        <div style={{ background: 'var(--bg3)', borderRadius: 4, height: 8, overflow: 'hidden', marginBottom: 8 }}>
          <div style={{ height: 8, borderRadius: 4, background: 'linear-gradient(90deg,#c4841a,#ffc85a)', width: `${Math.max(parseFloat(stats.pctObjectif), 0.02)}%`, minWidth: 6 }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--tx2)' }}>
          <span>{stats.pctObjectif}% accompli</span>
          <span>~{typeof stats.joursRestants === 'number' ? stats.joursRestants.toLocaleString('fr-FR') : stats.joursRestants} jours restants</span>
        </div>
      </div>

      {/* Litres */}
      <div style={{ fontSize: 12, color: 'var(--tx2)', fontWeight: 500, marginTop: 6, paddingLeft: 2 }}>💧 EN LITRES</div>
      <StatCard emoji="🫙" title="Volume total bu" value={`${stats.litres.toLocaleString('fr-FR')} L`} sub={`soit ${(stats.litres/1000).toFixed(1)} hectolitres`} />
      <StatCard emoji="🏊" title="Piscines olympiques" value={stats.piscines} sub="(2 500 000L par piscine)" color="var(--color-text-info, #60a5fa)" />
      <StatCard emoji="🛁" title="Baignoires remplies" value={stats.baignoires.toLocaleString('fr-FR')} sub="(200L par baignoire)" />
      <StatCard emoji="🚛" title="Camions citernes" value={stats.camions} sub="(30 000L par camion)" />

      {/* Rythme */}
      <div style={{ fontSize: 12, color: 'var(--tx2)', fontWeight: 500, marginTop: 6, paddingLeft: 2 }}>⚡ RYTHME</div>
      <StatCard emoji="📅" title="Jours depuis le début" value={stats.jours} sub="depuis le lancement du groupe" />
      <StatCard emoji="🍺" title="Pintes par jour (moyenne)" value={stats.pintesParJour} sub="au rythme actuel" />
      <StatCard emoji="💧" title="Litres par jour (moyenne)" value={`${stats.litresParJour} L`} sub="au rythme actuel" />
      <StatCard emoji="📊" title="Pintes par personne (moyenne)" value={(stats.total / Math.max(stats.membres, 1)).toFixed(1)} sub={`sur ${stats.membres} membres actifs`} />

      {/* Argent */}
      <div style={{ fontSize: 12, color: 'var(--tx2)', fontWeight: 500, marginTop: 6, paddingLeft: 2 }}>💰 EN EUROS</div>
      <StatCard emoji="💸" title="Dépensé estimé" value={`${stats.euros.toLocaleString('fr-FR')} €`} sub="à 8€ la pinte en moyenne" color="#4ade80" />

      {/* WTF */}
      <div style={{ fontSize: 12, color: 'var(--tx2)', fontWeight: 500, marginTop: 6, paddingLeft: 2 }}>🤯 POUR RIGOLER</div>
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 16, padding: '14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[
          { emoji: '🏟', text: `Stade de France (81 000 places) : vous avez bu l'équivalent de ${(stats.litres / 81000).toFixed(2)} L par siège` },
          { emoji: '🗼', text: `La tour Eiffel mesure 330m. En empilant vos pintes (15cm chacune), vous atteignez ${Math.round(stats.total * 0.15)}m de haut` },
          { emoji: '🌍', text: `En mettant vos pintes en ligne (diamètre 7cm), vous couvrez ${(stats.total * 0.07 / 1000).toFixed(2)} km` },
          { emoji: '🎂', text: `Si vous aviez bu une pinte par jour depuis votre naissance, vous auriez ${Math.round(stats.total / 365)} ans` },
          { emoji: '🍺', text: `Le champion ${stats.topUser?.username || '?'} a bu ${stats.topUser?.total_perso || 0} pintes soit ${Math.round((stats.topUser?.total_perso || 0) * PINTE_LITRES)} litres` },
        ].map((f, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '8px 0', borderBottom: i < 4 ? '1px solid var(--border)' : 'none' }}>
            <span style={{ fontSize: 20, flexShrink: 0 }}>{f.emoji}</span>
            <span style={{ fontSize: 12, color: 'var(--tx2)', lineHeight: 1.6 }}>{f.text}</span>
          </div>
        ))}
      </div>

      {/* Groupe */}
      <div style={{ fontSize: 12, color: 'var(--tx2)', fontWeight: 500, marginTop: 6, paddingLeft: 2 }}>👥 LE GROUPE</div>
      <StatCard emoji="👑" title="MVP absolu" value={stats.topUser?.username || '—'} sub={`${stats.topUser?.total_perso || 0} pintes`} />
      <StatCard emoji="👥" title="Membres actifs" value={stats.membres} sub="ont posté au moins 1 pinte" />
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
