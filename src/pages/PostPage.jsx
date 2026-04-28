import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth.jsx'
import MilestonePopup, { checkMilestone } from '../components/MilestonePopup.jsx'

function getGPS() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) { resolve(null); return }
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
      { timeout: 5000 }
    )
  })
}

const RULES = [
  { icon: '🍺', text: 'La pinte est bien dans un verre à bière' },
  { icon: '📸', text: 'Pas de selfie — la boisson est au premier plan' },
  { icon: '🚫', text: 'Pas de soda, vin ou autre boisson' },
  { icon: '✅', text: 'Le verre est au moins partiellement rempli' },
]

export default function PostPage() {
  const [photo, setPhoto] = useState(null)
  const [preview, setPreview] = useState(null)
  const [lieu, setLieu] = useState('')
  const [loading, setLoading] = useState(false)
  const [etape, setEtape] = useState('')
  const [error, setError] = useState('')
  const [gpsOn, setGpsOn] = useState(true)
  const [showConfirm, setShowConfirm] = useState(false)
  const [milestone, setMilestone] = useState(null)
  const fileRef = useRef()
  const navigate = useNavigate()
  const { user, profile, fetchProfile } = useAuth()

  async function handlePhoto(e) {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) { setError('Photo trop lourde (max 10MB)'); return }
    setError(''); setPhoto(file)
    const r = new FileReader()
    r.onload = () => setPreview(r.result)
    r.readAsDataURL(file)
  }

  async function confirmerPost() {
    setShowConfirm(false)
    setLoading(true); setError('')

    setEtape('upload')
    let coords = null
    if (gpsOn) coords = await getGPS()

    const { data: numero, error: numError } = await supabase.rpc('next_numero_global')
    if (numError) { setError('Erreur serveur'); setLoading(false); setEtape(''); return }

    const ext = photo.name.split('.').pop()
    const path = `${user.id}/${Date.now()}.${ext}`
    const { error: uploadError } = await supabase.storage.from('pintes').upload(path, photo)
    if (uploadError) { setError(uploadError.message); setLoading(false); setEtape(''); return }
    const { data: { publicUrl } } = supabase.storage.from('pintes').getPublicUrl(path)

    const { error: insertError } = await supabase.from('pintes').insert({
      user_id: user.id,
      numero_global: numero,
      lieu: lieu.trim() || null,
      photo_url: publicUrl,
      latitude: coords?.lat || null,
      longitude: coords?.lng || null,
    })
    if (insertError) { setError(insertError.message); setLoading(false); setEtape(''); return }

    const prevCount = profile?.total_perso || 0
    await fetchProfile(user.id)
    const newCount = prevCount + 1
    const hit = checkMilestone(prevCount, newCount)
    if (hit) setMilestone(hit)
    setEtape('done')
    setTimeout(() => { if (!hit) navigate('/') }, 1000)
    setLoading(false)
  }

  const etapeLabel = { upload: 'Upload en cours...', done: 'Pinte postée !' }

  return (
    <div style={{ minHeight: '100dvh', paddingBottom: 100, background: 'var(--bg)' }}>
      <div style={{ padding: '52px 16px 16px' }}>
        <div style={{ fontFamily: 'Bebas Neue,sans-serif', fontSize: 32, color: 'var(--tx)' }}>POSTER</div>
        <div style={{ fontSize: 12, color: 'var(--tx2)', marginTop: 2 }}>
          Tu en es à <span style={{ color: 'var(--am)', fontWeight: 500 }}>{profile?.total_perso || 0}</span> pintes · numéro attribué automatiquement
        </div>
      </div>

      <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 13 }}>
        {/* Zone photo */}
        <div onClick={() => !loading && fileRef.current?.click()} style={{
          position: 'relative', aspectRatio: '4/3', borderRadius: 18, overflow: 'hidden',
          border: preview ? 'none' : '2px dashed var(--border2)',
          background: preview ? 'transparent' : 'var(--card-bg)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: loading ? 'default' : 'pointer',
        }}>
          {preview ? (
            <>
              <img src={preview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              {!loading && (
                <div style={{ position: 'absolute', bottom: 10, right: 10, background: 'rgba(0,0,0,0.6)', borderRadius: 8, padding: '5px 10px', fontSize: 11, color: 'white', cursor: 'pointer' }}
                  onClick={e => { e.stopPropagation(); setPhoto(null); setPreview(null); fileRef.current?.click() }}>
                  Changer la photo
                </div>
              )}
              {loading && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                  <div style={{ width: 30, height: 30, borderRadius: '50%', border: '2px solid rgba(255,255,255,.2)', borderTopColor: 'var(--am)', animation: 'spin .7s linear infinite' }} />
                  <span style={{ color: 'white', fontSize: 12 }}>{etapeLabel[etape]}</span>
                </div>
              )}
            </>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--tx2)' }}>
              <div style={{ fontSize: 44, marginBottom: 8 }}>📸</div>
              <div style={{ fontSize: 13 }}>Appuie pour ajouter une photo</div>
              <div style={{ fontSize: 10, marginTop: 4, opacity: 0.5 }}>JPG, PNG · max 10MB</div>
            </div>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handlePhoto} style={{ display: 'none' }} />

        {/* Lieu */}
        <div>
          <div style={{ fontSize: 12, color: 'var(--tx2)', marginBottom: 6 }}>Lieu (optionnel)</div>
          <input value={lieu} onChange={e => setLieu(e.target.value)} placeholder="ex: Le Moloko, Lyon" disabled={loading}
            style={{ width: '100%', padding: '11px 13px', background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--tx)', fontSize: 13, fontFamily: 'DM Sans,sans-serif', outline: 'none' }} />
        </div>

        {/* GPS toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 13px', background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 10 }}>
          <div>
            <div style={{ fontSize: 13, color: 'var(--tx)' }}>📍 Partager ma position</div>
            <div style={{ fontSize: 11, color: 'var(--tx2)', marginTop: 2 }}>Apparaître sur la carte des pintes</div>
          </div>
          <div onClick={() => setGpsOn(g => !g)} style={{ width: 44, height: 26, borderRadius: 13, background: gpsOn ? 'var(--am)' : 'var(--bg3)', position: 'relative', cursor: 'pointer', transition: 'background .2s' }}>
            <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'white', position: 'absolute', top: 3, left: gpsOn ? 21 : 3, transition: 'left .2s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }} />
          </div>
        </div>

        {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '11px 13px', fontSize: 13, color: '#f87171' }}>{error}</div>}

        <button onClick={() => { if (!photo) { setError('Ajoute une photo !'); return } setShowConfirm(true) }}
          disabled={loading}
          style={{
            padding: '15px 0',
            background: etape === 'done' ? '#22c55e' : (!photo || loading) ? 'var(--bg3)' : 'var(--am)',
            color: (!photo || loading) ? 'var(--tx2)' : '#0d0d0d',
            borderRadius: 12, fontFamily: 'Bebas Neue,sans-serif', fontSize: 21, letterSpacing: '.05em',
            border: 'none', transition: 'all .2s', cursor: loading ? 'default' : 'pointer',
            boxShadow: photo && !loading ? '0 4px 18px rgba(245,166,35,0.3)' : 'none',
          }}>
          {loading ? (etapeLabel[etape] || '...') : etape === 'done' ? '🍺 PINTE POSTÉE !' : '🍺 VALIDER MA PINTE'}
        </button>
        <p style={{ fontSize: 10, color: 'var(--tx3)', textAlign: 'center' }}>Le numéro est attribué automatiquement par le serveur</p>
      </div>

      {/* Modale confirmation */}
      {showConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', alignItems: 'flex-end' }}
          onClick={() => setShowConfirm(false)}>
          <div style={{
            width: '100%', background: 'var(--card-bg)',
            borderRadius: '20px 20px 0 0',
            border: '1px solid var(--border2)',
            padding: '24px 20px 36px',
            animation: 'slideUp .25s ease',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ fontFamily: 'Bebas Neue,sans-serif', fontSize: 22, color: 'var(--tx)', marginBottom: 16 }}>
              T'as bien respecté les règles ? 🍺
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 22 }}>
              {RULES.map((r, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 13px', background: 'var(--bg3)', borderRadius: 10 }}>
                  <span style={{ fontSize: 18 }}>{r.icon}</span>
                  <span style={{ fontSize: 13, color: 'var(--tx)' }}>{r.text}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowConfirm(false)} style={{
                flex: 1, padding: '13px 0',
                background: 'var(--bg3)', border: '1px solid var(--border)',
                borderRadius: 12, color: 'var(--tx2)', fontSize: 14,
                fontFamily: 'DM Sans,sans-serif', cursor: 'pointer',
              }}>Annuler</button>
              <button onClick={confirmerPost} style={{
                flex: 2, padding: '13px 0',
                background: 'var(--am)', border: 'none',
                borderRadius: 12, color: '#0d0d0d',
                fontFamily: 'Bebas Neue,sans-serif', fontSize: 20,
                letterSpacing: '.05em', cursor: 'pointer',
              }}>OUI, VALIDER !</button>
            </div>
          </div>
        </div>
      )}
      <MilestonePopup milestone={milestone} onClose={() => { setMilestone(null); navigate('/') }} />

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes slideUp { from { transform: translateY(100%) } to { transform: translateY(0) } }
      `}</style>
    </div>
  )
}
