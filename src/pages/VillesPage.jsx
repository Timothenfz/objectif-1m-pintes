import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const FLAGS = {
  'Paris': '🗼', 'Lyon': '🦁', 'Marseille': '⚓', 'Bordeaux': '🍷',
  'Annecy': '🏔', 'Grenoble': '⛷', 'Toulouse': '🌹', 'Nice': '☀️',
  'Nantes': '🐘', 'Lille': '🍟', 'Strasbourg': '🥨', 'Montpellier': '🌊',
  'Rennes': '🏴', 'Dijon': '🥗', 'Cluny': '⛪',
}

function getFlag(ville) {
  for (const [k, v] of Object.entries(FLAGS)) {
    if (ville?.toLowerCase().includes(k.toLowerCase())) return v
  }
  return '📍'
}

export default function VillesPage() {
  const [villes, setVilles] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchVilles() }, [])

  async function fetchVilles() {
    const { data } = await supabase
      .from('classement_villes')
      .select('*')
      .order('total_pintes', { ascending: false })
      .limit(30)
    setVilles(data || [])
    setLoading(false)
  }

  const max = villes[0]?.total_pintes || 1

  return (
    <div style={{ minHeight: '100dvh', paddingBottom: 90 }}>
      <div style={{ padding: '56px 20px 20px' }}>
        <h2 style={{ fontSize: 36, fontFamily: 'Bebas Neue, sans-serif', color: 'var(--tx)' }}>VILLES</h2>
        <p style={{ fontSize: 13, color: 'var(--tx2)', marginTop: 2 }}>
          Classement des villes les plus assoiffées
        </p>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--tx2)' }}>Chargement...</div>
      ) : villes.length === 0 ? (
        <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--tx2)' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🗺</div>
          <p style={{ fontSize: 14 }}>Aucune ville renseignée pour l'instant.</p>
          <p style={{ fontSize: 12, marginTop: 6 }}>Ajoute ta ville dans ton profil !</p>
        </div>
      ) : (
        <div style={{ padding: '0 16px' }}>
          {/* Podium top 3 */}
          {villes.length >= 3 && (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginBottom: 20, justifyContent: 'center' }}>
              {[villes[1], villes[0], villes[2]].map((v, i) => {
                const heights = [120, 150, 100]
                const colors = ['#888780', '#f5a623', '#c4841a']
                const labels = ['🥈', '🥇', '🥉']
                return (
                  <div key={v.ville} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--tx2)', textAlign: 'center' }}>{v.ville}</div>
                    <div style={{ fontSize: 20 }}>{getFlag(v.ville)}</div>
                    <div style={{ fontSize: 16, color: colors[i], fontFamily: 'Bebas Neue, sans-serif' }}>{v.total_pintes} 🍺</div>
                    <div style={{
                      width: '100%', height: heights[i],
                      background: `rgba(${i === 1 ? '245,166,35' : '255,255,255'},0.08)`,
                      border: `1px solid rgba(${i === 1 ? '245,166,35' : '255,255,255'},0.15)`,
                      borderRadius: '8px 8px 0 0',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 22,
                    }}>
                      {labels[i]}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Liste complète */}
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
            {villes.map((v, i) => (
              <div key={v.ville} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 16px',
                borderBottom: i < villes.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
              }}>
                <div style={{ width: 24, textAlign: 'center', fontFamily: 'Bebas Neue, sans-serif', fontSize: 14, color: 'var(--tx2)', flexShrink: 0 }}>
                  {i < 3 ? ['🥇','🥈','🥉'][i] : i + 1}
                </div>
                <div style={{ fontSize: 20, flexShrink: 0 }}>{getFlag(v.ville)}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--tx)' }}>{v.ville}</div>
                  <div style={{ height: 3, background: 'var(--bg3)', borderRadius: 2, marginTop: 5 }}>
                    <div style={{ height: 3, borderRadius: 2, background: '#f5a623', width: `${Math.round(v.total_pintes / max * 100)}%`, transition: 'width .5s ease' }} />
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--tx2)', marginTop: 3 }}>
                    {v.nb_membres} membre{v.nb_membres > 1 ? 's' : ''}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 22, color: i === 0 ? '#f5a623' : '#ede9e0', lineHeight: 1 }}>{v.total_pintes}</div>
                  <div style={{ fontSize: 10, color: 'var(--tx2)' }}>pintes</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
