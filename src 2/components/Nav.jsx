import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

const MAIN_TABS = [
  { path: '/', id: 'feed', label: 'Feed', icon: (a) => <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a?2.5:1.8} strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg> },
  { path: '/classement', id: 'classement', label: 'Top', icon: (a) => <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a?2.5:1.8} strokeLinecap="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> },
  { path: '/poster', id: 'poster', label: '', isPost: true },
  { path: '/badges', id: 'badges', label: 'Badges', icon: (a) => <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a?2.5:1.8} strokeLinecap="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg> },
  { path: '/profil', id: 'profil', label: 'Profil', icon: (a) => <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a?2.5:1.8} strokeLinecap="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
]

const MORE_TABS = [
  { path: '/carte', label: '🗺 Carte des pintes' },
  { path: '/villes', label: '📍 Classement villes' },
  { path: '/chat', label: '💬 Chat' },
]

export default function Nav() {
  const location = useLocation()
  const navigate = useNavigate()
  const [showMore, setShowMore] = useState(false)

  return (
    <>
      {/* Menu "Plus" */}
      {showMore && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 90,
          background: 'rgba(0,0,0,0.6)',
        }} onClick={() => setShowMore(false)}>
          <div style={{
            position: 'absolute', bottom: 72, left: 16, right: 16,
            background: '#181818', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 16, overflow: 'hidden',
            animation: 'slideUp .2s ease',
          }} onClick={e => e.stopPropagation()}>
            {MORE_TABS.map((tab, i) => (
              <button key={tab.path} onClick={() => { navigate(tab.path); setShowMore(false) }} style={{
                width: '100%', padding: '14px 18px',
                background: location.pathname === tab.path ? 'rgba(245,166,35,0.08)' : 'transparent',
                border: 'none',
                borderBottom: i < MORE_TABS.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                color: location.pathname === tab.path ? '#f5a623' : '#ede9e0',
                fontSize: 14, fontFamily: 'DM Sans,sans-serif',
                cursor: 'pointer', textAlign: 'left',
              }}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'rgba(11,11,11,0.97)', backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255,255,255,0.07)',
        display: 'flex', paddingBottom: 'env(safe-area-inset-bottom)',
        zIndex: 100,
      }}>
        {MAIN_TABS.map(tab => {
          const active = location.pathname === tab.path
          if (tab.isPost) return (
            <button key={tab.path} onClick={() => navigate(tab.path)} style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: 2, padding: '0 0 6px', background: 'none', border: 'none', cursor: 'pointer',
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: '50%',
                background: active ? '#ffc85a' : '#f5a623',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginTop: -18,
                boxShadow: '0 4px 16px rgba(245,166,35,0.4)',
              }}>
                <svg width="22" height="22" fill="none" stroke="#0d0d0d" strokeWidth="2.2" strokeLinecap="round" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
                </svg>
              </div>
              <span style={{ fontSize: 0, opacity: 0 }}>+</span>
            </button>
          )
          return (
            <button key={tab.path} onClick={() => navigate(tab.path)} style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: 2, padding: '10px 0 8px',
              color: active ? '#f5a623' : '#3a3834',
              background: 'none', border: 'none', cursor: 'pointer', transition: 'color .15s',
            }}>
              {tab.icon(active)}
              <span style={{ fontSize: 9, letterSpacing: '.03em', fontFamily: 'DM Sans,sans-serif' }}>{tab.label}</span>
            </button>
          )
        })}
      </nav>
      <style>{`@keyframes slideUp{from{transform:translateY(10px);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>
    </>
  )
}
