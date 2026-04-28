import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth.jsx'
import { BADGES, CATEGORIES, RARITY_COLORS } from '../lib/badges.js'

export default function BadgesPage() {
  const { profile } = useAuth()
  const [unlockedIds, setUnlockedIds] = useState(new Set())
  const [cat, setCat] = useState('Tous')
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (profile?.id) fetchBadges() }, [profile])

  async function fetchBadges() {
    const { data } = await supabase
      .from('badges_utilisateur')
      .select('badge_id')
      .eq('user_id', profile.id)
    setUnlockedIds(new Set((data || []).map(b => b.badge_id)))
    setLoading(false)
  }

  const filtered = cat === 'Tous' ? BADGES : BADGES.filter(b => b.cat === cat)
  const unlocked = BADGES.filter(b => unlockedIds.has(b.id)).length

  return (
    <div style={{ minHeight: '100dvh', paddingBottom: 90, background: 'var(--bg)' }}>
      {/* Header */}
      <div style={{ padding: '52px 16px 16px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{ fontSize: 32 }}>🏅</div>
          <div>
            <div style={{ fontFamily: 'Bebas Neue,sans-serif', fontSize: 32, color: 'var(--tx)', lineHeight: 1 }}>BADGES</div>
            <div style={{ fontSize: 11, color: 'var(--tx2)', marginTop: 2 }}>{unlocked} / {BADGES.length} débloqués</div>
          </div>
        </div>

        {/* Progress */}
        <div style={{ background: 'var(--bg3)', borderRadius: 4, height: 6, overflow: 'hidden', marginBottom: 4 }}>
          <div style={{
            height: 6, borderRadius: 4,
            background: 'linear-gradient(90deg,#c4841a,#ffc85a)',
            width: `${Math.round(unlocked / BADGES.length * 100)}%`,
            transition: 'width .5s ease',
          }} />
        </div>
        <div style={{ fontSize: 10, color: 'var(--tx2)' }}>{Math.round(unlocked / BADGES.length * 100)}% complété</div>
      </div>

      {/* Filtres catégories */}
      <div style={{ display: 'flex', gap: 6, padding: '12px 14px', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setCat(c)} style={{
            flexShrink: 0,
            padding: '6px 14px', borderRadius: 20,
            background: cat === c ? '#f5a623' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${cat === c ? '#f5a623' : 'rgba(255,255,255,0.1)'}`,
            color: cat === c ? '#0d0d0d' : '#7a7670',
            fontSize: 12, fontWeight: cat === c ? 500 : 400,
            cursor: 'pointer', fontFamily: 'DM Sans,sans-serif',
            transition: 'all .15s',
          }}>{c}</button>
        ))}
      </div>

      {/* Grille badges */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 10, padding: '0 12px' }}>
        {filtered.map(badge => {
          const unlocked = unlockedIds.has(badge.id)
          const colors = RARITY_COLORS[badge.rarity]
          return (
            <div key={badge.id} style={{
              background: unlocked ? colors.bg : 'rgba(255,255,255,0.03)',
              border: `1px solid ${unlocked ? colors.border : 'var(--border)'}`,
              borderRadius: 14, padding: '14px 12px',
              opacity: unlocked ? 1 : 0.5,
              transition: 'all .2s',
              position: 'relative',
            }}>
              <div style={{ fontSize: 10, color: unlocked ? colors.text : '#3a3834', textAlign: 'right', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.06em' }}>
                {badge.rarity}
              </div>
              <div style={{ fontSize: 36, marginBottom: 8, filter: unlocked ? 'none' : 'grayscale(1)', textAlign: 'center' }}>
                {badge.icon}
              </div>
              <div style={{ fontSize: 13, fontWeight: 500, color: unlocked ? '#ede9e0' : '#4a4742', textAlign: 'center', marginBottom: 4 }}>
                {badge.name_fr}
              </div>
              <div style={{ fontSize: 11, color: 'var(--tx2)', textAlign: 'center', lineHeight: 1.4 }}>
                {badge.desc_fr}
              </div>
              {unlocked && (
                <div style={{
                  position: 'absolute', top: 10, left: 10,
                  width: 8, height: 8, borderRadius: '50%',
                  background: colors.text,
                  boxShadow: `0 0 6px ${colors.text}`,
                }} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
