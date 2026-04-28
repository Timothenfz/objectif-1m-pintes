import { useEffect, useState } from 'react'

const MILESTONES = [
  { count: 1,    emoji: '🍺', title: 'Première Gorgée !',     msg: 'La légende commence ici.' },
  { count: 5,    emoji: '🔥', title: 'Tu chauffes !',          msg: '5 pintes au compteur.' },
  { count: 10,   emoji: '🍻', title: 'Habitué !',              msg: 'Tu commences à être connu au bar.' },
  { count: 25,   emoji: '💪', title: 'Sérieux !',              msg: '25 pintes, t\'es plus un amateur.' },
  { count: 50,   emoji: '👑', title: 'Pilier de Bar !',        msg: 'Le tabouret du bar porte ton nom.' },
  { count: 100,  emoji: '🏆', title: 'Légende !',              msg: '100 pintes. Le groupe s\'incline.' },
  { count: 200,  emoji: '⚡', title: 'Inarrêtable !',          msg: 'On commence à s\'inquiéter pour toi.' },
  { count: 500,  emoji: '🌟', title: 'Demi-Dieu !',            msg: '500 pintes. T\'as un problème ou un talent.' },
  { count: 1000, emoji: '💀', title: 'El Presidente !',        msg: '1000 pintes. C\'est tout.' },
]

export function checkMilestone(prevCount, newCount) {
  return MILESTONES.find(m => prevCount < m.count && newCount >= m.count) || null
}

export default function MilestonePopup({ milestone, onClose }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (milestone) {
      setTimeout(() => setVisible(true), 100)
      const t = setTimeout(() => { setVisible(false); setTimeout(onClose, 400) }, 4000)
      return () => clearTimeout(t)
    }
  }, [milestone])

  if (!milestone) return null

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 500,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.75)',
      opacity: visible ? 1 : 0,
      transition: 'opacity .4s ease',
      pointerEvents: visible ? 'auto' : 'none',
    }} onClick={() => { setVisible(false); setTimeout(onClose, 400) }}>

      {/* Confettis */}
      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        @keyframes milestone-pop {
          0% { transform: scale(0.5) translateY(40px); opacity: 0; }
          60% { transform: scale(1.1) translateY(-10px); }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes emoji-bounce {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.3); }
        }
      `}</style>

      {/* Particules */}
      {visible && Array.from({ length: 20 }).map((_, i) => (
        <div key={i} style={{
          position: 'fixed',
          left: `${Math.random() * 100}%`,
          top: '-20px',
          width: 8 + Math.random() * 6,
          height: 8 + Math.random() * 6,
          borderRadius: Math.random() > 0.5 ? '50%' : '2px',
          background: ['#f5a623','#ffc85a','#4ade80','#818cf8','#f87171','#38bdf8'][Math.floor(Math.random() * 6)],
          animation: `confetti-fall ${2 + Math.random() * 3}s ${Math.random() * 1}s linear forwards`,
          zIndex: 501,
          pointerEvents: 'none',
        }} />
      ))}

      {/* Card */}
      <div style={{
        background: 'var(--card-bg)',
        border: '1px solid var(--border2)',
        borderRadius: 24,
        padding: '36px 28px 28px',
        textAlign: 'center',
        maxWidth: 300,
        width: '85%',
        animation: visible ? 'milestone-pop .5s ease forwards' : 'none',
        position: 'relative',
        zIndex: 502,
      }}>
        <div style={{
          fontSize: 72, marginBottom: 12, lineHeight: 1,
          animation: 'emoji-bounce 1s ease infinite',
          display: 'inline-block',
        }}>
          {milestone.emoji}
        </div>
        <div style={{
          fontFamily: 'Bebas Neue,sans-serif',
          fontSize: 32, color: 'var(--am)',
          letterSpacing: '.05em', marginBottom: 8,
        }}>
          {milestone.title}
        </div>
        <div style={{ fontSize: 14, color: 'var(--tx2)', marginBottom: 4, lineHeight: 1.5 }}>
          {milestone.msg}
        </div>
        <div style={{
          display: 'inline-block',
          marginTop: 16,
          padding: '6px 18px',
          background: 'rgba(245,166,35,0.15)',
          border: '1px solid rgba(245,166,35,0.3)',
          borderRadius: 20,
          fontFamily: 'Bebas Neue,sans-serif',
          fontSize: 20, color: 'var(--am)',
          letterSpacing: '.05em',
        }}>
          {milestone.count} PINTES 🍺
        </div>
        <div style={{ fontSize: 11, color: 'var(--tx3)', marginTop: 16 }}>
          Appuie pour fermer
        </div>
      </div>
    </div>
  )
}
