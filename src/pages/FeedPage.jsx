import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth.jsx'
import Reactions from '../components/Reactions.jsx'
import Avatar from '../components/Avatar.jsx'
import NotifBell from '../components/NotifBell.jsx'

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return "à l'instant"
  if (m < 60) return `il y a ${m}min`
  const h = Math.floor(m / 60)
  if (h < 24) return `il y a ${h}h`
  return `il y a ${Math.floor(h / 24)}j`
}

function PinteCard({ pinte, index, isAdmin, onDelete }) {
  async function deletePinte() {
    if (!window.confirm('Supprimer cette pinte ?')) return
    await supabase.from('pintes').delete().eq('id', pinte.id)
    onDelete(pinte.id)
  }

  return (
    <div style={{
      background:'var(--card-bg)', border:'1px solid var(--border)',
      borderRadius:20, overflow:'hidden',
      animation:`fadeUp 0.4s ${index * 0.06}s ease both`,
      opacity:0, animationFillMode:'forwards',
    }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 14px' }}>
        <Avatar username={pinte.profiles?.username} avatarUrl={pinte.profiles?.avatar_url} size={38} border />
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:14, fontWeight:500, color:'var(--tx)' }}>{pinte.profiles?.username || 'Anonyme'}</div>
          <div style={{ fontSize:11, color:'var(--tx2)', marginTop:1 }}>
            {pinte.lieu || 'Lieu inconnu'} · {timeAgo(pinte.created_at)}
          </div>
        </div>
        {/* Badge numéro + bouton suppression admin */}
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <div style={{
            background:'var(--am)', color:'#0a0a0a',
            fontFamily:'Bebas Neue,sans-serif', fontSize:17,
            padding:'4px 10px', borderRadius:20, letterSpacing:'.05em',
          }}>
            #{pinte.numero_global}
          </div>
          {isAdmin && (
            <button onClick={deletePinte} style={{
              width:30, height:30, borderRadius:'50%',
              background:'rgba(239,68,68,0.15)',
              border:'1px solid rgba(239,68,68,0.3)',
              color:'#f87171', cursor:'pointer',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:15, flexShrink:0,
            }}>🗑</button>
          )}
        </div>
      </div>

      {/* Photo */}
      <div style={{ aspectRatio:'4/3', background:'var(--bg3)', overflow:'hidden' }}>
        {pinte.photo_url ? (
          <img src={pinte.photo_url} alt={`Pinte #${pinte.numero_global}`}
            style={{ width:'100%', height:'100%', objectFit:'cover' }} loading="lazy" />
        ) : (
          <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:48 }}>🍺</div>
        )}
      </div>

      {pinte.type_boisson && (
        <div style={{ padding:'6px 14px 0', fontSize:11, color:'var(--tx2)', fontStyle:'italic' }}>
          {pinte.type_boisson}
        </div>
      )}

      <Reactions pinteId={pinte.id} />
    </div>
  )
}

export default function FeedPage() {
  const [pintes, setPintes] = useState([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const { profile } = useAuth()
  const isAdmin = profile?.is_admin === true

  useEffect(() => {
    fetchFeed(); fetchTotal()
    const channel = supabase.channel('pintes-feed')
      .on('postgres_changes', { event:'INSERT', schema:'public', table:'pintes' }, () => { fetchFeed(); fetchTotal() })
      .subscribe()
    const interval = setInterval(() => { fetchFeed(); fetchTotal() }, 10000)
    function handleVisibility() {
      if (document.visibilityState === 'visible') { fetchFeed(); fetchTotal() }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => {
      supabase.removeChannel(channel)
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [])

  async function fetchFeed() {
    const { data } = await supabase.from('pintes')
      .select('*, profiles(username, total_perso, avatar_url)')
      .not('user_id', 'is', null)
      .order('created_at', { ascending:false })
      .limit(30)
    setPintes(data || [])
    setLoading(false)
  }

  async function fetchTotal() {
    const { count } = await supabase.from('pintes').select('*', { count:'exact', head:true })
    setTotal(count || 0)
  }

  const pct = ((total / 1000000) * 100).toFixed(3)

  return (
    <div style={{ minHeight:'100dvh', paddingBottom:90, background:'var(--bg)' }}>
      <div style={{
        padding:'52px 16px 16px',
        background:'linear-gradient(180deg,rgba(245,166,35,0.08) 0%,transparent 100%)',
        borderBottom:'1px solid var(--border)',
      }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
          <div>
            <div style={{ fontFamily:'Bebas Neue,sans-serif', fontSize:13, color:'var(--am)', letterSpacing:'.08em' }}>OBJECTIF</div>
            <div style={{ fontFamily:'Bebas Neue,sans-serif', fontSize:34, color:'var(--tx)', lineHeight:.95 }}>1 MILLION</div>
            <div style={{ fontFamily:'Bebas Neue,sans-serif', fontSize:34, color:'var(--tx)', lineHeight:.95 }}>DE PINTES</div>
          </div>
          <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:8 }}>
            <NotifBell />
            <div style={{ textAlign:'right' }}>
              <div style={{ fontFamily:'Bebas Neue,sans-serif', fontSize:28, color:'var(--am)', lineHeight:1 }}>
                {total.toLocaleString('fr-FR')}
              </div>
              <div style={{ fontSize:10, color:'var(--tx2)' }}>/ 1 000 000</div>
            </div>
          </div>
        </div>
        <div style={{ margin:'12px 0 4px', background:'var(--bg3)', borderRadius:4, height:5, overflow:'hidden' }}>
          <div style={{ height:5, borderRadius:4, background:'linear-gradient(90deg,#c4841a,#ffc85a)', width:`${Math.max(parseFloat(pct),0.02)}%`, minWidth:4, transition:'width .5s ease' }} />
        </div>
        <div style={{ fontSize:10, color:'var(--tx2)' }}>
          {pct}% de l'objectif · Salut {profile?.username} 👋
        </div>
      </div>

      <div style={{ padding:'14px 14px 0', display:'flex', flexDirection:'column', gap:14 }}>
        {loading ? (
          [0,1,2].map(i => (
            <div key={i} style={{ height:320, borderRadius:20, background:'linear-gradient(90deg,var(--bg2) 25%,var(--bg3) 50%,var(--bg2) 75%)', backgroundSize:'200% 100%', animation:'shimmer 1.5s infinite' }} />
          ))
        ) : pintes.length === 0 ? (
          <div style={{ textAlign:'center', padding:'60px 0', color:'var(--tx2)' }}>
            <div style={{ fontSize:48, marginBottom:12 }}>🍺</div>
            <p style={{ fontSize:14 }}>Pas encore de pinte. Sois le premier !</p>
          </div>
        ) : (
          pintes.map((p, i) => (
            <PinteCard
              key={p.id} pinte={p} index={i}
              isAdmin={isAdmin}
              onDelete={pid => setPintes(prev => prev.filter(x => x.id !== pid))}
            />
          ))
        )}
      </div>

      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
      `}</style>
    </div>
  )
}
