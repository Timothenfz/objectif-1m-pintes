import { useState } from 'react'

export default function InstallPage() {
  const [os, setOs] = useState('ios')

  const IOS_STEPS = [
    {
      title: 'Ouvre Safari et va sur le site',
      desc: "Tape l'URL dans Safari. L'installation ne fonctionne que depuis Safari sur iOS — pas Chrome ni Firefox.",
      visual: (
        <div style={{ background:'var(--bg3)', borderRadius:10, padding:10, marginTop:8 }}>
          <div style={{ background:'var(--card-bg)', borderRadius:8, padding:'8px 10px', display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--tx2)" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            <span style={{ fontSize:11, color:'var(--tx2)', flex:1 }}>objectif-1m-pintes.vercel.app</span>
          </div>
          <div style={{ background:'var(--card-bg)', borderRadius:8, height:44, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, color:'var(--tx2)' }}>Page de l'app chargée 🍺</div>
        </div>
      ),
    },
    {
      title: 'Appuie sur le bouton Partager',
      desc: 'En bas de Safari, appuie sur l\'icône carrée avec une flèche vers le haut.',
      visual: (
        <div style={{ background:'var(--bg3)', borderRadius:10, padding:12, marginTop:8 }}>
          <div style={{ display:'flex', justifyContent:'space-around', alignItems:'center' }}>
            {[
              { label:'Retour', icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg> },
              { label:'Suivant', icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg> },
              { label:'Partager', highlight:true, icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13"/></svg> },
              { label:'Signets', icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg> },
            ].map(b => (
              <div key={b.label} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                <div style={{ width:32, height:32, borderRadius:8, background: b.highlight ? 'rgba(245,166,35,0.15)' : 'var(--card-bg)', border: b.highlight ? '1px solid rgba(245,166,35,0.4)' : '1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', color: b.highlight ? 'var(--am)' : 'var(--tx2)' }}>
                  {b.icon}
                </div>
                <span style={{ fontSize:10, color: b.highlight ? 'var(--am)' : 'var(--tx2)', fontWeight: b.highlight ? 500 : 400 }}>{b.label}</span>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      title: 'Appuie sur "Sur l\'écran d\'accueil"',
      desc: 'Dans le menu qui s\'ouvre, fais défiler et appuie sur cette option.',
      visual: (
        <div style={{ background:'var(--bg3)', borderRadius:10, padding:10, marginTop:8 }}>
          {[
            { label:'Copier le lien', highlight:false },
            { label:'Partager', highlight:false },
            { label:'Sur l\'écran d\'accueil', highlight:true },
            { label:'Ajouter aux favoris', highlight:false },
          ].map(r => (
            <div key={r.label} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 10px', borderBottom:'1px solid var(--border)', background: r.highlight ? 'rgba(245,166,35,0.08)' : 'transparent', borderRadius: r.highlight ? 8 : 0 }}>
              <span style={{ fontSize:13, color: r.highlight ? 'var(--am)' : 'var(--tx)', fontWeight: r.highlight ? 500 : 400 }}>{r.label}</span>
              {r.highlight && <span style={{ marginLeft:'auto', fontSize:10, background:'rgba(34,197,94,0.15)', color:'#4ade80', padding:'2px 8px', borderRadius:20 }}>← ici</span>}
            </div>
          ))}
        </div>
      ),
    },
    {
      title: 'Confirme en appuyant sur "Ajouter"',
      desc: 'Vérifie le nom et appuie sur "Ajouter" en haut à droite. L\'icône apparaît sur ton écran d\'accueil.',
      visual: (
        <div style={{ background:'var(--bg3)', borderRadius:10, padding:10, marginTop:8 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10, paddingBottom:8, borderBottom:'1px solid var(--border)' }}>
            <span style={{ fontSize:12, color:'var(--am)' }}>Annuler</span>
            <span style={{ fontSize:12, fontWeight:500, color:'var(--tx)' }}>Écran d'accueil</span>
            <span style={{ fontSize:12, fontWeight:600, color:'var(--am)' }}>Ajouter</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:42, height:42, borderRadius:10, background:'rgba(245,166,35,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>🍺</div>
            <div>
              <div style={{ fontSize:13, fontWeight:500, color:'var(--tx)' }}>Objectif 1M Pintes</div>
              <div style={{ fontSize:11, color:'var(--tx2)' }}>objectif-1m-pintes.vercel.app</div>
            </div>
          </div>
        </div>
      ),
    },
  ]

  const ANDROID_STEPS = [
    {
      title: 'Ouvre Chrome et va sur le site',
      desc: "Tape l'URL dans Chrome. L'installation PWA fonctionne mieux depuis Chrome sur Android.",
      visual: (
        <div style={{ background:'var(--bg3)', borderRadius:10, padding:10, marginTop:8 }}>
          <div style={{ background:'var(--card-bg)', borderRadius:8, padding:'8px 10px', display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--tx2)" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            <span style={{ fontSize:11, color:'var(--tx2)', flex:1 }}>objectif-1m-pintes.vercel.app</span>
          </div>
          <div style={{ background:'var(--card-bg)', borderRadius:8, height:44, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, color:'var(--tx2)' }}>Page de l'app chargée 🍺</div>
        </div>
      ),
    },
    {
      title: 'Appuie sur les 3 points en haut à droite',
      desc: 'Le menu Chrome s\'ouvre. Cherche "Ajouter à l\'écran d\'accueil" ou "Installer l\'application".',
      visual: (
        <div style={{ background:'var(--bg3)', borderRadius:10, padding:10, marginTop:8 }}>
          {[
            { label:'Nouvel onglet', highlight:false },
            { label:'Ajouter à l\'écran d\'accueil', highlight:true },
            { label:'Paramètres', highlight:false },
          ].map(r => (
            <div key={r.label} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 10px', background: r.highlight ? 'rgba(245,166,35,0.08)' : 'transparent', borderBottom:'1px solid var(--border)', borderRadius: r.highlight ? 8 : 0 }}>
              <span style={{ fontSize:13, color: r.highlight ? 'var(--am)' : 'var(--tx)', fontWeight: r.highlight ? 500 : 400 }}>{r.label}</span>
              {r.highlight && <span style={{ marginLeft:'auto', fontSize:10, background:'rgba(34,197,94,0.15)', color:'#4ade80', padding:'2px 8px', borderRadius:20 }}>← ici</span>}
            </div>
          ))}
        </div>
      ),
    },
    {
      title: 'Appuie sur "Ajouter" ou "Installer"',
      desc: 'Une popup apparaît. Confirme en appuyant sur "Ajouter". Chrome peut aussi proposer un bandeau en bas de l\'écran.',
      visual: (
        <div style={{ background:'var(--bg3)', borderRadius:10, padding:10, marginTop:8 }}>
          <div style={{ background:'var(--card-bg)', borderRadius:10, padding:12 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
              <div style={{ width:40, height:40, borderRadius:9, background:'rgba(245,166,35,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>🍺</div>
              <div>
                <div style={{ fontSize:13, fontWeight:500, color:'var(--tx)' }}>Objectif 1M Pintes</div>
                <div style={{ fontSize:11, color:'var(--tx2)' }}>objectif-1m-pintes.vercel.app</div>
              </div>
            </div>
            <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
              <div style={{ padding:'7px 14px', borderRadius:8, border:'1px solid var(--border)', fontSize:12, color:'var(--tx2)' }}>Annuler</div>
              <div style={{ padding:'7px 14px', borderRadius:8, background:'var(--am)', fontSize:12, color:'#0d0d0d', fontWeight:500 }}>Ajouter</div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "L'icône apparaît sur ton écran d'accueil",
      desc: "L'app s'ouvre en plein écran comme une vraie app Android, sans barre Chrome.",
      visual: (
        <div style={{ background:'var(--bg3)', borderRadius:10, padding:12, marginTop:8, display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:48, height:48, borderRadius:12, background:'rgba(245,166,35,0.15)', border:'1px solid rgba(245,166,35,0.3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24 }}>🍺</div>
          <div>
            <div style={{ fontSize:12, fontWeight:500, color:'var(--tx)' }}>Objectif 1M</div>
            <div style={{ fontSize:10, color:'var(--tx2)' }}>Pintes</div>
          </div>
          <span style={{ marginLeft:'auto', fontSize:11, background:'rgba(34,197,94,0.12)', color:'#4ade80', padding:'3px 10px', borderRadius:20, border:'1px solid rgba(34,197,94,0.2)' }}>Installé !</span>
        </div>
      ),
    },
  ]

  const steps = os === 'ios' ? IOS_STEPS : ANDROID_STEPS

  return (
    <div style={{ minHeight:'100dvh', paddingBottom:100, background:'var(--bg)' }}>
      <div style={{ padding:'52px 16px 16px', borderBottom:'1px solid var(--border)' }}>
        <div style={{ fontFamily:'Bebas Neue,sans-serif', fontSize:28, color:'var(--tx)' }}>INSTALLER L'APP</div>
        <div style={{ fontSize:12, color:'var(--tx2)', marginTop:2 }}>Ajoute l'app sur ton écran d'accueil</div>
      </div>

      <div style={{ padding:'14px 14px 0' }}>
        {/* Toggle OS */}
        <div style={{ display:'flex', gap:6, background:'var(--bg3)', borderRadius:10, padding:4, marginBottom:20 }}>
          {[['ios','🍎 iPhone / iPad'],['android','🤖 Android']].map(([id, label]) => (
            <button key={id} onClick={() => setOs(id)} style={{
              flex:1, padding:'9px 0', borderRadius:8, border:'none',
              background: os===id ? 'var(--am)' : 'transparent',
              color: os===id ? '#0d0d0d' : 'var(--tx2)',
              fontSize:13, fontWeight: os===id ? 500 : 400,
              cursor:'pointer', fontFamily:'DM Sans,sans-serif', transition:'all .15s',
            }}>{label}</button>
          ))}
        </div>

        {/* Étapes */}
        {steps.map((step, i) => (
          <div key={i} style={{ display:'flex', gap:14, paddingBottom:20, marginBottom:20, borderBottom: i<steps.length-1 ? '1px solid var(--border)' : 'none' }}>
            <div style={{ width:28, height:28, borderRadius:'50%', background:'rgba(245,166,35,0.15)', border:'1px solid rgba(245,166,35,0.3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:600, color:'var(--am)', flexShrink:0, marginTop:2 }}>
              {i+1}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:14, fontWeight:500, color:'var(--tx)', marginBottom:4 }}>{step.title}</div>
              <div style={{ fontSize:12, color:'var(--tx2)', lineHeight:1.6 }}>{step.desc}</div>
              {step.visual}
            </div>
          </div>
        ))}

        {/* Tip final */}
        <div style={{ background:'rgba(245,166,35,0.08)', border:'1px solid rgba(245,166,35,0.2)', borderRadius:12, padding:'12px 14px', display:'flex', gap:10 }}>
          <span style={{ fontSize:18 }}>💡</span>
          <div style={{ fontSize:12, color:'var(--tx2)', lineHeight:1.5 }}>
            Une fois installée, l'app s'ouvre en plein écran sans barre de navigateur et peut recevoir des notifications.
          </div>
        </div>
      </div>
    </div>
  )
}
