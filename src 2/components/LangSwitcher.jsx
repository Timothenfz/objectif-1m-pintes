import { useLang } from '../hooks/useLang.jsx'

const LANGS = [
  { code: 'fr', flag: '🇫🇷' },
  { code: 'en', flag: '🇬🇧' },
]

export default function LangSwitcher({ style }) {
  const { lang, changeLang } = useLang()
  return (
    <div style={{ display:'flex', gap:6, ...style }}>
      {LANGS.map(l => (
        <button key={l.code} onClick={() => changeLang(l.code)} style={{
          fontSize:20, padding:'4px 8px', borderRadius:8,
          background: lang===l.code ? 'rgba(245,166,35,0.15)' : 'transparent',
          border: `1px solid ${lang===l.code ? 'rgba(245,166,35,0.4)' : 'rgba(255,255,255,0.08)'}`,
          cursor:'pointer', lineHeight:1, opacity: lang===l.code ? 1 : 0.45,
          transition:'all .15s',
        }}>{l.flag}</button>
      ))}
    </div>
  )
}
