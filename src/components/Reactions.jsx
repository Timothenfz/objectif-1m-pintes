import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth.jsx'

const EMOJI_GRID = [
  '🍺','🍻','🔥','😂','👏','❤️','🤙','💀',
  '🥴','😤','🤢','💯','👑','🫡','😍','🤣',
  '😭','🫶','🥂','🤮','💪','🙏','😎','⚡',
]

function EmojiPicker({ onPick, onClose }) {
  const ref = useRef()
  useEffect(() => {
    function handler(e) { if (ref.current && !ref.current.contains(e.target)) onClose() }
    setTimeout(() => document.addEventListener('mousedown', handler), 10)
    return () => document.removeEventListener('mousedown', handler)
  }, [])
  return (
    <div ref={ref} style={{
      position:'absolute', bottom:'100%', left:0, marginBottom:8,
      background:'#1e1e1e', border:'1px solid rgba(255,255,255,0.12)',
      borderRadius:14, padding:10, zIndex:200,
      display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:4,
      boxShadow:'0 8px 32px rgba(0,0,0,0.6)',
      width:220,
    }}>
      {EMOJI_GRID.map(e => (
        <button key={e} onClick={() => onPick(e)} style={{
          fontSize:20, padding:'5px 2px', background:'none', border:'none',
          cursor:'pointer', borderRadius:8, transition:'background .1s',
          lineHeight:1,
        }}
          onMouseEnter={ev => ev.currentTarget.style.background='rgba(255,255,255,0.08)'}
          onMouseLeave={ev => ev.currentTarget.style.background='none'}
        >{e}</button>
      ))}
    </div>
  )
}

function CommentModal({ pinteId, onClose }) {
  const { user, profile } = useAuth()
  const [comments, setComments] = useState([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [myLikes, setMyLikes] = useState(new Set())
  const inputRef = useRef()

  useEffect(() => { fetchComments(); inputRef.current?.focus() }, [])

  async function fetchComments() {
    const { data } = await supabase
      .from('commentaires')
      .select('*, profiles(username)')
      .eq('pinte_id', pinteId)
      .order('nb_likes', { ascending: false })
      .order('created_at', { ascending: true })
    setComments(data || [])

    if (user) {
      const ids = (data || []).map(c => c.id)
      if (ids.length) {
        const { data: likes } = await supabase
          .from('commentaire_likes')
          .select('commentaire_id')
          .eq('user_id', user.id)
          .in('commentaire_id', ids)
        setMyLikes(new Set((likes || []).map(l => l.commentaire_id)))
      }
    }
  }

  async function sendComment() {
    if (!text.trim() || loading) return
    setLoading(true)
    await supabase.from('commentaires').insert({ pinte_id: pinteId, user_id: user.id, texte: text.trim() })
    setText('')
    await fetchComments()
    setLoading(false)
  }

  async function toggleLike(commentId) {
    if (!user) return
    if (myLikes.has(commentId)) {
      await supabase.from('commentaire_likes').delete().eq('commentaire_id', commentId).eq('user_id', user.id)
      setMyLikes(s => { const n=new Set(s); n.delete(commentId); return n })
      setComments(cs => cs.map(c => c.id===commentId ? {...c, nb_likes: c.nb_likes-1} : c))
    } else {
      await supabase.from('commentaire_likes').insert({ commentaire_id: commentId, user_id: user.id })
      setMyLikes(s => new Set([...s, commentId]))
      setComments(cs => cs.map(c => c.id===commentId ? {...c, nb_likes: c.nb_likes+1} : c))
    }
  }

  const top = comments[0]
  const rest = comments.slice(1)

  return (
    <div style={{
      position:'fixed', inset:0, background:'rgba(0,0,0,0.7)',
      zIndex:300, display:'flex', alignItems:'flex-end',
    }} onClick={e => e.target===e.currentTarget && onClose()}>
      <div style={{
        width:'100%', maxHeight:'80dvh',
        background:'#181818', borderRadius:'20px 20px 0 0',
        border:'1px solid rgba(255,255,255,0.1)',
        display:'flex', flexDirection:'column',
        animation:'slideUp .25s ease',
      }}>
        <style>{`@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 16px 12px', borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
          <span style={{ fontFamily:'Bebas Neue,sans-serif', fontSize:18, color:'#ede9e0', letterSpacing:'.05em' }}>COMMENTAIRES</span>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'#7a7670', fontSize:20, cursor:'pointer', lineHeight:1 }}>×</button>
        </div>

        {/* Comments list */}
        <div style={{ flex:1, overflowY:'auto', padding:'12px 14px' }}>
          {comments.length === 0 && (
            <div style={{ textAlign:'center', padding:'32px 0', color:'#7a7670', fontSize:13 }}>
              Sois le premier à commenter !
            </div>
          )}

          {/* Top comment mis en avant */}
          {top && top.nb_likes > 0 && (
            <div style={{
              background:'rgba(245,166,35,0.07)', border:'1px solid rgba(245,166,35,0.2)',
              borderRadius:12, padding:'10px 12px', marginBottom:10,
            }}>
              <div style={{ fontSize:10, color:'#f5a623', fontWeight:500, marginBottom:5 }}>💬 Commentaire le plus aimé</div>
              <CommentRow c={top} liked={myLikes.has(top.id)} onLike={() => toggleLike(top.id)} isTop />
            </div>
          )}

          {/* Reste */}
          {(top && top.nb_likes > 0 ? rest : comments).map(c => (
            <CommentRow key={c.id} c={c} liked={myLikes.has(c.id)} onLike={() => toggleLike(c.id)} />
          ))}
        </div>

        {/* Input */}
        <div style={{ padding:'10px 14px 20px', borderTop:'1px solid rgba(255,255,255,0.07)', display:'flex', gap:8 }}>
          <div style={{
            width:30, height:30, borderRadius:'50%', flexShrink:0,
            background:'rgba(245,166,35,0.12)', border:'1.5px solid #f5a623',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:12, fontWeight:500, color:'#f5a623',
          }}>
            {(profile?.username||'?')[0].toUpperCase()}
          </div>
          <input
            ref={inputRef}
            value={text}
            onChange={e => setText(e.target.value.slice(0,200))}
            onKeyDown={e => e.key==='Enter' && sendComment()}
            placeholder="Ajoute un commentaire..."
            style={{
              flex:1, padding:'8px 12px',
              background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)',
              borderRadius:20, color:'#ede9e0', fontSize:13,
              fontFamily:'DM Sans,sans-serif', outline:'none',
            }}
          />
          <button onClick={sendComment} disabled={!text.trim()||loading} style={{
            padding:'8px 14px', background: text.trim() ? '#f5a623' : '#222',
            color: text.trim() ? '#0d0d0d' : '#7a7670',
            border:'none', borderRadius:20, fontWeight:500, fontSize:13,
            cursor: text.trim() ? 'pointer' : 'default',
            fontFamily:'DM Sans,sans-serif', transition:'all .15s',
          }}>
            {loading ? '...' : 'Envoyer'}
          </button>
        </div>
      </div>
    </div>
  )
}

function CommentRow({ c, liked, onLike, isTop }) {
  return (
    <div style={{ display:'flex', gap:9, marginBottom:isTop?0:10 }}>
      <div style={{
        width:28, height:28, borderRadius:'50%', flexShrink:0,
        background:`hsl(${(c.profiles?.username||'?').charCodeAt(0)*15%360},35%,18%)`,
        border:`1.5px solid hsl(${(c.profiles?.username||'?').charCodeAt(0)*15%360},55%,40%)`,
        display:'flex', alignItems:'center', justifyContent:'center',
        fontSize:11, fontWeight:500,
        color:`hsl(${(c.profiles?.username||'?').charCodeAt(0)*15%360},80%,70%)`,
      }}>
        {(c.profiles?.username||'?')[0].toUpperCase()}
      </div>
      <div style={{ flex:1 }}>
        <div style={{ display:'flex', alignItems:'baseline', gap:6 }}>
          <span style={{ fontSize:12, fontWeight:500, color:'#ede9e0' }}>{c.profiles?.username}</span>
          <span style={{ fontSize:10, color:'#7a7670' }}>
            {new Date(c.created_at).toLocaleDateString('fr-FR',{day:'numeric',month:'short'})}
          </span>
        </div>
        <div style={{ fontSize:13, color:'#c8c4bc', marginTop:2, lineHeight:1.4 }}>{c.texte}</div>
        <button onClick={onLike} style={{
          display:'flex', alignItems:'center', gap:4, marginTop:5,
          background:'none', border:'none', cursor:'pointer', padding:0,
          color: liked ? '#f5a623' : '#7a7670', fontSize:11,
          fontFamily:'DM Sans,sans-serif', transition:'color .15s',
        }}>
          <span style={{ fontSize:14 }}>{liked ? '❤️' : '🤍'}</span>
          {c.nb_likes > 0 && <span>{c.nb_likes}</span>}
        </button>
      </div>
    </div>
  )
}

export default function Reactions({ pinteId, style }) {
  const { user } = useAuth()
  const [reactions, setReactions] = useState([])
  const [myReactions, setMyReactions] = useState(new Set())
  const [showPicker, setShowPicker] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [nbComments, setNbComments] = useState(0)
  const [topComment, setTopComment] = useState(null)

  useEffect(() => { fetchAll() }, [pinteId])

  async function fetchAll() {
    const [{ data: rxData }, { count }, { data: topData }] = await Promise.all([
      supabase.from('reactions_summary').select('*').eq('pinte_id', pinteId),
      supabase.from('commentaires').select('*', { count:'exact', head:true }).eq('pinte_id', pinteId),
      supabase.from('commentaires').select('*, profiles(username)').eq('pinte_id', pinteId).order('nb_likes', { ascending:false }).limit(1),
    ])
    setReactions(rxData || [])
    setNbComments(count || 0)
    setTopComment(topData?.[0] || null)
    if (user) {
      const mine = (rxData||[]).filter(r => r.user_ids?.includes(user.id)).map(r => r.emoji)
      setMyReactions(new Set(mine))
    }
  }

  async function sendNotif(type, titre, message) {
    // Trouver le proprio de la pinte
    const { data: pinteData } = await supabase
      .from('pintes').select('user_id').eq('id', pinteId).single()
    if (!pinteData || pinteData.user_id === user.id) return
    await supabase.from('notifications').insert({
      user_id: pinteData.user_id, type, titre, message, lien: '/',
    })
  }

  async function toggleReaction(emoji) {
    if (!user) return
    setShowPicker(false)
    if (myReactions.has(emoji)) {
      await supabase.from('reactions').delete().eq('pinte_id', pinteId).eq('user_id', user.id).eq('emoji', emoji)
      setMyReactions(s => { const n=new Set(s); n.delete(emoji); return n })
      setReactions(rs => rs.map(r => r.emoji===emoji ? {...r, nb: r.nb-1} : r).filter(r => r.nb > 0))
    } else {
      await supabase.from('reactions').insert({ pinte_id: pinteId, user_id: user.id, emoji })
      setMyReactions(s => new Set([...s, emoji]))
      sendNotif('reaction', 'Nouvelle réaction !', `${emoji} sur ta pinte`)
      setReactions(rs => {
        const ex = rs.find(r => r.emoji===emoji)
        if (ex) return rs.map(r => r.emoji===emoji ? {...r, nb: r.nb+1} : r)
        return [...rs, { pinte_id: pinteId, emoji, nb: 1, user_ids: [user.id] }]
      })
    }
  }

  const sorted = [...reactions].sort((a,b) => b.nb - a.nb)

  return (
    <>
      <div style={{ padding:'8px 12px', ...style }}>
        {/* Ligne 1 : emojis + bouton ajouter + Commenter tout à droite */}
        <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'nowrap', position:'relative' }}>
          {/* Emojis existants */}
          <div style={{ display:'flex', alignItems:'center', gap:5, flexWrap:'wrap', flex:1, minWidth:0 }}>
            {sorted.map(r => (
              <button key={r.emoji} onClick={() => toggleReaction(r.emoji)} style={{
                display:'flex', alignItems:'center', gap:4,
                padding:'4px 9px', borderRadius:20,
                background: myReactions.has(r.emoji) ? 'rgba(245,166,35,0.15)' : 'rgba(255,255,255,0.06)',
                border: `1px solid ${myReactions.has(r.emoji) ? 'rgba(245,166,35,0.4)' : 'rgba(255,255,255,0.1)'}`,
                cursor:'pointer', transition:'all .15s',
                fontSize:15, lineHeight:1,
                fontFamily:'DM Sans,sans-serif',
              }}>
                <span>{r.emoji}</span>
                <span style={{ fontSize:11, color: myReactions.has(r.emoji) ? '#f5a623' : '#7a7670', fontWeight:500 }}>{r.nb}</span>
              </button>
            ))}

            {/* Bouton ajouter emoji */}
            <button onClick={() => setShowPicker(p => !p)} style={{
              width:30, height:28, borderRadius:20,
              background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)',
              cursor:'pointer', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center',
              color:'#7a7670', transition:'all .15s', flexShrink:0,
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>
              </svg>
            </button>

            {showPicker && <EmojiPicker onPick={toggleReaction} onClose={() => setShowPicker(false)} />}
          </div>

          {/* Bouton Commenter — même ligne, tout à droite */}
          <button onClick={() => setShowComments(true)} style={{
            display:'flex', alignItems:'center', gap:4, flexShrink:0,
            background:'none', border:'1px solid rgba(255,255,255,0.1)', borderRadius:20,
            cursor:'pointer', padding:'5px 10px',
            color:'#7a7670', fontSize:11, fontFamily:'DM Sans,sans-serif',
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
            </svg>
            {nbComments > 0 ? nbComments : 'Commenter'}
          </button>
        </div>

        {/* Ligne 2 : preview top commentaire si existe */}
        {topComment && (
          <div style={{ marginTop:6 }}>
            <div style={{ fontSize:11, color:'#c8c4bc', lineHeight:1.4, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              <span style={{ fontWeight:500, color:'#ede9e0', marginRight:4 }}>{topComment.profiles?.username}</span>
              {topComment.texte.length > 60 ? topComment.texte.slice(0,60)+'…' : topComment.texte}
            </div>
            {nbComments > 1 && (
              <button onClick={() => setShowComments(true)} style={{
                background:'none', border:'none', cursor:'pointer', padding:0,
                fontSize:10, color:'#7a7670', marginTop:2, fontFamily:'DM Sans,sans-serif',
              }}>
                Voir les {nbComments} commentaires
              </button>
            )}
          </div>
        )}
      </div>

      {showComments && (
        <CommentModal pinteId={pinteId} onClose={() => { setShowComments(false); fetchAll() }} />
      )}
    </>
  )
}
