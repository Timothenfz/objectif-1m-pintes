import { useLocation, useNavigate } from 'react-router-dom'

const TABS = [
  { path: '/', label: 'Feed', icon: (a) => <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a?2.5:1.8} strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg> },
  { path: '/classement', label: 'Top', icon: (a) => <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a?2.5:1.8} strokeLinecap="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> },
  { path: '/badges', label: 'Badges', icon: (a) => <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a?2.5:1.8} strokeLinecap="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg> },
  { path: '/carte', label: 'Carte', icon: (a) => <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a?2.5:1.8} strokeLinecap="round"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg> },
  { path: '/villes', label: 'Villes', icon: (a) => <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a?2.5:1.8} strokeLinecap="round"><path d="M3 9l9-7 9 7"/><path d="M3 9v11h6v-6h6v6h6V9"/></svg> },
  { path: '/chat', label: 'Chat', icon: (a) => <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a?2.5:1.8} strokeLinecap="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg> },
  { path: '/profil', label: 'Profil', icon: (a) => <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a?2.5:1.8} strokeLinecap="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
]

export default function Nav() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <>
      <style>{`
        .nav-scroll { display:flex; overflow-x:auto; -webkit-overflow-scrolling:touch; scrollbar-width:none; }
        .nav-scroll::-webkit-scrollbar { display:none; }
        @keyframes pulse-fab { 0%,100%{box-shadow:0 4px 20px rgba(245,166,35,.5)} 50%{box-shadow:0 4px 28px rgba(245,166,35,.8)} }
      `}</style>

      {/* Bouton flottant Poster */}
      <button
        onClick={() => navigate('/poster')}
        style={{
          position: 'fixed', bottom: 74, right: 18,
          width: 52, height: 52, borderRadius: '50%',
          background: location.pathname === '/poster' ? '#ffc85a' : '#f5a623',
          border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 101, transition: 'background .2s',
          animation: 'pulse-fab 3s infinite',
        }}
      >
        <svg width="22" height="22" fill="none" stroke="#0d0d0d" strokeWidth="2.8" strokeLinecap="round" viewBox="0 0 24 24">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
      </button>

      {/* Nav */}
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        height: 64,
        background: 'rgba(11,11,11,0.97)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255,255,255,0.07)',
        zIndex: 100,
      }}>
        <div className="nav-scroll" style={{ height: '100%', paddingRight: 64 }}>
          {TABS.map(tab => {
            const active = location.pathname === tab.path
            return (
              <button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                style={{
                  flexShrink: 0,
                  minWidth: 64,
                  height: '100%',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  gap: 3,
                  color: active ? '#f5a623' : '#3a3834',
                  background: 'none', border: 'none',
                  cursor: 'pointer', transition: 'color .15s',
                  position: 'relative',
                  padding: '0 4px',
                }}
              >
                {active && (
                  <div style={{
                    position: 'absolute', top: 0, left: '50%',
                    transform: 'translateX(-50%)',
                    width: 24, height: 2, borderRadius: 1,
                    background: '#f5a623',
                  }} />
                )}
                {tab.icon(active)}
                <span style={{ fontSize: 9, fontFamily: 'DM Sans,sans-serif', letterSpacing: '.03em', fontWeight: active ? 500 : 400 }}>
                  {tab.label}
                </span>
              </button>
            )
          })}
        </div>
      </nav>
    </>
  )
}
