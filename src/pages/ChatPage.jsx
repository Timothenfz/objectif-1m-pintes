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

const NAV_H = 76

import ProfileAvatar from '../components/ProfileAvatar.jsx'

export default function ChatPage() {
  const { user, profile } = useAuth()
  const isAdmin = profile?.is_admin === true
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const bottomRef = useRef()
  const inputRef = useRef()
  const photoRef = useRef()

  useEffect(() => {
    fetchMessages()
    let channel
    function subscribe() {
      channel = supabase.channel('chat-' + Date.now())
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages_chat' }, () => {
          fetchMessages()
          setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
        })
        .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'messages_chat' }, () => {
          fetchMessages()
        })
        .subscribe((status) => {
          if (status === 'CLOSED') setTimeout(subscribe, 2000)
        })
    }
    subscribe()
    function handleVisibility() {
      if (document.visibilityState === 'visible') fetchMessages()
    }
    document.addEventListener('visibilitychange', handleVisibility)
    const interval = setInterval(fetchMessages, 5000)
    return () => {
      if (channel) supabase.removeChannel(channel)
      document.removeEventListener('visibilitychange', handleVisibility)
      clearInterval(interval)
    }
  }, [])

  async function fetchMessages() {
    const { data } = await supabase
      .from('messages_chat')
      .select('*, profiles(username, avatar_url)')
      .order('created_at', { ascending: true })
      .limit(100)
    setMessages(data || [])
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'instant' }), 50)
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

  async function sendPhoto(e) {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) { alert('Photo trop lourde (max 10MB)'); return }
    setUploadingPhoto(true)

    // Compresser
    const compressed = await compressImage(file)
    const path = `chat/${user.id}/${Date.now()}.jpg`
    const { error: uploadError } = await supabase.storage.from('pintes').upload(path, compressed)
    if (uploadError) {
      console.error('Erreur upload photo chat:', uploadError)
      alert('Erreur upload : ' + uploadError.message)
      setUploadingPhoto(false)
      photoRef.current.value = ''
      return
    }
    const { data: { publicUrl } } = supabase.storage.from('pintes').getPublicUrl(path)
    await supabase.from('messages_chat').insert({ user_id: user.id, texte: `[photo]${publicUrl}` })
    setUploadingPhoto(false)
    photoRef.current.value = ''
  }

  function compressImage(file) {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()
      const url = URL.createObjectURL(file)
      img.onload = () => {
        let w = img.width, h = img.height
        const max = 800
        if (w > max || h > max) {
          if (w > h) { h = Math.round(h * max / w); w = max }
          else { w = Math.round(w * max / h); h = max }
        }
        canvas.width = w; canvas.height = h
        ctx.drawImage(img, 0, 0, w, h)
        URL.revokeObjectURL(url)
        canvas.toBlob(blob => {
          resolve(new File([blob], 'chat.jpg', { type: 'image/jpeg' }))
        }, 'image/jpeg', 0.7)
      }
      img.src = url
    })
  }

  async function deleteMessage(id) {
    if (!window.confirm('Supprimer ce message ?')) return
    await supabase.from('messages_chat').delete().eq('id', id)
  }

  const isMe = (msg) => msg.user_id === user?.id

  function renderContent(texte) {
    if (texte?.startsWith('[photo]')) {
      const url = texte.replace('[photo]', '')
      return (
        <img src={url} alt="photo" style={{ maxWidth: '100%', borderRadius: 10, display: 'block', maxHeight: 200, objectFit: 'cover', cursor: 'pointer' }}
          onClick={() => window.open(url, '_blank')} />
      )
    }
    return texte
  }

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--bg)', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '52px 16px 12px', borderBottom: '1px solid var(--border)', background: 'var(--bg)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 24 }}>💬</div>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily: 'Bebas Neue,sans-serif', fontSize: 26, color: 'var(--tx)', lineHeight: 1 }}>CHAT</div>
            <div style={{ fontSize: 11, color: 'var(--tx2)' }}>Chat communautaire</div>
          </div>
          <ProfileAvatar />
        </div>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '12px 14px',
        display: 'flex', flexDirection: 'column', gap: 10,
        scrollbarWidth: 'none',
        paddingBottom: NAV_H + 70 + 8,
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
          const isNewSender = i === 0 || messages[i-1]?.user_id !== msg.user_id
          const isPhoto = msg.texte?.startsWith('[photo]')

          return (
            <div key={msg.id} style={{ display: 'flex', flexDirection: me ? 'row-reverse' : 'row', alignItems: 'flex-start', gap: 8, marginTop: isNewSender && i > 0 ? 6 : 2 }}>
              {!me && (
                <div style={{ flexShrink: 0, marginTop: isNewSender ? 16 : 0, opacity: isNewSender ? 1 : 0 }}>
                  <Avatar username={username} avatarUrl={msg.profiles?.avatar_url} size={30} />
                </div>
              )}
              <div style={{ maxWidth: '72%', display: 'flex', flexDirection: 'column', gap: 2, alignItems: me ? 'flex-end' : 'flex-start', position: 'relative' }}>
                {isNewSender && !me && (
                  <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--am)', marginLeft: 2, marginBottom: 1 }}>{username}</div>
                )}
                <div style={{
                  padding: isPhoto ? '4px' : '9px 13px',
                  borderRadius: me ? '18px 18px 4px 18px' : '4px 18px 18px 18px',
                  background: me ? 'var(--am)' : 'var(--msg-other)',
                  color: me ? '#0d0d0d' : 'var(--msg-other-tx)',
                  fontSize: 13, lineHeight: 1.45,
                  position: 'relative',
                }}>
                  {renderContent(msg.texte)}
                  {/* Bouton suppression admin */}
                  {isAdmin && (
                    <button onClick={() => deleteMessage(msg.id)} style={{
                      position: 'absolute', top: -8, right: me ? 'auto' : -8, left: me ? -8 : 'auto',
                      width: 20, height: 20, borderRadius: '50%',
                      background: 'rgba(239,68,68,0.9)', border: 'none',
                      color: 'white', fontSize: 10, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>✕</button>
                  )}
                </div>
                <div style={{ fontSize: 9, color: 'var(--tx3)', marginLeft: 2, marginRight: 2 }}>
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
        position: 'fixed', bottom: NAV_H + 18, left: 0, right: 0,
        padding: '8px 12px', borderTop: '1px solid var(--border)',
        background: 'var(--bg)', display: 'flex', gap: 8, alignItems: 'center', zIndex: 99,
      }}>
        <Avatar username={profile?.username} avatarUrl={profile?.avatar_url} size={30} />

        {/* Bouton photo */}
        <button onClick={() => photoRef.current?.click()} disabled={uploadingPhoto} style={{
          width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
          background: 'var(--bg3)', border: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: 'var(--tx2)', fontSize: 16,
        }}>
          {uploadingPhoto ? '⏳' : '📷'}
        </button>
        <input ref={photoRef} type="file" accept="image/*" onChange={sendPhoto} style={{ display: 'none' }} />

        <input
          ref={inputRef}
          value={text}
          onChange={e => setText(e.target.value.slice(0, 500))}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
          placeholder="Écrire un message..."
          style={{
            flex: 1, padding: '9px 13px',
            background: 'var(--bg3)', border: '1px solid var(--border)',
            borderRadius: 22, color: 'var(--tx)', fontSize: 13,
            fontFamily: 'DM Sans,sans-serif', outline: 'none',
          }}
        />
        <button onClick={sendMessage} disabled={!text.trim() || loading} style={{
          width: 36, height: 36, borderRadius: '50%',
          background: text.trim() ? 'var(--am)' : 'var(--bg3)',
          border: 'none', cursor: text.trim() ? 'pointer' : 'default',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all .15s', flexShrink: 0,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={text.trim() ? '#0d0d0d' : 'var(--tx2)'} strokeWidth="2.5" strokeLinecap="round">
            <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22,2 15,22 11,13 2,9"/>
          </svg>
        </button>
      </div>
    </div>
  )
}
