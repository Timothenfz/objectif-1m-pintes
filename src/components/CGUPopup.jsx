import { useState } from 'react'

export default function CGUPopup({ onAccept }) {
  const [checked, setChecked] = useState(false)

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
      zIndex: 1000, display: 'flex', alignItems: 'flex-end',
    }}>
      <div style={{
        width: '100%', background: 'var(--card-bg)',
        borderRadius: '24px 24px 0 0',
        border: '1px solid var(--border2)',
        padding: '28px 20px 40px',
        maxHeight: '90dvh', overflowY: 'auto',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🍺</div>
          <div style={{ fontFamily: 'Bebas Neue,sans-serif', fontSize: 26, color: 'var(--tx)', letterSpacing: '.05em' }}>
            BIENVENUE !
          </div>
          <div style={{ fontSize: 13, color: 'var(--tx2)', marginTop: 4 }}>
            Avant de commencer, quelques règles importantes
          </div>
        </div>

        {/* Mentions éthiques */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          {[
            { icon: '🔞', title: 'Réservé aux majeurs', desc: 'Cette app est exclusivement destinée aux personnes majeures (+18 ans). En continuant, tu confirmes avoir l\'âge légal de consommer de l\'alcool dans ton pays.' },
            { icon: '🎮', title: 'Application ludique uniquement', desc: 'Cette app a un but purement social et fun entre amis. Elle n\'encourage pas la consommation excessive d\'alcool. Bois avec modération.' },
            { icon: '🚗', title: 'Alcool et conduite', desc: 'Ne conduis jamais après avoir consommé de l\'alcool. L\'app ne cautionne en aucun cas la conduite en état d\'ivresse.' },
            { icon: '⚖️', title: 'Loi Évin', desc: 'Conformément à la loi Évin, cette application ne fait pas la promotion de boissons alcoolisées. Son objectif est uniquement de partager des moments entre amis.' },
          ].map((item, i) => (
            <div key={i} style={{
              display: 'flex', gap: 12, padding: '12px 14px',
              background: 'var(--bg3)', borderRadius: 12,
              border: '1px solid var(--border)',
            }}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>{item.icon}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--tx)', marginBottom: 3 }}>{item.title}</div>
                <div style={{ fontSize: 12, color: 'var(--tx2)', lineHeight: 1.5 }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Checkbox */}
        <div onClick={() => setChecked(c => !c)} style={{
          display: 'flex', alignItems: 'flex-start', gap: 12,
          padding: '14px', background: checked ? 'rgba(34,197,94,0.08)' : 'var(--bg3)',
          border: `1px solid ${checked ? 'rgba(34,197,94,0.3)' : 'var(--border)'}`,
          borderRadius: 12, cursor: 'pointer', marginBottom: 16,
          transition: 'all .2s',
        }}>
          <div style={{
            width: 22, height: 22, borderRadius: 6, flexShrink: 0, marginTop: 1,
            background: checked ? '#22c55e' : 'var(--bg)',
            border: `2px solid ${checked ? '#22c55e' : 'var(--border2)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all .2s',
          }}>
            {checked && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><polyline points="20,6 9,17 4,12"/></svg>}
          </div>
          <div style={{ fontSize: 12, color: 'var(--tx)', lineHeight: 1.6 }}>
            J'ai lu et j'accepte les conditions. Je confirme avoir <strong>18 ans ou plus</strong> et je m'engage à consommer de l'alcool de façon <strong>responsable</strong>.
          </div>
        </div>

        <button onClick={() => checked && onAccept()} disabled={!checked} style={{
          width: '100%', padding: '15px 0',
          background: checked ? 'var(--am)' : 'var(--bg3)',
          color: checked ? '#0d0d0d' : 'var(--tx2)',
          border: 'none', borderRadius: 12,
          fontFamily: 'Bebas Neue,sans-serif', fontSize: 20, letterSpacing: '.05em',
          cursor: checked ? 'pointer' : 'default', transition: 'all .2s',
        }}>
          {checked ? "C'EST PARTI 🍺" : "COCHE LA CASE POUR CONTINUER"}
        </button>

        <div style={{ fontSize: 10, color: 'var(--tx3)', textAlign: 'center', marginTop: 12, lineHeight: 1.5 }}>
          L'abus d'alcool est dangereux pour la santé. À consommer avec modération.
          <br />Numéro d'aide : Alcool Info Service 0 980 980 930
        </div>
      </div>
    </div>
  )
}
