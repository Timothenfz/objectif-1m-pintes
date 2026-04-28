import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth.jsx'

const DEFIS_STATIC = [
  {
    id: 'defi-1', titre: '5 pintes cette semaine', description: 'Poste au moins 5 pintes avant dimanche soir',
    type: 'nb_pintes', objectif: 5, emoji: '🍺', difficulte: 'Facile',
  },
  {
    id: 'defi-2', titre: 'Pinte avant 12h', description: 'Poste une pinte avant midi un jour de cette semaine',
    type: 'heure', objectif: 1, emoji: '☀️', difficulte: 'Moyen',
  },
  {
    id: 'defi-3', titre: '3 jours consécutifs', description: 'Poste une pinte 3 jours d\'affilée',
    type: 'streak', objectif: 3, emoji: '🔥', difficulte: 'Moyen',
  },
  {
    id: 'defi-4', titre: 'Pinte dans 2 villes', description: 'Poste depuis 2 villes différentes cette semaine',
    type: 'nb_villes', objectif: 2, emoji: '🗺', difficulte: 'Difficile',
  },
  {
    id: 'defi-5', titre: 'Pinte après minuit', description: 'Poste une pinte entre minuit et 4h du matin',
    type: 'heure', objectif: 1, emoji: '🌙', difficulte: 'Rare',
  },
  {
    id: 'defi-6', titre: '10 pintes cette semaine', description: 'Le défi ultime de la semaine',
    type: 'nb_pintes', objectif: 10, emoji: '👑', difficulte: 'Épique',
  },
]

const DIFF_COLORS = {
  'Facile': { bg: 'rgba(34,197,94,0.1)', color: '#4ade80' },
  'Moyen': { bg: 'rgba(245,166,35,0.1)', color: 'var(--am)' },
  'Difficile': { bg: 'rgba(129,140,248,0.1)', color: '#818cf8' },
  'Rare': { bg: 'rgba(239,68,68,0.1)', color: '#f87171' },
  'Épique': { bg: 'rgba(245,166,35,0.15)', color: '#ffc85a' },
}

export default function DefiPage() {
  const { user, profile } = useAuth()
  const [progres, setProgres] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (profile) fetchProgres() }, [profile])

  async function fetchProgres() {
    // Calculer le progres de la semaine
    const monday = new Date()
    monday.setDate(monday.getDate() - monday.getDay() + 1)
    monday.setHours(0, 0, 0, 0)

    const { data: pintesWeek } = await supabase
      .from('pintes')
      .select('created_at, lieu, latitude, longitude')
      .eq('user_id', user.id)
      .gte('created_at', monday.toISOString())

    const nb = pintesWeek?.length || 0
    const villes = new Set((pintesWeek || []).map(p => p.lieu).filter(Boolean)).size
    const hasEarly = (pintesWeek || []).some(p => new Date(p.created_at).getHours() < 12)
    const hasNight = (pintesWeek || []).some(p => {
      const h = new Date(p.created_at).getHours()
      return h >= 0 && h < 4
    })

    // Streak
    const { data: allPintes } = await supabase
      .from('pintes').select('created_at').eq('user_id', user.id).order('created_at', { ascending: false })
    let streak = 0
    if (allPintes?.length) {
      const days = new Set(allPintes.map(p => new Date(p.created_at).toDateString()))
      const today = new Date()
      for (let i = 0; i < 30; i++) {
        const d = new Date(today)
        d.setDate(today.getDate() - i)
        if (days.has(d.toDateString())) streak++
        else break
      }
    }

    setProgres({
      'defi-1': Math.min(nb, 5),
      'defi-2': hasEarly ? 1 : 0,
      'defi-3': Math.min(streak, 3),
      'defi-4': Math.min(villes, 2),
      'defi-5': hasNight ? 1 : 0,
      'defi-6': Math.min(nb, 10),
    })
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100dvh', paddingBottom: 100, background: 'var(--bg)' }}>
      <div style={{ padding: '52px 16px 16px' }}>
        <div style={{ fontFamily: 'Bebas Neue,sans-serif', fontSize: 32, color: 'var(--tx)' }}>DÉFIS</div>
        <div style={{ fontSize: 11, color: 'var(--tx2)', marginTop: 2 }}>
          Défis de la semaine · Se réinitialisent le lundi
        </div>
      </div>

      <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {DEFIS_STATIC.map(defi => {
          const p = progres[defi.id] || 0
          const done = p >= defi.objectif
          const pct = Math.min(Math.round(p / defi.objectif * 100), 100)
          const diff = DIFF_COLORS[defi.difficulte]

          return (
            <div key={defi.id} style={{
              background: done ? 'rgba(34,197,94,0.06)' : 'var(--card-bg)',
              border: `1px solid ${done ? 'rgba(34,197,94,0.25)' : 'var(--border)'}`,
              borderRadius: 14, padding: '14px 16px',
              opacity: loading ? 0.5 : 1,
              transition: 'all .2s',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ fontSize: 32, lineHeight: 1, filter: done ? 'none' : 'grayscale(0.3)' }}>{defi.emoji}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: done ? '#4ade80' : 'var(--tx)' }}>{defi.titre}</div>
                    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: diff.bg, color: diff.color, flexShrink: 0, marginLeft: 8 }}>
                      {defi.difficulte}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--tx2)', marginBottom: 10, lineHeight: 1.4 }}>{defi.description}</div>
                  <div style={{ height: 6, background: 'var(--bg3)', borderRadius: 3, overflow: 'hidden', marginBottom: 6 }}>
                    <div style={{
                      height: 6, borderRadius: 3,
                      background: done ? '#22c55e' : 'var(--am)',
                      width: `${pct}%`, transition: 'width .5s ease',
                    }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: 11, color: 'var(--tx2)' }}>
                      {p} / {defi.objectif}
                    </div>
                    {done && <div style={{ fontSize: 11, color: '#4ade80', fontWeight: 500 }}>✓ Complété !</div>}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
