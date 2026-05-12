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

const REPORT_REASONS = [
  { value: 'not_pint', label: '🍺 Pas une pinte (mauvaise contenance)' },
  { value: 'not_beer', label: '❌ Pas de la bière' },
  { value: 'too_empty', label: '📉 Verre trop vide' },
  { value: 'selfie', label: '🤳 C\'est un selfie / pas le verre' },
  { value: 'offensive', label: '🤬 Message offensant ou inapproprié' },
  { value: 'other', label: '… Autre' },
]

function ReportModal({ pinte, onClose, onReported }) {
  const [selectedReason, setSelectedReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function submitReport() {
    if (!selectedReason) return
    setLoading(true)
    const { error } = await supabase.from('reports').insert({
      pinte_id: pinte.id,
      reason: selectedReason,
    })
    if (error) {
      console.error('Erreur signalement:', error)
      setLoading(false)
      return
    }
    setDone(true)
    setLoading(false)
    setTimeout(() => {
      onReported(pinte.id)
      onClose()
    }, 1200)
  }

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 999, padding: '0 20px',
      }}
    >
      <div style={{
        background: 'var(--card-bg)', border: '1px solid var(--border)',
        borderRadius: 20, padding: 20, width: '100%', maxWidth: 360,
      }}>
        {done ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>✅</div>
            <div style={{ color: 'var(--tx)', fontSize: 14 }}>Signalement envoyé</div>
          </div>
        ) : (
          <>
            <div style={{ fontFamily: 'Bebas Neue,sans-serif', fontSize: 20, color: 'var(--tx)', marginBottom: 4 }}>
              🚩 SIGNALER CETTE PINTE
            </div>
            <div style={{ fontSize: 12, color: 'var(--tx2)', marginBottom: 16 }}>
              Pinte #{pinte.numero_global} de {pinte.profiles?.username || 'Anonyme'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {REPORT_REASONS.map(r => (
                <button
                  key={r.value}
                  onClick={() => setSelectedReason(r.value)}
                  style={{
                    padding: '10px 14px', borderRadius: 10, cursor: 'pointer',
                    fontSize: 13, textAlign: 'left', transition: 'all .15s',
                    background: selectedReason === r.value ? 'rgba(239,68,68,0.12)' : 'var(--bg3)',
                    border: selectedReason === r.value ? '1px solid rgba(239,68,68,0.4)' : '1px solid var(--border)',
                    color: selectedReason === r.value ? '#f87171' : 'var(--tx)',
                  }}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={onClose}
                style={{
                  flex: 1, padding: '11px', borderRadius: 10, cursor: 'pointer',
                  background: 'var(--bg3)', border: '1px solid var(--border)',
                  color: 'var(--tx2)', fontSize: 13,
                }}
              >
                Annuler
              </button>
              <button
                onClick={submitReport}
                disabled={!selectedReason || loading}
                style={{
                  flex: 1, padding: '11px', borderRadius: 10,
                  cursor: selectedReason && !loading ? 'pointer' : 'not-allowed',
                  background: selectedReason ? 'rgba(239,68,68,0.15)' : 'var(--bg3)',
                  border: selectedReason ? '1px solid rgba(239,68,68,0.35)' : '1px solid var(--border)',
                  color: selectedReason ? '#f87171' : 'var(--tx2)', fontSize: 13, fontWeight: 500,
                  opacity: loading ? 0.6 : 1,
                }}
              >
                Signaler
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function PinteCard({ pinte, index, isAdmin, onDelete, reportedIds, onOpenReport }) {
  const alreadyReported = reportedIds.has(pinte.id)

  async function deletePinte() {
    if (!window.confirm('Supprimer cette pinte ? Les numéros seront recalculés.')) return
    await supabase.from('pintes').delete().eq('id', pinte.id)
    await supabase.rpc('renumeroter_pintes')
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
        <div onClick={() => pinte.user_id && navigate(`/u/${pinte.user_id}`)} style={{ cursor: pinte.user_id ? 'pointer' : 'default' }}>
          <Avatar username={pinte.profiles?.username} avatarUrl={pinte.profiles?.avatar_url} size={38} border />
        </div>
        <div style={{ flex:1, minWidth:0 }} onClick={() => pinte.user_id && navigate(`/u/${pinte.user_id}`)} style={{ flex:1, minWidth:0, cursor: pinte.user_id ? 'pointer' : 'default' }}>
          <div style={{ fontSize:14, fontWeight:500, color:'var(--tx)' }}>{pinte.profiles?.username || 'Anonyme'}</div>
          <div style={{ fontSize:11, color:'var(--tx2)', marginTop:1 }}>
            {pinte.lieu || 'Lieu inconnu'} · {timeAgo(pinte.created_at)}
          </div>
        </div>
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

      {/* Bouton signaler */}
      <div style={{ padding:'0 14px 12px', display:'flex', justifyContent:'flex-end' }}>
        <button
          onClick={() => !alreadyReported && onOpenReport(pinte)}
          style={{
            display:'flex', alignItems:'center', gap:4,
            padding:'5px 10px', borderRadius:20, fontSize:11,
            cursor: alreadyReported ? 'default' : 'pointer',
            background: alreadyReported ? 'rgba(239,68,68,0.08)' : 'transparent',
            border: alreadyReported ? '1px solid rgba(239,68,68,0.2)' : '1px solid var(--border)',
            color: alreadyReported ? '#f87171' : 'var(--tx2)',
            transition:'all .15s',
          }}
        >
          🚩 {alreadyReported ? 'Signalé' : 'Signaler'}
        </button>
      </div>
    </div>
  )
}

import ProfileAvatar from '../components/ProfileAvatar.jsx'
import { useNavigate } from 'react-router-dom'

export default function FeedPage() {
  const [pintes, setPintes] = useState([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [reportModal, setReportModal] = useState(null)
  const [reportedIds, setReportedIds] = useState(new Set())
  const { profile } = useAuth()
  const navigate = useNavigate()
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
    const { count } = await supabase.from('pintes')
      .select('*', { count: 'exact', head: true })
    setTotal(count || 0)
  }

  function handleReported(pinteId) {
    setReportedIds(prev => new Set([...prev, pinteId]))
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
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <button onClick={() => { fetchFeed(); fetchTotal() }} style={{
                width:32, height:32, borderRadius:'50%',
                background:'var(--bg3)', border:'1px solid var(--border)',
                display:'flex', alignItems:'center', justifyContent:'center',
                cursor:'pointer', fontSize:15, color:'var(--tx2)',
                transition:'transform .3s',
              }}
                onMouseDown={e => e.currentTarget.style.transform='rotate(180deg)'}
                onMouseUp={e => setTimeout(()=>e.currentTarget.style.transform='rotate(0)',300)}
              >↺</button>
              <NotifBell />
              <ProfileAvatar />
            </div>
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
              reportedIds={reportedIds}
              onOpenReport={setReportModal}
              onDelete={pid => setPintes(prev => prev.filter(x => x.id !== pid))}
            />
          ))
        )}
      </div>

      {reportModal && (
        <ReportModal
          pinte={reportModal}
          onClose={() => setReportModal(null)}
          onReported={handleReported}
        />
      )}

      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
      `}</style>
    </div>
  )
}
