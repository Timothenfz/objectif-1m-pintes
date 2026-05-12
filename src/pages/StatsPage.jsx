import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const PINTE_LITRES = 0.568

function StatCard({ emoji, title, value, sub, color }) {
  return (
    <div style={{
      background: 'var(--card-bg)', border: '1px solid var(--border)',
      borderRadius: 16, padding: '16px 14px',
      display: 'flex', alignItems: 'center', gap: 14,
    }}>
      <div style={{ fontSize: 36, flexShrink: 0 }}>{emoji}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, color: 'var(--tx2)', marginBottom: 2 }}>{title}</div>
        <div style={{ fontFamily: 'Bebas Neue,sans-serif', fontSize: 28, color: color || 'var(--am)', lineHeight: 1 }}>{value}</div>
        {sub && <div style={{ fontSize: 11, color: 'var(--tx2)', marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  )
}

import ProfileAvatar from '../components/ProfileAvatar.jsx'

export default function StatsPage() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchStats() }, [])

  async function fetchStats() {
    const [
      { count: totalPintes },
      { count: membres },
      { data: topUser },
      { data: firstPinte },
      { data: lastPinte },
    ] = await Promise.all([
      supabase.from('pintes').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).gt('total_perso', 0),
      supabase.from('profiles').select('username, total_perso').order('total_perso', { ascending: false }).limit(1),
      supabase.from('pintes').select('created_at').order('created_at', { ascending: true }).limit(1),
      supabase.from('pintes').select('created_at').order('created_at', { ascending: false }).limit(1),
    ])

    const total = totalPintes || 0
    const litres = Math.round(total * PINTE_LITRES)
    const jours = firstPinte?.[0] ? Math.max(1, Math.floor((Date.now() - new Date(firstPinte[0].created_at).getTime()) / 86400000)) : 1

    setStats({
      total,
      membres: membres || 0,
      litres,
      litresParJour: (litres / jours).toFixed(1),
      pintesParJour: (total / jours).toFixed(1),
      piscines: (litres / 2500000).toFixed(6),
      baignoires: Math.round(litres / 200),
      camions: (litres / 30000).toFixed(3),
      euros: Math.round(total * 8),
      jours,
      topUser: topUser?.[0],
      pctObjectif: ((total / 1000000) * 100).toFixed(3),
      joursRestants: total > 0 ? Math.round((1000000 - total) / (total / jours)) : '∞',
      toursDeTerre: ((total * PINTE_LITRES * 0.001) / 40075).toFixed(8),
    })
    setLoading(false)
  }

  if (loading) return (
    <div style={{ height: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', border: '2px solid var(--border)', borderTopColor: 'var(--am)', animation: 'spin .8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <div style={{ minHeight: '100dvh', paddingBottom: 100, background: 'var(--bg)' }}>
      <div style={{ padding: '52px 16px 16px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ fontFamily: 'Bebas Neue,sans-serif', fontSize: 32, color: 'var(--tx)' }}>STATS</div>
          <ProfileAvatar />
        </div>
        <div style={{ fontSize: 12, color: 'var(--tx2)', marginTop: 2 }}>Fun facts & chiffres du groupe</div>
      </div>

      <div style={{ padding: '14px 14px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>

        {/* Objectif */}
        <div style={{ background: 'linear-gradient(135deg, rgba(245,166,35,0.15), rgba(245,166,35,0.05))', border: '1px solid rgba(245,166,35,0.3)', borderRadius: 16, padding: '20px 16px', textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: 'var(--am)', fontWeight: 500, marginBottom: 6, letterSpacing: '.05em' }}>OBJECTIF 1 MILLION</div>
          <div style={{ fontFamily: 'Bebas Neue,sans-serif', fontSize: 52, color: 'var(--am)', lineHeight: 1 }}>
            {stats.total.toLocaleString('fr-FR')}
          </div>
          <div style={{ fontSize: 13, color: 'var(--tx2)', marginBottom: 12 }}>pintes / 1 000 000</div>
          <div style={{ background: 'var(--bg3)', borderRadius: 4, height: 8, overflow: 'hidden', marginBottom: 8 }}>
            <div style={{ height: 8, borderRadius: 4, background: 'linear-gradient(90deg,#c4841a,#ffc85a)', width: `${Math.max(parseFloat(stats.pctObjectif), 0.02)}%`, minWidth: 6 }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--tx2)' }}>
            <span>{stats.pctObjectif}% accompli</span>
            <span>~{typeof stats.joursRestants === 'number' ? stats.joursRestants.toLocaleString('fr-FR') : stats.joursRestants} jours restants</span>
          </div>
        </div>

        {/* Section liquide */}
        <div style={{ fontSize: 12, color: 'var(--tx2)', fontWeight: 500, marginTop: 6, paddingLeft: 2 }}>💧 EN LITRES</div>
        <StatCard emoji="🫙" title="Volume total bu" value={`${stats.litres.toLocaleString('fr-FR')} L`} sub={`soit ${(stats.litres/1000).toFixed(1)} hectolitres`} />
        <StatCard emoji="🏊" title="Piscines olympiques" value={stats.piscines} sub="(2 500 000L par piscine)" color="var(--color-text-info, #60a5fa)" />
        <StatCard emoji="🛁" title="Baignoires remplies" value={stats.baignoires.toLocaleString('fr-FR')} sub="(200L par baignoire)" />
        <StatCard emoji="🚛" title="Camions citernes" value={stats.camions} sub="(30 000L par camion)" />

        {/* Section rythme */}
        <div style={{ fontSize: 12, color: 'var(--tx2)', fontWeight: 500, marginTop: 6, paddingLeft: 2 }}>⚡ RYTHME</div>
        <StatCard emoji="📅" title="Jours depuis le début" value={stats.jours} sub={`depuis le lancement du groupe`} />
        <StatCard emoji="🍺" title="Pintes par jour (moyenne)" value={stats.pintesParJour} sub="au rythme actuel" />
        <StatCard emoji="💧" title="Litres par jour (moyenne)" value={`${stats.litresParJour} L`} sub="au rythme actuel" />

        {/* Section argent */}
        <div style={{ fontSize: 12, color: 'var(--tx2)', fontWeight: 500, marginTop: 6, paddingLeft: 2 }}>💰 EN EUROS</div>
        <StatCard emoji="💸" title="Dépensé estimé" value={`${stats.euros.toLocaleString('fr-FR')} €`} sub="à 8€ la pinte en moyenne" color="#4ade80" />

        {/* Section WTF */}
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
    </div>
  )
}
