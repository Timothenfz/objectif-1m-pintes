import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth.jsx'
import { useNavigate } from 'react-router-dom'

export default function AdminPage() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    if (!profile?.is_admin) { navigate('/'); return }
    fetchStats()
  }, [profile])

  async function fetchStats() {
    const [{ count: total }, { count: withPhoto }, { data: storage }] = await Promise.all([
      supabase.from('pintes').select('*', { count: 'exact', head: true }),
      supabase.from('pintes').select('*', { count: 'exact', head: true }).not('photo_url', 'is', null).not('user_id', 'is', null),
      supabase.from('pintes').select('photo_url').not('photo_url', 'is', null).not('user_id', 'is', null).order('numero_global', { ascending: true }).limit(1000),
    ])
    setStats({ total, withPhoto, oldest1000: storage?.length || 0 })
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

    // Supprimer les fichiers du storage
    const paths = pintes
      .map(p => p.photo_url?.split('/pintes/')[1])
      .filter(Boolean)
    
    if (paths.length) {
      await supabase.storage.from('pintes').remove(paths)
    }

    // Mettre photo_url à null dans la DB
    const ids = pintes.map(p => p.id)
    for (let i = 0; i < ids.length; i += 100) {
      await supabase.from('pintes').update({ photo_url: null }).in('id', ids.slice(i, i + 100))
    }

    setMsg(`✓ ${pintes.length} photos supprimées, données conservées.`)
    setLoading(false)
    fetchStats()
  }

  if (!profile?.is_admin) return null

  return (
    <div style={{ minHeight: '100dvh', paddingBottom: 100, background: 'var(--bg)' }}>
      <div style={{ padding: '52px 16px 20px' }}>
        <div style={{ fontFamily: 'Bebas Neue,sans-serif', fontSize: 32, color: 'var(--am)' }}>⚡ ADMIN</div>
        <div style={{ fontSize: 12, color: 'var(--tx2)', marginTop: 2 }}>Panneau d'administration</div>
      </div>

      <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Stats stockage */}
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

        {/* Purge photos */}
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

        {/* Raccourci vers feed pour supprimer pintes individuelles */}
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

        {/* Purge chat */}
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
