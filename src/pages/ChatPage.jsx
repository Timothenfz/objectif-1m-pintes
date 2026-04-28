import { useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth.jsx'

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return "à l'instant"
  if (m < 60) return `${m}min`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

function hue(str) { return (str?.charCodeAt(0) || 0) * 15 % 360 }

export default function ChatPage() {
  const { user, profile } = useAuth()
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef()
  const inputRef = useRef()

  useEffect(() => {
    fetchMessages()
    const channel = supabase.channel('chat')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages_chat' }, payload => {
        setMessages(prev => [...prev, payload.new])
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  useEffect(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'instant' }), 100)
  }, [messages.length === 0])

  async function fetchMessages() {
    const { data } = await supabase
      .from('messages_chat')
      .select('*, profiles(username)')
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

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: '#0d0d0d' }}>
      {/* Header */}
      <div style={{ padding: '52px 16px 14px', borderBottom: '1px solid rgba(255,255,255,0.07)', background: '#0d0d0d', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 28 }}>💬</div>
          <div>
            <div style={{ fontFamily: 'Bebas Neue,sans-serif', fontSize: 28, color: '#ede9e0', lineHeight: 1 }}>CHAT</div>
            <div style={{ fontSize: 11, color: '#7a7670' }}>Chat communautaire</div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10, scrollbarWidth: 'none' }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#7a7670' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>💬</div>
            <p style={{ fontSize: 14 }}>Sois le premier à écrire !</p>
          </div>
        )}
        {messages.map((msg, i) => {
          const me = isMe(msg)
          const username = msg.profiles?.username || 'Anonyme'
          const h = hue(username)
          const showAvatar = !me && (i === 0 || messages[i-1]?.user_id !== msg.user_id)
          const showName = showAvatar
          return (
            <div key={msg.id} style={{
              display: 'flex',
              flexDirection: me ? 'row-reverse' : 'row',
              alignItems: 'flex-end',
              gap: 8,
            }}>
              {/* Avatar */}
              {!me && (
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                  background: showAvatar ? `hsl(${h},40%,18%)` : 'transparent',
                  border: showAvatar ? `1.5px solid hsl(${h},55%,40%)` : 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 500,
                  color: `hsl(${h},80%,70%)`,
                  marginBottom: 2,
                }}>
                  {showAvatar ? username[0].toUpperCase() : ''}
                </div>
              )}

              <div style={{ maxWidth: '72%', display: 'flex', flexDirection: 'column', gap: 2, alignItems: me ? 'flex-end' : 'flex-start' }}>
                {showName && (
                  <div style={{ fontSize: 10, color: '#7a7670', marginLeft: 4 }}>{username}</div>
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
                <div style={{ fontSize: 9, color: '#3a3834', marginLeft: 4, marginRight: 4 }}>
                  {timeAgo(msg.created_at)}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: '10px 14px 28px',
        borderTop: '1px solid rgba(255,255,255,0.07)',
        background: '#0d0d0d',
        display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
          background: `hsl(${hue(profile?.username)},40%,18%)`,
          border: `1.5px solid hsl(${hue(profile?.username)},55%,40%)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 500,
          color: `hsl(${hue(profile?.username)},80%,70%)`,
        }}>
          {(profile?.username || '?')[0].toUpperCase()}
        </div>
        <input
          ref={inputRef}
          value={text}
          onChange={e => setText(e.target.value.slice(0, 500))}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
          placeholder="Écrire un message..."
          style={{
            flex: 1, padding: '10px 14px',
            background: '#181818', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 22, color: '#ede9e0', fontSize: 13,
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
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={text.trim() ? '#0d0d0d' : '#7a7670'} strokeWidth="2.5" strokeLinecap="round">
            <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22,2 15,22 11,13 2,9"/>
          </svg>
        </button>
      </div>
    </div>
  )
}
