import { useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth.jsx'
import { useLang } from '../hooks/useLang.jsx'
import { useNavigate } from 'react-router-dom'
import LangSwitcher from '../components/LangSwitcher.jsx'
import ThemeSwitcher from '../components/ThemeSwitcher.jsx'
import Avatar from '../components/Avatar.jsx'

const NOTIF_PREFS = [
  { id: 'notif_nouvelle_pinte', label: 'Nouvelle pinte dans le groupe', icon: '🍺' },
  { id: 'notif_reaction', label: 'Réaction sur ma pinte', icon: '😄' },
  { id: 'notif_commentaire', label: 'Commentaire sur ma pinte', icon: '💬' },
  { id: 'notif_recap_jour', label: 'Récap journalier (20h)', icon: '📅' },
  { id: 'notif_recap_semaine', label: 'Récap hebdo (lundi)', icon: '📊' },
]

export default function ProfilePage() {
  const { profile, signOut, fetchProfile } = useAuth()
  const { t } = useLang()
  const navigate = useNavigate()
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
  const [avatarLoading, setAvatarLoading] = useState(false)
  const [notifPrefs, setNotifPrefs] = useState({
    notif_nouvelle_pinte: true,
    notif_reaction: true,
    notif_commentaire: true,
    notif_recap_jour: false,
    notif_recap_semaine: false,
  })
  const avatarRef = useRef()

  useEffect(() => {
    if (profile?.id) {
      fetchMyPintes()
      loadNotifPrefs()
    }
    fetchTotal()
  }, [profile])

  async function fetchMyPintes() {
    const { data } = await supabase.from('pintes').select('*')
      .eq('user_id', profile.id).order('created_at', { ascending: false }).limit(20)
    setPintes(data || [])
    setLoading(false)
  }

  async function fetchTotal() {
    const { count } = await supabase.from('pintes').select('*', { count: 'exact', head: true })
    setTotalGlobal(count || 0)
  }

  async function loadNotifPrefs() {
    const stored = localStorage.getItem(`notif_prefs_${profile.id}`)
    if (stored) setNotifPrefs(JSON.parse(stored))
  }

  async function saveNotifPref(key, value) {
    const newPrefs = { ...notifPrefs, [key]: value }
    setNotifPrefs(newPrefs)
    localStorage.setItem(`notif_prefs_${profile.id}`, JSON.stringify(newPrefs))
  }

  async function saveVille() {
    setVilleLoading(true)
    await supabase.from('profiles').update({ ville: ville.trim() }).eq('id', profile.id)
    setVilleLoading(false); setVilleSaved(true)
    setTimeout(() => setVilleSaved(false), 2000)
  }

  async function savePseudo() {
    if (!pseudo.trim() || pseudo.trim() === profile.username) return
    setPseudoLoading(true); setPseudoError('')
    const { error } = await supabase.from('profiles').update({ username: pseudo.trim() }).eq('id', profile.id)
    if (error) setPseudoError(error.code === '23505' ? 'Ce pseudo est déjà pris' : 'Erreur, réessaie')
    else { await fetchProfile(profile.id); setPseudoSaved(true); setTimeout(() => setPseudoSaved(false), 2000) }
    setPseudoLoading(false)
  }

  async function handleAvatar(e) {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { alert('Photo trop lourde (max 5MB)'); return }
    setAvatarLoading(true)
    const ext = file.name.split('.').pop()
    const path = `${profile.id}/avatar.${ext}`
    const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
    if (!uploadError) {
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
      await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', profile.id)
      await fetchProfile(profile.id)
    }
    setAvatarLoading(false)
  }

  const joinedDays = profile?.date_arrivee
    ? Math.floor((Date.now() - new Date(profile.date_arrivee).getTime()) / 86400000) : 0
  const pctContrib = totalGlobal > 0 ? ((profile?.total_perso || 0) / totalGlobal * 100).toFixed(1) : '0'
  const daysLabel = joinedDays <= 1 ? t('profile_days') : t('profile_days_pl')

  const inputStyle = {
    flex: 1, padding: '10px 12px', background: 'var(--input-bg)',
    border: '1px solid var(--border)', borderRadius: 9,
    color: 'var(--tx)', fontSize: 13, fontFamily: 'DM Sans,sans-serif', outline: 'none',
  }
  const saveBtnStyle = (saved) => ({
    padding: '10px 14px', background: saved ? '#22c55e' : 'var(--am)',
    color: '#0d0d0d', borderRadius: 9, fontWeight: 500, fontSize: 12,
    border: 'none', cursor: 'pointer', fontFamily: 'DM Sans,sans-serif',
    whiteSpace: 'nowrap', transition: 'all .2s',
  })

  return (
    <div style={{ minHeight: '100dvh', paddingBottom: 100, background: 'var(--bg)' }}>
      {/* Header */}
      <div style={{ padding: '52px 16px 20px', textAlign: 'center', borderBottom: '1px solid var(--border)', background: 'linear-gradient(180deg,rgba(245,166,35,0.06) 0%,transparent 100%)' }}>
        <div style={{ position: 'relative', width: 80, margin: '0 auto 12px' }}>
          <div onClick={() => !avatarLoading && avatarRef.current?.click()} style={{ cursor: 'pointer' }}>
            <Avatar username={profile?.username} avatarUrl={profile?.avatar_url} size={80} border />
          </div>
          <button onClick={() => !avatarLoading && avatarRef.current?.click()} style={{
            position: 'absolute', bottom: 0, right: 0,
            width: 26, height: 26, borderRadius: '50%',
            background: 'var(--am)', border: '2px solid var(--bg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}>
            {avatarLoading
              ? <div style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid rgba(0,0,0,0.3)', borderTopColor: '#0d0d0d', animation: 'spin .6s linear infinite' }} />
              : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0d0d0d" strokeWidth="2.5" strokeLinecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            }
          </button>
          <input ref={avatarRef} type="file" accept="image/*" onChange={handleAvatar} style={{ display: 'none' }} />
        </div>
        <div style={{ fontFamily: 'Bebas Neue,sans-serif', fontSize: 26, letterSpacing: '.05em', color: 'var(--tx)' }}>{profile?.username}</div>
        {/* Bouton installer l'app */}
      <div style={{ padding: '4px 12px 8px' }}>
        <button onClick={() => navigate('/installer')} style={{
          width: '100%', padding: '12px 0',
          background: 'var(--bg3)', border: '1px solid var(--border)',
          borderRadius: 10, color: 'var(--tx)', fontSize: 13,
          fontFamily: 'DM Sans,sans-serif', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          📲 Installer l'app sur mon téléphone
        </button>
      </div>

      {profile?.is_admin && (
          <div style={{ display: 'inline-block', marginTop: 4, padding: '2px 10px', background: 'rgba(245,166,35,0.15)', border: '1px solid rgba(245,166,35,0.3)', borderRadius: 20, fontSize: 11, color: 'var(--am)', fontWeight: 500 }}>
            ⚡ Admin
          </div>
        )}
        <div style={{ fontSize: 11, color: 'var(--tx2)', marginTop: 4 }}>
          {t('profile_member_since')} {joinedDays} {daysLabel}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 8, padding: '14px 12px 10px' }}>
        {[
          { val: profile?.total_perso || 0, lbl: t('profile_pintes') },
          { val: profile?.dernier_numero_global || '—', lbl: t('profile_last') },
          { val: `${pctContrib}%`, lbl: t('profile_contrib'), span: 2 },
        ].map((s, i) => (
          <div key={i} style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 11, padding: '12px 10px', textAlign: 'center', gridColumn: s.span ? `span ${s.span}` : 'span 1' }}>
            <div style={{ fontFamily: 'Bebas Neue,sans-serif', fontSize: 26, color: 'var(--am)', lineHeight: 1 }}>{s.val}</div>
            <div style={{ fontSize: 10, color: 'var(--tx2)', marginTop: 3 }}>{s.lbl}</div>
          </div>
        ))}
      </div>

      {/* Pseudo */}
      <div style={{ padding: '4px 12px 12px' }}>
        <div style={{ fontSize: 12, color: 'var(--tx2)', marginBottom: 6, fontWeight: 500 }}>Pseudo</div>
        <div style={{ display: 'flex', gap: 7 }}>
          <input value={pseudo} onChange={e => { setPseudo(e.target.value); setPseudoError('') }}
            onKeyDown={e => e.key === 'Enter' && savePseudo()} placeholder={profile?.username} maxLength={20} style={inputStyle} />
          <button onClick={savePseudo} disabled={pseudoLoading || pseudo.trim() === profile?.username}
            style={{ ...saveBtnStyle(pseudoSaved), opacity: pseudo.trim() === profile?.username ? 0.4 : 1 }}>
            {pseudoLoading ? '...' : pseudoSaved ? '✓' : t('profile_save')}
          </button>
        </div>
        {pseudoError && <div style={{ fontSize: 11, color: '#f87171', marginTop: 5 }}>{pseudoError}</div>}
      </div>

      {/* Ville */}
      <div style={{ padding: '4px 12px 12px' }}>
        <div style={{ fontSize: 12, color: 'var(--tx2)', marginBottom: 6, fontWeight: 500 }}>{t('profile_city')}</div>
        <div style={{ display: 'flex', gap: 7 }}>
          <input value={ville} onChange={e => setVille(e.target.value)} onKeyDown={e => e.key === 'Enter' && saveVille()}
            placeholder={t('profile_city_placeholder')} style={inputStyle} />
          <button onClick={saveVille} disabled={villeLoading} style={saveBtnStyle(villeSaved)}>
            {villeLoading ? '...' : villeSaved ? t('profile_saved') : t('profile_save')}
          </button>
        </div>
      </div>

      {/* Préférences notifications */}
      <div style={{ padding: '4px 12px 14px' }}>
        <div style={{ fontSize: 12, color: 'var(--tx2)', marginBottom: 8, fontWeight: 500 }}>🔔 Notifications</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {NOTIF_PREFS.map(pref => (
            <div key={pref.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 13px', background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 10,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 16 }}>{pref.icon}</span>
                <span style={{ fontSize: 13, color: 'var(--tx)' }}>{pref.label}</span>
              </div>
              <div onClick={() => saveNotifPref(pref.id, !notifPrefs[pref.id])} style={{
                width: 40, height: 24, borderRadius: 12,
                background: notifPrefs[pref.id] ? 'var(--am)' : 'var(--bg3)',
                position: 'relative', cursor: 'pointer', transition: 'background .2s', flexShrink: 0,
              }}>
                <div style={{
                  width: 18, height: 18, borderRadius: '50%', background: 'white',
                  position: 'absolute', top: 3, left: notifPrefs[pref.id] ? 19 : 3,
                  transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Langue + Thème */}
      <div style={{ padding: '0 12px 14px' }}>
        <div style={{ fontSize: 12, color: 'var(--tx2)', marginBottom: 8, fontWeight: 500 }}>{t('profile_lang')}</div>
        <LangSwitcher />
        <ThemeSwitcher style={{ marginTop: 8 }} />
      </div>

      {/* Galerie */}
      <div style={{ padding: '0 12px' }}>
        <div style={{ fontFamily: 'Bebas Neue,sans-serif', fontSize: 15, color: 'var(--tx2)', marginBottom: 8 }}>{t('profile_my_pintes')}</div>
        {loading ? <div style={{ color: 'var(--tx2)', fontSize: 13 }}>...</div> : pintes.length === 0 ? (
          <div style={{ color: 'var(--tx2)', fontSize: 13 }}>Pas encore de pinte !</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 4 }}>
            {pintes.map(p => (
              <div key={p.id} style={{ aspectRatio: '1', borderRadius: 8, overflow: 'hidden', background: 'var(--bg3)', position: 'relative' }}>
                <img src={p.photo_url} alt={`#${p.numero_global}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                <div style={{ position: 'absolute', bottom: 3, right: 3, background: 'rgba(0,0,0,.7)', borderRadius: 4, padding: '1px 5px', fontFamily: 'Bebas Neue,sans-serif', fontSize: 10, color: 'var(--am)' }}>#{p.numero_global}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bouton installer l'app */}
      <div style={{ padding: '4px 12px 8px' }}>
        <button onClick={() => navigate('/installer')} style={{
          width: '100%', padding: '12px 0',
          background: 'var(--bg3)', border: '1px solid var(--border)',
          borderRadius: 10, color: 'var(--tx)', fontSize: 13,
          fontFamily: 'DM Sans,sans-serif', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          📲 Installer l'app sur mon téléphone
        </button>
      </div>

      {profile?.is_admin && (
        <div style={{ padding: '8px 12px 0' }}>
          <button onClick={() => navigate('/admin')} style={{
            width: '100%', padding: '12px 0',
            background: 'rgba(245,166,35,0.1)',
            border: '1px solid rgba(245,166,35,0.3)',
            borderRadius: 10, color: 'var(--am)', fontSize: 13,
            fontFamily: 'DM Sans,sans-serif', cursor: 'pointer',
          }}>
            ⚡ Panneau Admin
          </button>
        </div>
      )}

      <div style={{ padding: '8px 12px 0' }}>
        <button onClick={signOut} style={{ width: '100%', padding: '12px 0', background: 'transparent', border: '1px solid var(--border2)', borderRadius: 10, color: 'var(--tx2)', fontSize: 13, fontFamily: 'DM Sans,sans-serif', cursor: 'pointer' }}>
          {t('profile_logout')}
        </button>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
