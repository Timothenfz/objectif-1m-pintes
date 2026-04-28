import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth.jsx'
import { useLang } from '../hooks/useLang.jsx'
import LangSwitcher from '../components/LangSwitcher.jsx'

export default function ProfilePage() {
  const { profile, signOut, fetchProfile } = useAuth()
  const { t } = useLang()
  const [pintes, setPintes] = useState([])
  const [loading, setLoading] = useState(true)
  const [totalGlobal, setTotalGlobal] = useState(0)

  const [ville, setVille] = useState(profile?.ville || '')
  const [villeLoading, setVilleLoading] = useState(false)
  const [villeSaved, setVilleSaved] = useState(false)

  const [pseudo, setPseudo] = useState(profile?.username || '')
  const [pseudoLoading, setPseudoLoading] = useState(false)
  const [pseudoSaved, setPseudoSaved] = useState(false)
  const [pseudoError, setPseudoError] = useState('')

  useEffect(() => { if (profile?.id) fetchMyPintes(); fetchTotal() }, [profile])

  async function fetchMyPintes() {
    const { data } = await supabase.from('pintes').select('*')
      .eq('user_id', profile.id).order('created_at', { ascending:false }).limit(20)
    setPintes(data || [])
    setLoading(false)
  }

  async function fetchTotal() {
    const { count } = await supabase.from('pintes').select('*', { count:'exact', head:true })
    setTotalGlobal(count || 0)
  }

  async function saveVille() {
    setVilleLoading(true)
    await supabase.from('profiles').update({ ville: ville.trim() }).eq('id', profile.id)
    setVilleLoading(false); setVilleSaved(true)
    setTimeout(() => setVilleSaved(false), 2000)
  }

  async function savePseudo() {
    if (!pseudo.trim()) return
    if (pseudo.trim() === profile.username) return
    setPseudoLoading(true); setPseudoError('')
    const { error } = await supabase
      .from('profiles')
      .update({ username: pseudo.trim() })
      .eq('id', profile.id)
    if (error) {
      setPseudoError(error.code === '23505' ? 'Ce pseudo est déjà pris' : 'Erreur, réessaie')
    } else {
      await fetchProfile(profile.id)
      setPseudoSaved(true)
      setTimeout(() => setPseudoSaved(false), 2000)
    }
    setPseudoLoading(false)
  }

  const joinedDays = profile?.date_arrivee
    ? Math.floor((Date.now() - new Date(profile.date_arrivee).getTime()) / 86400000) : 0
  const pctContrib = totalGlobal > 0 ? ((profile?.total_perso||0) / totalGlobal * 100).toFixed(1) : '0'
  const daysLabel = joinedDays <= 1 ? t('profile_days') : t('profile_days_pl')

  const inputStyle = {
    flex:1, padding:'10px 12px', background:'#181818',
    border:'1px solid rgba(255,255,255,0.07)', borderRadius:9,
    color:'#ede9e0', fontSize:13, fontFamily:'DM Sans,sans-serif', outline:'none',
  }
  const saveBtn = (saved, loading, onClick) => ({
    padding:'10px 14px', background: saved ? '#22c55e' : '#f5a623',
    color:'#0d0d0d', borderRadius:9, fontWeight:500, fontSize:12,
    border:'none', cursor:'pointer', fontFamily:'DM Sans,sans-serif',
    whiteSpace:'nowrap', transition:'all .2s',
  })

  return (
    <div style={{ minHeight:'100dvh', paddingBottom:90, background:'#0d0d0d' }}>
      {/* Header */}
      <div style={{ padding:'52px 16px 20px', textAlign:'center', borderBottom:'1px solid rgba(255,255,255,0.07)', background:'linear-gradient(180deg,rgba(245,166,35,0.06) 0%,transparent 100%)' }}>
        <div style={{ width:72, height:72, borderRadius:'50%', margin:'0 auto 12px', background:'rgba(245,166,35,0.12)', border:'3px solid #f5a623', display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, fontWeight:500, color:'#f5a623' }}>
          {(profile?.username||'?')[0].toUpperCase()}
        </div>
        <div style={{ fontFamily:'Bebas Neue,sans-serif', fontSize:26, letterSpacing:'.05em', color:'#ede9e0' }}>{profile?.username}</div>
        <div style={{ fontSize:11, color:'#7a7670', marginTop:3 }}>
          {t('profile_member_since')} {joinedDays} {daysLabel}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(2,minmax(0,1fr))', gap:8, padding:'14px 12px 10px' }}>
        <div style={{ background:'#181818', border:'1px solid rgba(255,255,255,0.07)', borderRadius:11, padding:'12px 10px', textAlign:'center' }}>
          <div style={{ fontFamily:'Bebas Neue,sans-serif', fontSize:26, color:'#f5a623', lineHeight:1 }}>{profile?.total_perso||0}</div>
          <div style={{ fontSize:10, color:'#7a7670', marginTop:3 }}>{t('profile_pintes')}</div>
        </div>
        <div style={{ background:'#181818', border:'1px solid rgba(255,255,255,0.07)', borderRadius:11, padding:'12px 10px', textAlign:'center' }}>
          <div style={{ fontFamily:'Bebas Neue,sans-serif', fontSize:26, color:'#f5a623', lineHeight:1 }}>{profile?.dernier_numero_global||'—'}</div>
          <div style={{ fontSize:10, color:'#7a7670', marginTop:3 }}>{t('profile_last')}</div>
        </div>
        <div style={{ background:'#181818', border:'1px solid rgba(255,255,255,0.07)', borderRadius:11, padding:'12px 10px', textAlign:'center', gridColumn:'span 2' }}>
          <div style={{ fontFamily:'Bebas Neue,sans-serif', fontSize:26, color:'#f5a623', lineHeight:1 }}>{pctContrib}%</div>
          <div style={{ fontSize:10, color:'#7a7670', marginTop:3 }}>{t('profile_contrib')}</div>
        </div>
      </div>

      {/* Pseudo */}
      <div style={{ padding:'4px 12px 12px' }}>
        <div style={{ fontSize:12, color:'#7a7670', marginBottom:6, fontWeight:500 }}>
          {t('profile_lang') === 'Language' ? 'Username' : 'Pseudo'}
        </div>
        <div style={{ display:'flex', gap:7 }}>
          <input
            value={pseudo}
            onChange={e => { setPseudo(e.target.value); setPseudoError('') }}
            onKeyDown={e => e.key === 'Enter' && savePseudo()}
            placeholder={profile?.username}
            maxLength={20}
            style={inputStyle}
          />
          <button onClick={savePseudo} disabled={pseudoLoading || pseudo.trim() === profile?.username} style={{
            ...saveBtn(pseudoSaved, pseudoLoading),
            opacity: pseudo.trim() === profile?.username ? 0.4 : 1,
          }}>
            {pseudoLoading ? '...' : pseudoSaved ? '✓' : t('profile_save')}
          </button>
        </div>
        {pseudoError && <div style={{ fontSize:11, color:'#f87171', marginTop:5 }}>{pseudoError}</div>}
      </div>

      {/* Ville */}
      <div style={{ padding:'4px 12px 12px' }}>
        <div style={{ fontSize:12, color:'#7a7670', marginBottom:6, fontWeight:500 }}>{t('profile_city')}</div>
        <div style={{ display:'flex', gap:7 }}>
          <input
            value={ville}
            onChange={e => setVille(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && saveVille()}
            placeholder={t('profile_city_placeholder')}
            style={inputStyle}
          />
          <button onClick={saveVille} disabled={villeLoading} style={saveBtn(villeSaved, villeLoading)}>
            {villeLoading ? '...' : villeSaved ? t('profile_saved') : t('profile_save')}
          </button>
        </div>
      </div>

      {/* Langue */}
      <div style={{ padding:'0 12px 14px' }}>
        <div style={{ fontSize:12, color:'#7a7670', marginBottom:8, fontWeight:500 }}>{t('profile_lang')}</div>
        <LangSwitcher />
      </div>

      {/* Galerie */}
      <div style={{ padding:'0 12px' }}>
        <div style={{ fontFamily:'Bebas Neue,sans-serif', fontSize:15, color:'#7a7670', marginBottom:8 }}>{t('profile_my_pintes')}</div>
        {loading ? <div style={{ color:'#7a7670', fontSize:13 }}>...</div> : pintes.length === 0 ? (
          <div style={{ color:'#7a7670', fontSize:13 }}>Pas encore de pinte — vas-y !</div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,minmax(0,1fr))', gap:4 }}>
            {pintes.map(p => (
              <div key={p.id} style={{ aspectRatio:'1', borderRadius:8, overflow:'hidden', background:'#222', position:'relative' }}>
                <img src={p.photo_url} alt={`#${p.numero_global}`} style={{ width:'100%', height:'100%', objectFit:'cover' }} loading="lazy" />
                <div style={{ position:'absolute', bottom:3, right:3, background:'rgba(0,0,0,.7)', borderRadius:4, padding:'1px 5px', fontFamily:'Bebas Neue,sans-serif', fontSize:10, color:'#f5a623' }}>#{p.numero_global}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Déconnexion */}
      <div style={{ padding:'16px 12px 0' }}>
        <button onClick={signOut} style={{ width:'100%', padding:'12px 0', background:'transparent', border:'1px solid rgba(255,255,255,0.12)', borderRadius:10, color:'#7a7670', fontSize:13, fontFamily:'DM Sans,sans-serif', cursor:'pointer' }}>
          {t('profile_logout')}
        </button>
      </div>
    </div>
  )
}
