import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth.jsx'
import MilestonePopup, { checkMilestone } from '../components/MilestonePopup.jsx'
import { BADGES } from '../lib/badges.js'

async function requestGPSPermission() {
  if (!navigator.geolocation) return null
  try {
    const perm = await navigator.permissions.query({ name: 'geolocation' })
    if (perm.state === 'denied') return null
  } catch(e) {}
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
      { timeout: 8000, enableHighAccuracy: true }
    )
  })
}

function getGPS() {
  return requestGPSPermission()
}

function compressImage(file, maxSizeKB = 400) {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      // Redimensionner si trop grande
      let w = img.width, h = img.height
      const maxDim = 1200
      if (w > maxDim || h > maxDim) {
        if (w > h) { h = Math.round(h * maxDim / w); w = maxDim }
        else { w = Math.round(w * maxDim / h); h = maxDim }
      }
      canvas.width = w; canvas.height = h
      ctx.drawImage(img, 0, 0, w, h)
      URL.revokeObjectURL(url)

      // Compresser en JPEG
      let quality = 0.8
      const tryCompress = () => {
        canvas.toBlob(blob => {
          if (blob.size > maxSizeKB * 1024 && quality > 0.3) {
            quality -= 0.1
            tryCompress()
          } else {
            resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }))
          }
        }, 'image/jpeg', quality)
      }
      tryCompress()
    }
    img.src = url
  })
}

async function checkAndUnlockBadges(userId, newProfile, pinte) {
  // Récupérer les badges déjà débloqués
  const { data: existing } = await supabase
    .from('badges_utilisateur')
    .select('badge_id')
    .eq('user_id', userId)
  const existingIds = new Set((existing || []).map(b => b.badge_id))

  // Construire le state pour vérifier les badges
  const hour = new Date(pinte.created_at || Date.now()).getHours()
  const dayOfWeek = new Date().getDay()

  const state = {
    total_perso: newProfile?.total_perso || 0,
    streak: 1, // simplifié
    hasEarlyPost: hour < 10,
    hasNightPost: hour >= 0 && hour < 4,
    hasHappyHour: hour >= 17 && hour < 19,
    hasApero: hour >= 12 && hour < 14,
    nbVilles: 1,
    maxSameLieu: 1,
    hasFriday: dayOfWeek === 5 && hour >= 18,
    weekendPintes: 1,
    firstOfDay: 1,
    canettes: 0,
    pinteMaison: 0,
    referrals: 0,
    isFirst: false,
    hasWhiteNight: hour >= 3 && hour < 5,
    hasGoldenPint: pinte.numero_global === 1000 || pinte.numero_global === 10000,
    chatMessages: 0,
    reactions: 0,
    commentaires: 0,
  }

  const toUnlock = BADGES.filter(b => !existingIds.has(b.id) && b.check(state))
  
  if (toUnlock.length > 0) {
    await supabase.from('badges_utilisateur').insert(
      toUnlock.map(b => ({ user_id: userId, badge_id: b.id }))
    )
  }
}

async function sendNotifNouvellesPintes(userId, username, numeroGlobal, supabaseClient) {
  // Récupérer tous les users qui veulent des notifs de nouvelles pintes (sauf le posteur)
  const { data: profiles } = await supabaseClient
    .from('profiles')
    .select('id')
    .neq('id', userId)

  if (!profiles?.length) return

  // Insérer une notif pour chaque membre
  const notifs = profiles.map(p => ({
    user_id: p.id,
    type: 'nouvelle_pinte',
    titre: `${username} vient de poster !`,
    message: `Nouvelle pinte #${numeroGlobal} dans le groupe 🍺`,
    lien: '/',
  }))

  // Insérer par batch de 50
  for (let i = 0; i < notifs.length; i += 50) {
    await supabaseClient.from('notifications').insert(notifs.slice(i, i + 50))
  }
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

    let coords = null
    if (gpsOn) {
      coords = await getGPS()
      console.log('GPS coords:', coords)
    }

    const { data: numero, error: numError } = await supabase.rpc('next_numero_global')
    if (numError) { setError('Erreur serveur'); setLoading(false); setEtape(''); return }

    // Compresser la photo avant upload
    setEtape('upload')
    const compressed = await compressImage(photo, 400)
    const path = `${user.id}/${Date.now()}.jpg`
    const { error: uploadError } = await supabase.storage.from('pintes').upload(path, compressed)
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

    // Envoyer notifs nouvelle pinte (fire and forget)
    // Notifs nouvelle pinte désactivées (trop de bruit)
    // sendNotifNouvellesPintes(user.id, profile?.username || 'Quelqu\'un', numero, supabase)

    // Vérifier et débloquer les badges
    const updatedProfile = { ...profile, total_perso: newCount }
    await checkAndUnlockBadges(user.id, updatedProfile, {
      numero_global: numero,
      created_at: new Date().toISOString(),
    })

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
