import { useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth.jsx'
import Avatar from '../components/Avatar.jsx'

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return "à l'instant"
  if (m < 60) return `${m}min`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

export default function ChatPage() {
  const { user, profile } = useAuth()
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef()
  const inputRef = useRef()

  useEffect(() => {
    fetchMessages()

    let channel
    function subscribe() {
      channel = supabase.channel('chat-' + Date.now())
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages_chat' }, payload => {
          fetchMessages()
          setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
        })
        .subscribe((status) => {
          if (status === 'CLOSED') setTimeout(subscribe, 2000)
        })
    }
    subscribe()

    // Recharger quand l'app revient au premier plan
    function handleVisibility() {
      if (document.visibilityState === 'visible') fetchMessages()
    }
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      if (channel) supabase.removeChannel(channel)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [])

  async function fetchMessages() {
    const { data } = await supabase
      .from('messages_chat')
      .select('*, profiles(username, avatar_url)')
      .order('created_at', { ascending: true })
      .limit(100)
    setMessages(data || [])
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'instant' }), 100)
  }

  async function sendMessage() {
    const t = text.trim()
    if (!t || loading) return
    setLoading(true)
    setText('')
    await supabase.from('messages_chat').insert({ user_id: user.id, texte: t })
    setLoading(false)
    inputRef.current?.focus()
  }

  const isMe = (msg) => msg.user_id === user?.id
  const INPUT_H = 70
  const NAV_H = 76
  const HEADER_H = 88

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--bg)', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '52px 16px 12px', borderBottom: '1px solid var(--border)', background: 'var(--bg)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 24 }}>💬</div>
          <div>
            <div style={{ fontFamily: 'Bebas Neue,sans-serif', fontSize: 26, color: 'var(--tx)', lineHeight: 1 }}>CHAT</div>
            <div style={{ fontSize: 11, color: 'var(--tx2)' }}>Chat communautaire</div>
          </div>
        </div>
      </div>

      {/* Messages — scroll entre header et input */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '12px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        scrollbarWidth: 'none',
        // espace pour input + nav
        paddingBottom: INPUT_H + NAV_H + 8,
      }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--tx2)' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>💬</div>
            <p style={{ fontSize: 14 }}>Sois le premier à écrire !</p>
          </div>
        )}
        {messages.map((msg, i) => {
          const me = isMe(msg)
          const username = msg.profiles?.username || 'Anonyme'
          const showAvatar = !me && (i === 0 || messages[i - 1]?.user_id !== msg.user_id)
          return (
            <div key={msg.id} style={{ display: 'flex', flexDirection: me ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: 8 }}>
              {!me && (
                <div style={{ width: 28, flexShrink: 0 }}>
                  {showAvatar && (
                    <Avatar username={username} avatarUrl={msg.profiles?.avatar_url} size={28} />
                  )}
                </div>
              )}
              <div style={{ maxWidth: '72%', display: 'flex', flexDirection: 'column', gap: 2, alignItems: me ? 'flex-end' : 'flex-start' }}>
                {showAvatar && !me && (
                  <div style={{ fontSize: 10, color: 'var(--tx2)', marginLeft: 4 }}>{username}</div>
                )}
                <div style={{
                  padding: '9px 13px',
                  borderRadius: me ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  background: me ? '#f5a623' : '#222',
                  color: me ? '#0d0d0d' : '#ede9e0',
                  fontSize: 13, lineHeight: 1.45,
                }}>
                  {msg.texte}
                </div>
                <div style={{ fontSize: 9, color: 'var(--tx3)', marginLeft: 4, marginRight: 4 }}>
                  {timeAgo(msg.created_at)}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input — positionné juste AU-DESSUS de la nav */}
      <div style={{
        position: 'fixed',
        bottom: NAV_H,
        left: 0, right: 0,
        padding: '10px 14px 10px',
        borderTop: '1px solid var(--border)',
        background: 'var(--bg)',
        display: 'flex', gap: 10, alignItems: 'center',
        zIndex: 99,
      }}>
        <Avatar username={profile?.username} avatarUrl={profile?.avatar_url} size={32} />
        <input
          ref={inputRef}
          value={text}
          onChange={e => setText(e.target.value.slice(0, 500))}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
          placeholder="Écrire un message..."
          style={{
            flex: 1, padding: '10px 14px',
            background: 'var(--card-bg)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 22, color: 'var(--tx)', fontSize: 13,
            fontFamily: 'DM Sans,sans-serif', outline: 'none',
          }}
        />
        <button onClick={sendMessage} disabled={!text.trim() || loading} style={{
          width: 38, height: 38, borderRadius: '50%',
          background: text.trim() ? '#f5a623' : '#222',
          border: 'none', cursor: text.trim() ? 'pointer' : 'default',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all .15s', flexShrink: 0,
        }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={text.trim() ? '#0d0d0d' : '#7a7670'} strokeWidth="2.5" strokeLinecap="round">
            <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22,2 15,22 11,13 2,9"/>
          </svg>
        </button>
      </div>
    </div>
  )
}
