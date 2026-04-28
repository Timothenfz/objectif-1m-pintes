import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth.jsx'

const PROMPT_IA = `Tu es le modérateur automatique de l'app "Objectif 1 Million de Pintes".
Analyse cette photo et réponds UNIQUEMENT en JSON valide, sans markdown, sans explication.

ACCEPTÉ si la photo montre :
- Une bière servie dans un verre (demi, pinte, chope, verre à bière)
- Une bière en canette ou bouteille (toléré si clairement une bière)
- Une pinte maison dans un verre à pinte

REFUSÉ si :
- Un selfie (visage au premier plan)
- Pas de bière (cocktail, vin, café, soda, eau, verre vide, photo floue)
- Bière dans un contenant inadapté (verre à vin, tasse, mug)
- Aucune boisson visible

Réponds avec ce JSON exact :
{"valide":true,"raison":"explication courte max 15 mots","type_boisson":"ce que tu vois"}`

async function analyserPhoto(base64Image) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 200,
      messages: [{ role: 'user', content: [
        { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: base64Image } },
        { type: 'text', text: PROMPT_IA }
      ]}]
    })
  })
  const data = await response.json()
  const text = data.content?.[0]?.text || '{}'
  try { return JSON.parse(text.replace(/```json|```/g, '').trim()) }
  catch { return { valide: false, raison: "Analyse impossible, réessaie", type_boisson: '' } }
}

function toBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result.split(',')[1])
    r.onerror = reject
    r.readAsDataURL(file)
  })
}

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

export default function PostPage() {
  const [photo, setPhoto] = useState(null)
  const [preview, setPreview] = useState(null)
  const [lieu, setLieu] = useState('')
  const [loading, setLoading] = useState(false)
  const [analyse, setAnalyse] = useState(null)
  const [etape, setEtape] = useState('')
  const [error, setError] = useState('')
  const [gpsOn, setGpsOn] = useState(true)
  const fileRef = useRef()
  const navigate = useNavigate()
  const { user, profile, fetchProfile } = useAuth()

  async function handlePhoto(e) {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) { setError('Photo trop lourde (max 10MB)'); return }
    setError(''); setAnalyse(null); setPhoto(file)
    const r = new FileReader()
    r.onload = () => setPreview(r.result)
    r.readAsDataURL(file)
  }

  async function handleSubmit() {
    if (!photo) { setError('Ajoute une photo !'); return }
    setLoading(true); setError(''); setAnalyse(null)

    // 1. Analyse IA
    setEtape('analyse')
    let result
    try {
      const b64 = await toBase64(photo)
      result = await analyserPhoto(b64)
      setAnalyse(result)
    } catch {
      setAnalyse({ valide: false, raison: "Erreur lors de l'analyse IA", type_boisson: '' })
      setLoading(false); setEtape(''); return
    }
    if (!result.valide) { setLoading(false); setEtape(''); return }

    // 2. GPS
    setEtape('upload')
    let coords = null
    if (gpsOn) coords = await getGPS()

    // 3. Numéro auto
    const { data: numero, error: numError } = await supabase.rpc('next_numero_global')
    if (numError) { setError('Erreur serveur'); setLoading(false); setEtape(''); return }

    // 4. Upload photo
    const ext = photo.name.split('.').pop()
    const path = `${user.id}/${Date.now()}.${ext}`
    const { error: uploadError } = await supabase.storage.from('pintes').upload(path, photo)
    if (uploadError) { setError(uploadError.message); setLoading(false); setEtape(''); return }
    const { data: { publicUrl } } = supabase.storage.from('pintes').getPublicUrl(path)

    // 5. Insert
    const { error: insertError } = await supabase.from('pintes').insert({
      user_id: user.id,
      numero_global: numero,
      lieu: lieu.trim() || null,
      photo_url: publicUrl,
      type_boisson: result.type_boisson || null,
      latitude: coords?.lat || null,
      longitude: coords?.lng || null,
    })
    if (insertError) { setError(insertError.message); setLoading(false); setEtape(''); return }

    await fetchProfile(user.id)
    setEtape('done')
    setTimeout(() => navigate('/'), 1000)
    setLoading(false)
  }

  const etapeLabel = { analyse: 'Analyse IA en cours...', upload: 'Upload en cours...', done: 'Pinte validée !' }

  return (
    <div style={{ minHeight: '100dvh', paddingBottom: 90, background: '#0d0d0d' }}>
      <div style={{ padding: '52px 16px 16px' }}>
        <div style={{ fontFamily: 'Bebas Neue,sans-serif', fontSize: 32, color: '#fffdf5' }}>POSTER</div>
        <div style={{ fontSize: 12, color: '#7a7670', marginTop: 2 }}>
          Tu en es à <span style={{ color: '#f5a623', fontWeight: 500 }}>{profile?.total_perso || 0}</span> pintes · numéro attribué automatiquement
        </div>
      </div>

      <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 13 }}>
        {/* Zone photo */}
        <div onClick={() => !loading && fileRef.current?.click()} style={{
          position: 'relative', aspectRatio: '4/3', borderRadius: 18, overflow: 'hidden',
          border: preview ? 'none' : '2px dashed rgba(255,255,255,0.15)',
          background: preview ? 'transparent' : '#181818',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: loading ? 'default' : 'pointer',
        }}>
          {preview ? (
            <>
              <img src={preview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              {analyse && (
                <div style={{
                  position: 'absolute', top: 10, right: 10, padding: '5px 11px', borderRadius: 20,
                  background: analyse.valide ? 'rgba(34,197,94,0.92)' : 'rgba(239,68,68,0.92)',
                  color: 'white', fontSize: 12, fontWeight: 500,
                }}>
                  {analyse.valide ? '✓ Validée' : '✕ Refusée'}
                </div>
              )}
              {loading && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                  <div style={{ width: 30, height: 30, borderRadius: '50%', border: '2px solid rgba(255,255,255,.2)', borderTopColor: '#f5a623', animation: 'spin .7s linear infinite' }} />
                  <span style={{ color: 'white', fontSize: 12 }}>{etapeLabel[etape]}</span>
                </div>
              )}
            </>
          ) : (
            <div style={{ textAlign: 'center', color: '#7a7670' }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>📸</div>
              <div style={{ fontSize: 13 }}>Appuie pour ajouter une photo</div>
              <div style={{ fontSize: 10, marginTop: 4, opacity: 0.5 }}>Analysée automatiquement par IA</div>
            </div>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handlePhoto} style={{ display: 'none' }} />

        {/* Résultat IA */}
        {analyse && (
          <div style={{
            padding: '11px 13px', borderRadius: 11,
            background: analyse.valide ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
            border: `1px solid ${analyse.valide ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`,
          }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: analyse.valide ? '#4ade80' : '#f87171', marginBottom: 3 }}>
              {analyse.valide ? "🍺 Photo validée par l'IA" : '❌ Photo refusée par l\'IA'}
            </div>
            <div style={{ fontSize: 12, color: '#7a7670' }}>{analyse.raison}</div>
            {analyse.type_boisson && <div style={{ fontSize: 11, color: '#3a3834', marginTop: 3, fontStyle: 'italic' }}>{analyse.type_boisson}</div>}
            {!analyse.valide && (
              <button onClick={() => { setPhoto(null); setPreview(null); setAnalyse(null); fileRef.current?.click() }}
                style={{ marginTop: 7, fontSize: 11, color: '#f5a623', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'DM Sans,sans-serif' }}>
                Reprendre une photo →
              </button>
            )}
          </div>
        )}

        {/* Lieu + GPS */}
        <div>
          <div style={{ fontSize: 12, color: '#7a7670', marginBottom: 6 }}>Lieu (optionnel)</div>
          <input value={lieu} onChange={e => setLieu(e.target.value)} placeholder="ex: Le Moloko, Lyon" disabled={loading}
            style={{ width: '100%', padding: '11px 13px', background: '#181818', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, color: '#ede9e0', fontSize: 13, fontFamily: 'DM Sans,sans-serif', outline: 'none' }} />
        </div>

        {/* Toggle GPS */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: '#181818', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10 }}>
          <div>
            <div style={{ fontSize: 13, color: '#ede9e0' }}>📍 Partager ma position</div>
            <div style={{ fontSize: 11, color: '#7a7670', marginTop: 2 }}>Apparaître sur la carte des pintes</div>
          </div>
          <div onClick={() => setGpsOn(g => !g)} style={{
            width: 44, height: 26, borderRadius: 13,
            background: gpsOn ? '#f5a623' : '#333',
            position: 'relative', cursor: 'pointer', transition: 'background .2s',
          }}>
            <div style={{
              width: 20, height: 20, borderRadius: '50%', background: 'white',
              position: 'absolute', top: 3, left: gpsOn ? 21 : 3,
              transition: 'left .2s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
            }} />
          </div>
        </div>

        {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '11px 13px', fontSize: 13, color: '#f87171' }}>{error}</div>}

        <button onClick={handleSubmit} disabled={loading || !photo || (analyse && !analyse.valide)} style={{
          padding: '15px 0',
          background: etape === 'done' ? '#22c55e' : (loading || !photo || (analyse && !analyse.valide)) ? '#222' : '#f5a623',
          color: (loading || !photo || (analyse && !analyse.valide)) ? '#7a7670' : '#0d0d0d',
          borderRadius: 12, fontFamily: 'Bebas Neue,sans-serif', fontSize: 21, letterSpacing: '.05em',
          border: 'none', transition: 'all .2s', cursor: loading || !photo ? 'default' : 'pointer',
          boxShadow: !loading && photo && !(analyse && !analyse.valide) ? '0 4px 18px rgba(245,166,35,0.3)' : 'none',
        }}>
          {loading ? (etapeLabel[etape] || '...') : etape === 'done' ? '🍺 PINTE POSTÉE !' : '🍺 VALIDER MA PINTE'}
        </button>
        <p style={{ fontSize: 10, color: '#3a3834', textAlign: 'center' }}>Le numéro est attribué automatiquement par le serveur</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
