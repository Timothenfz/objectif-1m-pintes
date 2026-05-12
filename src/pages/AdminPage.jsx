import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth.jsx'
import { useNavigate } from 'react-router-dom'

const REASON_LABELS = {
  not_pint: '🍺 Pas une pinte',
  not_beer: '❌ Pas de la bière',
  too_empty: '📉 Verre trop vide',
  selfie: '🤳 Selfie / pas le verre',
  offensive: '🤬 Message offensant',
  other: '… Autre',
}

export default function AdminPage() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [reports, setReports] = useState([])
  const [reportsLoading, setReportsLoading] = useState(true)
  const [zoomedImage, setZoomedImage] = useState(null)

  useEffect(() => {
    if (!profile?.is_admin) { navigate('/'); return }
    fetchStats()
    fetchReports()
  }, [profile])

  async function fetchStats() {
    const [{ count: total }, { count: withPhoto }, { data: storage }] = await Promise.all([
      supabase.from('pintes').select('*', { count: 'exact', head: true }),
      supabase.from('pintes').select('*', { count: 'exact', head: true }).not('photo_url', 'is', null).not('user_id', 'is', null),
      supabase.from('pintes').select('photo_url').not('photo_url', 'is', null).not('user_id', 'is', null).order('numero_global', { ascending: true }).limit(1000),
    ])
    setStats({ total, withPhoto, oldest1000: storage?.length || 0 })
  }

  async function fetchReports() {
    setReportsLoading(true)
    const { data } = await supabase
      .from('reports')
      .select('*, pintes(id, numero_global, photo_url, lieu, profiles(username))')
      .order('created_at', { ascending: false })
      .limit(50)
    setReports(data || [])
    setReportsLoading(false)
  }

  async function ignoreReport(reportId) {
    await supabase.from('reports').update({ status: 'ignored' }).eq('id', reportId)
    setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'ignored' } : r))
  }

  async function deleteReportedPinte(reportId, pinteId) {
    if (!window.confirm('Supprimer cette pinte ? Les numéros seront recalculés.')) return
    await supabase.from('pintes').delete().eq('id', pinteId)
    await supabase.rpc('renumeroter_pintes')
    await supabase.from('reports').update({ status: 'deleted' }).eq('id', reportId)
    setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'deleted' } : r))
    fetchStats()
  }

  async function purgerChat(keepLast) {
    const msg = keepLast === 0
      ? 'Vider entièrement le chat ?'
      : `Garder seulement les ${keepLast} derniers messages ?`
    if (!window.confirm(msg)) return
    setLoading(true); setMsg('')

    if (keepLast === 0) {
      await supabase.from('messages_chat').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    } else {
      const { data: recent } = await supabase
        .from('messages_chat').select('id').order('created_at', { ascending: false }).limit(keepLast)
      const keepIds = (recent || []).map(m => m.id)
      if (keepIds.length > 0) {
        await supabase.from('messages_chat').delete().not('id', 'in', `(${keepIds.map(id => `"${id}"`).join(',')})`)
      }
    }
    setMsg('✓ Chat purgé avec succès.')
    setLoading(false)
  }

  async function purgerPhotos(mode) {
    if (!window.confirm(`Supprimer les photos des ${mode === 'oldest' ? '1000 premières' : 'pintes de plus de 6 mois'} ? Les pintes restent dans le classement.`)) return
    setLoading(true); setMsg('')

    let query = supabase.from('pintes').select('id, photo_url').not('photo_url', 'is', null).not('user_id', 'is', null)

    if (mode === 'oldest') {
      query = query.order('numero_global', { ascending: true }).limit(1000)
    } else {
      const sixMonthsAgo = new Date()
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
      query = query.lt('created_at', sixMonthsAgo.toISOString())
    }

    const { data: pintes } = await query
    if (!pintes?.length) { setMsg('Aucune photo à supprimer.'); setLoading(false); return }

    const paths = pintes
      .map(p => p.photo_url?.split('/pintes/')[1])
      .filter(Boolean)

    if (paths.length) {
      await supabase.storage.from('pintes').remove(paths)
    }

    const ids = pintes.map(p => p.id)
    for (let i = 0; i < ids.length; i += 100) {
      await supabase.from('pintes').update({ photo_url: null }).in('id', ids.slice(i, i + 100))
    }

    setMsg(`✓ ${pintes.length} photos supprimées, données conservées.`)
    setLoading(false)
    fetchStats()
  }

  if (!profile?.is_admin) return null

  const pendingReports = reports.filter(r => r.status === 'new')
  const resolvedReports = reports.filter(r => r.status !== 'new')

  return (
    <div style={{ minHeight: '100dvh', paddingBottom: 100, background: 'var(--bg)' }}>

      {/* Modale zoom image */}
      {zoomedImage && (
        <div
          onClick={() => setZoomedImage(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)',
            zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 16,
          }}
        >
          <img
            src={zoomedImage}
            alt="Aperçu"
            style={{ maxWidth: '100%', maxHeight: '90dvh', borderRadius: 12, objectFit: 'contain' }}
          />
          <button
            onClick={() => setZoomedImage(null)}
            style={{
              position: 'absolute', top: 16, right: 16,
              width: 36, height: 36, borderRadius: '50%',
              background: 'rgba(255,255,255,0.15)', border: 'none',
              color: '#fff', fontSize: 18, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >✕</button>
        </div>
      )}
      <div style={{ padding: '52px 16px 20px' }}>
        <div style={{ fontFamily: 'Bebas Neue,sans-serif', fontSize: 32, color: 'var(--am)' }}>⚡ ADMIN</div>
        <div style={{ fontSize: 12, color: 'var(--tx2)', marginTop: 2 }}>Panneau d'administration</div>
      </div>

      <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* ── SIGNALEMENTS ── */}
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontFamily: 'Bebas Neue,sans-serif', fontSize: 18, color: 'var(--tx)' }}>
              🚩 SIGNALEMENTS
            </div>
            {pendingReports.length > 0 && (
              <div style={{
                background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
                color: '#f87171', borderRadius: 20, fontSize: 12, fontWeight: 600,
                padding: '2px 10px',
              }}>
                {pendingReports.length} en attente
              </div>
            )}
          </div>

          {reportsLoading ? (
            <div style={{ fontSize: 13, color: 'var(--tx2)', textAlign: 'center', padding: '20px 0' }}>Chargement…</div>
          ) : reports.length === 0 ? (
            <div style={{ fontSize: 13, color: 'var(--tx2)', textAlign: 'center', padding: '20px 0' }}>
              Aucun signalement pour le moment ✅
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* En attente */}
              {pendingReports.map(report => {
                const pinte = report.pintes
                return (
                  <div key={report.id} style={{
                    background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)',
                    borderRadius: 12, padding: '12px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <span style={{
                        background: 'rgba(239,68,68,0.15)', color: '#f87171',
                        borderRadius: 20, fontSize: 11, padding: '2px 8px', fontWeight: 500,
                      }}>Nouveau</span>
                      <span style={{ fontSize: 12, color: 'var(--tx2)' }}>
                        {REASON_LABELS[report.reason] || report.reason}
                      </span>
                    </div>
                    {pinte ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                        {pinte.photo_url ? (
                          <img
                            src={pinte.photo_url}
                            alt=""
                            onClick={() => setZoomedImage(pinte.photo_url)}
                            style={{ width: 52, height: 52, borderRadius: 8, objectFit: 'cover', flexShrink: 0, cursor: 'zoom-in' }}
                            title="Cliquer pour agrandir"
                          />
                        ) : (
                          <div style={{ width: 52, height: 52, borderRadius: 8, background: 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>🍺</div>
                        )}
                        <div>
                          <div style={{ fontSize: 13, color: 'var(--tx)', fontWeight: 500 }}>
                            Pinte #{pinte.numero_global}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--tx2)' }}>
                            {pinte.profiles?.username || 'Anonyme'}{pinte.lieu ? ` · ${pinte.lieu}` : ''}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div style={{ fontSize: 12, color: 'var(--tx2)', marginBottom: 10 }}>Pinte introuvable (déjà supprimée ?)</div>
                    )}
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => ignoreReport(report.id)}
                        style={{
                          flex: 1, padding: '9px', borderRadius: 8, cursor: 'pointer',
                          background: 'var(--bg3)', border: '1px solid var(--border)',
                          color: 'var(--tx2)', fontSize: 12,
                        }}
                      >
                        👁 Ignorer
                      </button>
                      {pinte && (
                        <button
                          onClick={() => deleteReportedPinte(report.id, pinte.id)}
                          style={{
                            flex: 1, padding: '9px', borderRadius: 8, cursor: 'pointer',
                            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                            color: '#f87171', fontSize: 12, fontWeight: 500,
                          }}
                        >
                          🗑 Supprimer la pinte
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}

              {/* Résolus (repliables) */}
              {resolvedReports.length > 0 && (
                <details style={{ marginTop: 4 }}>
                  <summary style={{ fontSize: 12, color: 'var(--tx2)', cursor: 'pointer', padding: '4px 0' }}>
                    {resolvedReports.length} signalement{resolvedReports.length > 1 ? 's' : ''} traité{resolvedReports.length > 1 ? 's' : ''}
                  </summary>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                    {resolvedReports.map(report => {
                      const pinte = report.pintes
                      const isDeleted = report.status === 'deleted'
                      return (
                        <div key={report.id} style={{
                          background: 'var(--bg3)', border: '1px solid var(--border)',
                          borderRadius: 10, padding: '10px', opacity: 0.6,
                        }}>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <span style={{
                              background: isDeleted ? 'rgba(245,166,35,0.15)' : 'var(--bg2)',
                              color: isDeleted ? 'var(--am)' : 'var(--tx2)',
                              borderRadius: 20, fontSize: 10, padding: '2px 8px',
                            }}>
                              {isDeleted ? '🗑 Supprimé' : '✓ Ignoré'}
                            </span>
                            <span style={{ fontSize: 11, color: 'var(--tx2)' }}>
                              {REASON_LABELS[report.reason] || report.reason}
                              {pinte ? ` · Pinte #${pinte.numero_global}` : ''}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </details>
              )}
            </div>
          )}

          <button
            onClick={fetchReports}
            style={{
              marginTop: 12, width: '100%', padding: '9px',
              background: 'var(--bg3)', border: '1px solid var(--border)',
              borderRadius: 8, color: 'var(--tx2)', fontSize: 12, cursor: 'pointer',
            }}
          >
            ↺ Actualiser les signalements
          </button>
        </div>

        {/* ── STOCKAGE ── */}
        {stats && (
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px' }}>
            <div style={{ fontFamily: 'Bebas Neue,sans-serif', fontSize: 18, color: 'var(--tx)', marginBottom: 12 }}>STOCKAGE PHOTOS</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div style={{ background: 'var(--bg3)', borderRadius: 10, padding: '10px', textAlign: 'center' }}>
                <div style={{ fontFamily: 'Bebas Neue,sans-serif', fontSize: 24, color: 'var(--am)' }}>{stats.total}</div>
                <div style={{ fontSize: 10, color: 'var(--tx2)' }}>Pintes total</div>
              </div>
              <div style={{ background: 'var(--bg3)', borderRadius: 10, padding: '10px', textAlign: 'center' }}>
                <div style={{ fontFamily: 'Bebas Neue,sans-serif', fontSize: 24, color: 'var(--am)' }}>{stats.withPhoto}</div>
                <div style={{ fontSize: 10, color: 'var(--tx2)' }}>Avec photo</div>
              </div>
            </div>
            <div style={{ marginTop: 8, fontSize: 11, color: 'var(--tx2)', textAlign: 'center' }}>
              ~{Math.round(stats.withPhoto * 0.4)}MB estimés · Supabase gratuit : 1000MB
            </div>
          </div>
        )}

        {/* ── PURGE PHOTOS ── */}
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px' }}>
          <div style={{ fontFamily: 'Bebas Neue,sans-serif', fontSize: 18, color: 'var(--tx)', marginBottom: 6 }}>PURGER LES PHOTOS</div>
          <div style={{ fontSize: 12, color: 'var(--tx2)', marginBottom: 14, lineHeight: 1.5 }}>
            Les pintes restent dans le classement et le compteur. Seules les images sont supprimées pour libérer de l'espace.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button onClick={() => purgerPhotos('oldest')} disabled={loading} style={{
              padding: '13px', background: 'rgba(245,166,35,0.1)',
              border: '1px solid rgba(245,166,35,0.3)', borderRadius: 10,
              color: 'var(--am)', fontSize: 13, fontFamily: 'DM Sans,sans-serif',
              cursor: 'pointer', textAlign: 'left',
            }}>
              <div style={{ fontWeight: 500 }}>🗑 Supprimer les 1000 premières photos</div>
              <div style={{ fontSize: 11, opacity: 0.7, marginTop: 3 }}>Les pintes avec le plus petit numéro global</div>
            </button>
            <button onClick={() => purgerPhotos('old')} disabled={loading} style={{
              padding: '13px', background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10,
              color: '#f87171', fontSize: 13, fontFamily: 'DM Sans,sans-serif',
              cursor: 'pointer', textAlign: 'left',
            }}>
              <div style={{ fontWeight: 500 }}>🗑 Supprimer les photos de plus de 6 mois</div>
              <div style={{ fontSize: 11, opacity: 0.7, marginTop: 3 }}>Libère l'espace des anciennes pintes</div>
            </button>
          </div>
          {loading && <div style={{ marginTop: 10, fontSize: 13, color: 'var(--tx2)' }}>Suppression en cours...</div>}
          {msg && <div style={{ marginTop: 10, fontSize: 13, color: '#4ade80' }}>{msg}</div>}
        </div>

        {/* ── MODÉRATION ── */}
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px' }}>
          <div style={{ fontFamily: 'Bebas Neue,sans-serif', fontSize: 18, color: 'var(--tx)', marginBottom: 6 }}>MODÉRATION</div>
          <div style={{ fontSize: 12, color: 'var(--tx2)', marginBottom: 10 }}>
            Le bouton 🗑 est visible sur chaque pinte du feed et chaque message du chat quand tu es admin.
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => navigate('/')} style={{
              flex: 1, padding: '12px', background: 'var(--bg3)', border: '1px solid var(--border)',
              borderRadius: 10, color: 'var(--tx)', fontSize: 13,
              fontFamily: 'DM Sans,sans-serif', cursor: 'pointer',
            }}>
              Feed →
            </button>
            <button onClick={() => navigate('/chat')} style={{
              flex: 1, padding: '12px', background: 'var(--bg3)', border: '1px solid var(--border)',
              borderRadius: 10, color: 'var(--tx)', fontSize: 13,
              fontFamily: 'DM Sans,sans-serif', cursor: 'pointer',
            }}>
              Chat →
            </button>
          </div>
        </div>

        {/* ── PURGE CHAT ── */}
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px' }}>
          <div style={{ fontFamily: 'Bebas Neue,sans-serif', fontSize: 18, color: 'var(--tx)', marginBottom: 6 }}>PURGER LE CHAT</div>
          <div style={{ fontSize: 12, color: 'var(--tx2)', marginBottom: 14, lineHeight: 1.5 }}>
            Supprime les anciens messages pour alléger le chat. Les photos uploadées dans le chat sont aussi supprimées.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button onClick={() => purgerChat(100)} disabled={loading} style={{
              padding: '13px', background: 'rgba(245,166,35,0.1)',
              border: '1px solid rgba(245,166,35,0.3)', borderRadius: 10,
              color: 'var(--am)', fontSize: 13, fontFamily: 'DM Sans,sans-serif',
              cursor: 'pointer', textAlign: 'left',
            }}>
              <div style={{ fontWeight: 500 }}>🗑 Garder les 100 derniers messages</div>
              <div style={{ fontSize: 11, opacity: 0.7, marginTop: 3 }}>Supprime tous les messages plus anciens</div>
            </button>
            <button onClick={() => purgerChat(0)} disabled={loading} style={{
              padding: '13px', background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10,
              color: '#f87171', fontSize: 13, fontFamily: 'DM Sans,sans-serif',
              cursor: 'pointer', textAlign: 'left',
            }}>
              <div style={{ fontWeight: 500 }}>🗑 Vider entièrement le chat</div>
              <div style={{ fontSize: 11, opacity: 0.7, marginTop: 3 }}>Supprime tous les messages sans exception</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
