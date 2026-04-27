import { useLocation, useNavigate } from 'react-router-dom'

const tabs = [
  { path: '/', label: 'Feed', icon: (a) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a?2.5:1.8} strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg> },
  { path: '/classement', label: 'Classement', icon: (a) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a?2.5:1.8} strokeLinecap="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> },
  { path: '/poster', label: 'Pinte', icon: (a) => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0a0a0a" strokeWidth="2.2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg> },
  { path: '/villes', label: 'Villes', icon: (a) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a?2.5:1.8} strokeLinecap="round"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg> },
  { path: '/profil', label: 'Profil', icon: (a) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a?2.5:1.8} strokeLinecap="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
]

export default function Nav() {
  const location = useLocation()
  const navigate = useNavigate()
  return (
    <nav style={{
      position:'fixed',bottom:0,left:0,right:0,
      background:'rgba(12,12,12,0.96)',backdropFilter:'blur(20px)',
      borderTop:'1px solid rgba(255,255,255,0.07)',
      display:'flex',paddingBottom:'env(safe-area-inset-bottom)',zIndex:100,
    }}>
      {tabs.map(tab => {
        const active = location.pathname === tab.path
        const isPost = tab.path === '/poster'
        return (
          <button key={tab.path} onClick={() => navigate(tab.path)} style={{
            flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:3,
            padding: isPost ? '8px 0 10px' : '10px 0 12px',
            color: active ? '#f5a623' : '#3a3834',
            background:'none',border:'none',cursor:'pointer',
            transition:'color .15s',
          }}>
            {isPost ? (
              <div style={{
                width:46,height:46,borderRadius:'50%',
                background: active ? '#ffc85a' : '#f5a623',
                display:'flex',alignItems:'center',justifyContent:'center',
                marginTop:-20,boxShadow:'0 4px 18px rgba(245,166,35,0.4)',
              }}>{tab.icon(active)}</div>
            ) : tab.icon(active)}
            <span style={{ fontSize:9, fontWeight: active?500:400, letterSpacing:'.03em', opacity: isPost?0:1 }}>{tab.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
