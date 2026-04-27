import { useState } from 'react'
import { useAuth } from '../hooks/useAuth.jsx'
import { useLang } from '../hooks/useLang.jsx'

const LANGS = [
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
]

const inputStyle = {
  width:'100%', padding:'12px 14px',
  background:'#222', border:'1px solid rgba(255,255,255,0.08)',
  borderRadius:10, color:'#ede9e0', fontSize:15,
  fontFamily:'DM Sans,sans-serif', outline:'none',
}

export default function AuthPage() {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const { signIn, signUp } = useAuth()
  const { lang, changeLang, t } = useLang()

  async function handleSubmit(e) {
    e.preventDefault()
    setError(''); setSuccess(''); setLoading(true)
    if (mode === 'login') {
      const { error } = await signIn(email, password)
      if (error) setError(error.message)
    } else {
      if (!username.trim()) { setError(t('auth_no_username')); setLoading(false); return }
      const { error } = await signUp(email, password, username.trim())
      if (error) setError(error.message)
      else setSuccess(lang === 'fr' ? 'Vérifie ton email pour confirmer ton compte !' : 'Check your email to confirm your account!')
    }
    setLoading(false)
  }

  return (
    <div style={{
      minHeight:'100dvh', display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center',
      padding:'24px 20px', background:'#0a0a0a', position:'relative', overflow:'hidden',
    }}>
      <div style={{
        position:'absolute', top:'18%', left:'50%', transform:'translateX(-50%)',
        width:280, height:280, borderRadius:'50%',
        background:'radial-gradient(circle,rgba(245,166,35,0.1) 0%,transparent 70%)',
        pointerEvents:'none',
      }} />

      {/* Logo */}
      <div style={{ textAlign:'center', marginBottom:40, animation:'fadeUp .5s ease both' }}>
        <div style={{ fontSize:60, marginBottom:8 }}>🍺</div>
        <div style={{ fontFamily:'Bebas Neue,sans-serif', fontSize:13, color:'#f5a623', letterSpacing:'.1em' }}>{t('auth_title_line1')}</div>
        <div style={{ fontFamily:'Bebas Neue,sans-serif', fontSize:50, color:'#f5a623', lineHeight:.9 }}>{t('auth_title_line2')}</div>
        <div style={{ fontFamily:'Bebas Neue,sans-serif', fontSize:50, color:'#fffdf5', lineHeight:.9 }}>{t('auth_title_line3')}</div>
        <div style={{ color:'#7a7670', fontSize:12, marginTop:8, fontStyle:'italic' }}>{t('auth_subtitle')}</div>
      </div>

      {/* Lang picker */}
      <div style={{ marginBottom:20, display:'flex', gap:8, animation:'fadeUp .5s .05s ease both', opacity:0, animationFillMode:'forwards' }}>
        <div style={{ fontSize:12, color:'#7a7670', marginRight:4, alignSelf:'center' }}>{t('auth_choose_lang')}</div>
        {LANGS.map(l => (
          <button key={l.code} onClick={() => changeLang(l.code)} style={{
            display:'flex', alignItems:'center', gap:6, padding:'7px 14px',
            borderRadius:20, border:`1px solid ${lang===l.code ? 'rgba(245,166,35,0.5)' : 'rgba(255,255,255,0.1)'}`,
            background: lang===l.code ? 'rgba(245,166,35,0.1)' : 'transparent',
            color: lang===l.code ? '#f5a623' : '#7a7670',
            cursor:'pointer', fontSize:13, fontFamily:'DM Sans,sans-serif',
            transition:'all .15s',
          }}>
            <span style={{ fontSize:18 }}>{l.flag}</span> {l.label}
          </button>
        ))}
      </div>

      {/* Form */}
      <div style={{
        width:'100%', maxWidth:380,
        background:'#181818', border:'1px solid rgba(255,255,255,0.08)',
        borderRadius:20, padding:'24px 20px',
        animation:'fadeUp .5s .1s ease both', opacity:0, animationFillMode:'forwards',
      }}>
        <div style={{ display:'flex', gap:4, background:'#222', borderRadius:10, padding:4, marginBottom:22 }}>
          {['login','signup'].map(m => (
            <button key={m} onClick={() => { setMode(m); setError(''); setSuccess('') }} style={{
              flex:1, padding:'8px 0', borderRadius:8,
              background: mode===m ? '#f5a623' : 'transparent',
              color: mode===m ? '#0a0a0a' : '#7a7670',
              fontWeight: mode===m ? 500 : 400,
              fontSize:14, transition:'all .2s',
              border:'none', cursor:'pointer', fontFamily:'DM Sans,sans-serif',
            }}>
              {m==='login' ? t('auth_login') : t('auth_signup')}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {mode==='signup' && (
            <div>
              <label style={{ fontSize:12, color:'#7a7670', display:'block', marginBottom:6 }}>{t('auth_username')}</label>
              <input value={username} onChange={e=>setUsername(e.target.value)} placeholder={t('auth_username_placeholder')} style={inputStyle} />
            </div>
          )}
          <div>
            <label style={{ fontSize:12, color:'#7a7670', display:'block', marginBottom:6 }}>{t('auth_email')}</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder={t('auth_email_placeholder')} required style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize:12, color:'#7a7670', display:'block', marginBottom:6 }}>{t('auth_password')}</label>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder={t('auth_password_placeholder')} required minLength={6} style={inputStyle} />
          </div>

          {error && <div style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:8, padding:'10px 14px', fontSize:13, color:'#f87171' }}>{error}</div>}
          {success && <div style={{ background:'rgba(34,197,94,0.1)', border:'1px solid rgba(34,197,94,0.3)', borderRadius:8, padding:'10px 14px', fontSize:13, color:'#4ade80' }}>{success}</div>}

          <button type="submit" disabled={loading} style={{
            marginTop:4, padding:'14px 0',
            background: loading ? '#222' : '#f5a623',
            color: loading ? '#7a7670' : '#0a0a0a',
            borderRadius:10, fontWeight:500, fontSize:15,
            border:'none', cursor: loading ? 'default' : 'pointer',
            fontFamily:'DM Sans,sans-serif', transition:'all .2s',
          }}>
            {loading ? t('auth_loading') : mode==='login' ? t('auth_submit_login') : t('auth_submit_signup')}
          </button>
        </form>
      </div>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  )
}
