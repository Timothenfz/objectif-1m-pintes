import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth.jsx'

export default function NotifBell() {
  const { user } = useAuth()
  const [notifs, setNotifs] = useState([])
  const [open, setOpen] = useState(false)
  const ref = useRef()
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) return
    fetchNotifs()
    const channel = supabase.channel('notifs-' + user.id)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, () => fetchNotifs())
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [user])

  useEffect(() => {
    function handler(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  async function fetchNotifs() {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)
    setNotifs(data || [])
  }

  async function markAllRead() {
    await supabase.from('notifications').update({ lu: true }).eq('user_id', user.id).eq('lu', false)
    setNotifs(prev => prev.map(n => ({ ...n, lu: true })))
  }

  async function handleClick(notif) {
    await supabase.from('notifications').update({ lu: true }).eq('id', notif.id)
    setNotifs(prev => prev.map(n => n.id === notif.id ? { ...n, lu: true } : n))
    setOpen(false)
    if (notif.lien) navigate(notif.lien)
  }

  const unread = notifs.filter(n => !n.lu).length

  const typeIcon = {
    reaction: '😄', comment: '💬', milestone: '🏆',
    defi: '🎯', podium: '🥇', ami: '👋'
  }

  function timeAgo(d) {
    const diff = Date.now() - new Date(d).getTime()
    const m = Math.floor(diff / 60000)
    if (m < 1) return "à l'instant"
    if (m < 60) return `${m}min`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h}h`
    return `${Math.floor(h / 24)}j`
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => { setOpen(o => !o); if (!open) markAllRead() }} style={{
        position: 'relative', width: 36, height: 36, borderRadius: '50%',
        background: 'var(--bg3)', border: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', color: 'var(--tx)',
      }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>
        </svg>
        {unread > 0 && (
          <div style={{
            position: 'absolute', top: -2, right: -2,
            width: 18, height: 18, borderRadius: '50%',
            background: '#f87171', border: '2px solid var(--bg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, fontWeight: 700, color: 'white',
          }}>
            {unread > 9 ? '9+' : unread}
          </div>
        )}
      </button>

      {open && (
        <div style={{
          position: 'fixed', top: 80, right: 14, left: 14,
          background: 'var(--card-bg)', border: '1px solid var(--border2)',
          borderRadius: 16, overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          zIndex: 200, maxHeight: '70dvh', overflowY: 'auto',
        }}>
          <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontFamily: 'Bebas Neue,sans-serif', fontSize: 18, color: 'var(--tx)' }}>NOTIFICATIONS</div>
            {unread > 0 && <button onClick={markAllRead} style={{ fontSize: 11, color: 'var(--tx2)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'DM Sans,sans-serif' }}>Tout marquer lu</button>}
          </div>
          {notifs.length === 0 ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--tx2)', fontSize: 13 }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>🔔</div>
              Aucune notification
            </div>
          ) : notifs.map(n => (
            <div key={n.id} onClick={() => handleClick(n)} style={{
              display: 'flex', gap: 12, padding: '12px 14px',
              borderBottom: '1px solid var(--border)',
              background: n.lu ? 'transparent' : 'rgba(245,166,35,0.05)',
              cursor: 'pointer', transition: 'background .15s',
            }}>
              <div style={{ fontSize: 22, flexShrink: 0 }}>{typeIcon[n.type] || '🔔'}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--tx)' }}>{n.titre}</div>
                <div style={{ fontSize: 12, color: 'var(--tx2)', marginTop: 2, lineHeight: 1.4 }}>{n.message}</div>
                <div style={{ fontSize: 10, color: 'var(--tx3)', marginTop: 4 }}>{timeAgo(n.created_at)}</div>
              </div>
              {!n.lu && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--am)', flexShrink: 0, marginTop: 4 }} />}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
