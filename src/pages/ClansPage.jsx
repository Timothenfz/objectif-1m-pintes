import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth.jsx'
import Avatar from '../components/Avatar.jsx'
import ProfileAvatar from '../components/ProfileAvatar.jsx'

// ─── BOUTIQUE ─────────────────────────────────────────────────
const SHOP_ITEMS = [
  { id: 'raid',    icon: '💥', name: 'Raid',       desc: 'Retire définitivement 20 pintes du trésor d\'un clan adverse', cost: 100, color: '#f87171', bg: 'rgba(239,68,68,0.1)',  border: 'rgba(239,68,68,0.3)' },
  { id: 'shield',  icon: '🛡', name: 'Bouclier',   desc: 'Protège le clan des raids pendant 48h',         cost: 50,  color: '#60a5fa', bg: 'rgba(96,165,250,0.1)', border: 'rgba(96,165,250,0.25)' },
  { id: 'boost',   icon: '🚀', name: 'Boost x2',   desc: 'Chaque pinte compte double pendant 12h',        cost: 75,  color: 'var(--am)', bg: 'rgba(245,166,35,0.1)', border: 'rgba(245,166,35,0.3)' },
  { id: 'emoji',   icon: '🎨', name: 'Changer l\'emoji', desc: 'Nouveau look pour ton clan',               cost: 20,  color: '#a78bfa', bg: 'rgba(167,139,250,0.1)', border: 'rgba(167,139,250,0.25)' },
]

const EMOJIS = ['🐺','🦁','🐻','🦊','🐯','🦅','🐉','🦈','🔥','⚡','💀','👑','🍺','🎯','🏴‍☠️','🦄','🐊','🦂','🐝','🌊']

function Boutique({ clan, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [msg, setMsg] = useState('')

  const [showRaidPicker, setShowRaidPicker] = useState(false)
  const [clansDisponibles, setClansDisponibles] = useState([])

  async function buy(item) {
    if (clan.tresor < item.cost) return setMsg('Pas assez de crédits dans le trésor !')
    if (item.id === 'emoji') { setShowEmojiPicker(true); return }
    if (item.id === 'raid') {
      // Charger les clans adverses
      const { data } = await supabase.from('clans').select('id, nom, emoji, tresor').neq('id', clan.id).order('tresor', { ascending: false })
      setClansDisponibles(data || [])
      setShowRaidPicker(true)
      return
    }
    setLoading(true)
    await supabase.from('clans').update({ tresor: clan.tresor - item.cost }).eq('id', clan.id)
    await supabase.from('clan_actions').insert({ clan_id: clan.id, type: item.id, expires_at: new Date(Date.now() + 12 * 3600000).toISOString() })
    setMsg(`✅ ${item.name} activé !`)
    setLoading(false)
    setTimeout(() => { onSuccess(); onClose() }, 1500)
  }

  async function lancerRaid(cible) {
    setLoading(true)
    setShowRaidPicker(false)
    // Débiter le trésor du clan attaquant
    await supabase.from('clans').update({ tresor: clan.tresor - 100 }).eq('id', clan.id)
    // Retirer 20 pintes du trésor du clan cible (minimum 0)
    const newTresor = Math.max(0, (cible.tresor || 0) - 20)
    await supabase.from('clans').update({ tresor: newTresor }).eq('id', cible.id)
    // Logger l'action
    await supabase.from('clan_actions').insert({ clan_id: clan.id, type: 'raid' })
    setMsg(`💥 Raid lancé sur ${cible.emoji} ${cible.nom} ! -20 pintes`)
    setLoading(false)
    setTimeout(() => { onSuccess(); onClose() }, 2000)
  }

  async function changeEmoji(emoji) {
    if (clan.tresor < 20) return setMsg('Pas assez de crédits !')
    setLoading(true)
    await supabase.from('clans').update({ emoji, tresor: clan.tresor - 20 }).eq('id', clan.id)
    setMsg('✅ Emoji mis à jour !')
    setLoading(false)
    setTimeout(() => { onSuccess(); onClose() }, 1500)
  }

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 999, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div style={{ background: 'var(--card-bg)', borderRadius: '20px 20px 0 0', padding: 20, width: '100%', maxWidth: 480, maxHeight: '80dvh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <div style={{ fontFamily: 'Bebas Neue,sans-serif', fontSize: 22, color: 'var(--tx)' }}>🏪 BOUTIQUE DU CHEF</div>
            <div style={{ fontSize: 11, color: 'var(--tx2)' }}>Trésor du clan : <span style={{ color: 'var(--am)', fontWeight: 600 }}>{clan.tresor} ⚡</span></div>
          </div>
          <button onClick={onClose} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', color: 'var(--tx2)', fontSize: 16 }}>✕</button>
        </div>

        {msg && <div style={{ background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#4ade80', marginBottom: 12 }}>{msg}</div>}

        {showRaidPicker ? (
          <div>
            <div style={{ fontSize: 13, color: 'var(--tx2)', marginBottom: 12 }}>Choisir le clan à raider (-20 pintes définitives)</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {clansDisponibles.map(c => (
                <button key={c.id} onClick={() => lancerRaid(c)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, cursor: 'pointer', textAlign: 'left' }}>
                  <span style={{ fontSize: 22 }}>{c.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: 'var(--tx)', fontWeight: 600 }}>{c.nom}</div>
                    <div style={{ fontSize: 11, color: 'var(--tx2)' }}>Trésor : {c.tresor} ⚡</div>
                  </div>
                  <span style={{ fontSize: 12, color: '#f87171', fontWeight: 600 }}>Raider 💥</span>
                </button>
              ))}
              <button onClick={() => setShowRaidPicker(false)} style={{ padding: '10px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--tx2)', fontSize: 12, cursor: 'pointer' }}>Annuler</button>
            </div>
          </div>
        ) : showEmojiPicker ? (
          <div>
            <div style={{ fontSize: 13, color: 'var(--tx2)', marginBottom: 12 }}>Choisis un emoji (20 ⚡)</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {EMOJIS.map(e => (
                <button key={e} onClick={() => changeEmoji(e)} style={{ fontSize: 28, background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 10, padding: '8px 10px', cursor: 'pointer' }}>{e}</button>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {SHOP_ITEMS.map(item => (
              <div key={item.id} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ fontSize: 28, flexShrink: 0 }}>{item.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: 'var(--tx)', fontWeight: 600 }}>{item.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--tx2)', marginTop: 2 }}>{item.desc}</div>
                </div>
                <button onClick={() => isChef && buy(item)} disabled={loading || !isChef || clan.tresor < item.cost} title={!isChef ? 'Seul le chef peut dépenser les crédits' : ''} style={{
                  background: isChef && clan.tresor >= item.cost ? item.bg : 'var(--bg3)',
                  border: `1px solid ${isChef && clan.tresor >= item.cost ? item.border : 'var(--border)'}`,
                  borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 600,
                  color: isChef && clan.tresor >= item.cost ? item.color : 'var(--tx2)',
                  cursor: isChef && clan.tresor >= item.cost ? 'pointer' : 'not-allowed', flexShrink: 0,
                }}>{!isChef ? '🔒' : `${item.cost} ⚡`}</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── DÉTAIL CLAN ──────────────────────────────────────────────
function DetailClan({ clan, me, onBack, onRefresh }) {
  const navigate = useNavigate()
  const [membres, setMembres] = useState([])
  const [activite, setActivite] = useState([])
  const [loading, setLoading] = useState(true)
  const [showBoutique, setShowBoutique] = useState(false)
  const isChef = clan.chef_id === me?.id
  const [quitterLoading, setQuitterLoading] = useState(false)

  async function quitterClan() {
    if (!window.confirm('Quitter ce clan ?')) return
    setQuitterLoading(true)
    await supabase.from('clan_membres').delete().eq('user_id', me.id).eq('clan_id', clan.id)
    await supabase.from('profiles').update({ clan_id: null }).eq('id', me.id)
    setQuitterLoading(false)
    onBack()
    onRefresh()
  }

  useEffect(() => { fetchDetail() }, [clan.id])

  async function fetchDetail() {
    setLoading(true)
    const { data: membs } = await supabase
      .from('clan_membres')
      .select('user_id, profiles(id, username, avatar_url, total_perso)')
      .eq('clan_id', clan.id)
      .order('created_at', { ascending: true })
    setMembres(membs || [])

    const { data: pintes } = await supabase
      .from('pintes')
      .select('id, numero_global, photo_url, created_at, profiles(username)')
      .in('user_id', (membs || []).map(m => m.user_id))
      .not('user_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(10)
    setActivite(pintes || [])
    setLoading(false)
  }

  function timeAgo(d) {
    const diff = Date.now() - new Date(d).getTime()
    const m = Math.floor(diff / 60000)
    if (m < 1) return "à l'instant"
    if (m < 60) return `il y a ${m}min`
    const h = Math.floor(m / 60)
    if (h < 24) return `il y a ${h}h`
    return `il y a ${Math.floor(h / 24)}j`
  }

  const totalPintes = membres.reduce((s, m) => s + (m.profiles?.total_perso || 0), 0)
  const nextPalier = Math.ceil(totalPintes / 100) * 100
  const progress = totalPintes % 100

  return (
    <div>
      {showBoutique && <Boutique clan={clan} onClose={() => setShowBoutique(false)} onSuccess={() => { onRefresh(); fetchDetail() }} />}

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 16px 16px' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--tx2)', fontSize: 13, cursor: 'pointer', padding: 0 }}>‹ Retour</button>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(245,166,35,0.15)', border: '1px solid rgba(245,166,35,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{clan.emoji}</div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--tx)' }}>{clan.nom}</div>
            <div style={{ fontSize: 10, color: 'var(--tx2)' }}>{membres.length} membres · {totalPintes} pintes</div>
          </div>
        </div>
        <button onClick={() => setShowBoutique(true)} style={{ background: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.3)', borderRadius: 10, padding: '8px 12px', fontSize: 12, color: 'var(--am)', fontWeight: 600, cursor: 'pointer' }}>
          🏪 Boutique
        </button>
      </div>

      {/* Barre de progression palier */}
      <div style={{ margin: '0 16px 14px', background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 12, padding: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--tx2)', marginBottom: 6 }}>
          <span>Progression du clan</span>
          <span style={{ color: 'var(--am)' }}>🎁 Bonus à {nextPalier}</span>
        </div>
        <div style={{ height: 6, background: 'var(--bg3)', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ height: 6, background: 'linear-gradient(90deg,#c4841a,#f5a623)', borderRadius: 3, width: `${progress}%`, transition: 'width .5s' }} />
        </div>
        <div style={{ fontSize: 10, color: 'var(--tx2)', marginTop: 4 }}>
          {totalPintes} / {nextPalier} — encore {nextPalier - totalPintes} pintes · Trésor : <span style={{ color: 'var(--am)' }}>{clan.tresor || 0} ⚡</span>
        </div>
      </div>

      {loading ? <div style={{ padding: 30, textAlign: 'center', color: 'var(--tx2)' }}>Chargement...</div> : (
        <>
          {/* Membres */}
          <div style={{ padding: '0 16px', marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: 'var(--tx2)', fontWeight: 600, marginBottom: 8 }}>MEMBRES</div>
            <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
              {membres.map((m, i) => (
                <div key={m.user_id} onClick={() => navigate(`/u/${m.user_id}`)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: i < membres.length - 1 ? '1px solid var(--border)' : 'none', cursor: 'pointer' }}>
                  <Avatar username={m.profiles?.username} avatarUrl={m.profiles?.avatar_url} size={32} border={clan.chef_id === m.user_id} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: 'var(--tx)', fontWeight: 500 }}>
                      {m.profiles?.username}
                      {clan.chef_id === m.user_id && <span style={{ marginLeft: 5, fontSize: 10, color: 'var(--am)' }}>👑 Chef</span>}
                      {m.user_id === me?.id && <span style={{ marginLeft: 5, fontSize: 9, padding: '1px 5px', borderRadius: 20, background: 'rgba(245,166,35,0.2)', color: 'var(--am)' }}>toi</span>}
                    </div>
                  </div>
                  <div style={{ fontFamily: 'Bebas Neue,sans-serif', fontSize: 18, color: 'var(--am)' }}>{m.profiles?.total_perso || 0} 🍺</div>
                </div>
              ))}
            </div>
          </div>

          {/* Bouton quitter */}
          {!isChef && (
            <div style={{ padding: '0 16px', marginBottom: 14 }}>
              <button onClick={quitterClan} disabled={quitterLoading} style={{ width: '100%', padding: '12px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, color: '#f87171', fontSize: 13, cursor: 'pointer', opacity: quitterLoading ? 0.6 : 1 }}>
                🚪 Quitter le clan
              </button>
            </div>
          )}

          {/* Activité récente */}
          {activite.length > 0 && (
            <div style={{ padding: '0 16px' }}>
              <div style={{ fontSize: 11, color: 'var(--tx2)', fontWeight: 600, marginBottom: 8 }}>ACTIVITÉ RÉCENTE</div>
              <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
                {activite.map((p, i) => (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: i < activite.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    {p.photo_url
                      ? <img src={p.photo_url} style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                      : <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>🍺</div>
                    }
                    <div style={{ flex: 1, fontSize: 12, color: 'var(--tx2)' }}>
                      <span style={{ color: 'var(--tx)', fontWeight: 500 }}>{p.profiles?.username}</span> a posté la pinte <span style={{ color: 'var(--am)' }}>#{p.numero_global}</span>
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--tx2)', flexShrink: 0 }}>{timeAgo(p.created_at)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ─── CRÉER CLAN ───────────────────────────────────────────────
function CreerClan({ credits, onClose, onSuccess }) {
  const [nom, setNom] = useState('')
  const [emoji, setEmoji] = useState('🍺')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { user } = useAuth()

  async function creer() {
    if (!nom.trim()) return setError('Donne un nom à ton clan !')
    if (credits < 50) return setError('Il te faut 50 ⚡ pour créer un clan.')
    setLoading(true)
    // Créer le clan
    const { data: clan, error: err } = await supabase
      .from('clans')
      .insert({ nom: nom.trim(), emoji, chef_id: user.id, tresor: 0 })
      .select()
      .single()
    if (err) { setError('Erreur : ' + err.message); setLoading(false); return }
    // Rejoindre automatiquement
    await supabase.from('clan_membres').insert({ clan_id: clan.id, user_id: user.id })
    // Débiter les crédits
    await supabase.from('profiles').update({ credits: credits - 50, clan_id: clan.id }).eq('id', user.id)
    setLoading(false)
    onSuccess() // refresh immédiat
  }

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 999, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div style={{ background: 'var(--card-bg)', borderRadius: '20px 20px 0 0', padding: 20, width: '100%', maxWidth: 480 }}>
        <div style={{ fontFamily: 'Bebas Neue,sans-serif', fontSize: 22, color: 'var(--tx)', marginBottom: 4 }}>⚔️ CRÉER UN CLAN</div>
        <div style={{ fontSize: 11, color: 'var(--tx2)', marginBottom: 16 }}>Coûte 50 ⚡ · Tu as {credits} ⚡</div>
        {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#f87171', marginBottom: 12 }}>{error}</div>}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <button onClick={() => {
            const current = EMOJIS.indexOf(emoji)
            setEmoji(EMOJIS[(current + 1) % EMOJIS.length])
          }} style={{ width: 50, height: 44, borderRadius: 10, background: 'var(--bg3)', border: '1px solid var(--border)', fontSize: 24, cursor: 'pointer', flexShrink: 0 }}>{emoji}</button>
          <input value={nom} onChange={e => setNom(e.target.value)} placeholder="Nom du clan" maxLength={30}
            style={{ flex: 1, padding: '10px 14px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--tx)', fontSize: 14, fontFamily: 'DM Sans,sans-serif', outline: 'none' }} />
        </div>
        <div style={{ fontSize: 10, color: 'var(--tx2)', marginBottom: 14 }}>Tap sur l'emoji pour en changer</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 12, background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--tx2)', fontSize: 13, cursor: 'pointer' }}>Annuler</button>
          <button onClick={creer} disabled={loading || credits < 50} style={{ flex: 1, padding: 12, background: credits >= 50 ? 'rgba(245,166,35,0.15)' : 'var(--bg3)', border: `1px solid ${credits >= 50 ? 'rgba(245,166,35,0.3)' : 'var(--border)'}`, borderRadius: 10, color: credits >= 50 ? 'var(--am)' : 'var(--tx2)', fontSize: 13, fontWeight: 600, cursor: credits >= 50 ? 'pointer' : 'not-allowed', opacity: loading ? 0.6 : 1 }}>
            {loading ? 'Création...' : 'Créer (50 ⚡)'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── REJOINDRE CLAN ───────────────────────────────────────────
function RejoindreModal({ clan, credits, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()

  async function rejoindre() {
    if (credits < 5) return
    setLoading(true)
    await supabase.from('clan_membres').insert({ clan_id: clan.id, user_id: user.id })
    await supabase.from('profiles').update({ credits: credits - 5, clan_id: clan.id }).eq('id', user.id)
    await supabase.from('clans').update({ tresor: (clan.tresor || 0) + 1 }).eq('id', clan.id)
    setLoading(false)
    onSuccess()
  }

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: 'var(--card-bg)', borderRadius: 20, padding: 20, width: '100%', maxWidth: 340 }}>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>{clan.emoji}</div>
          <div style={{ fontFamily: 'Bebas Neue,sans-serif', fontSize: 22, color: 'var(--tx)' }}>{clan.nom}</div>
          <div style={{ fontSize: 12, color: 'var(--tx2)', marginTop: 4 }}>Rejoindre ce clan coûte <span style={{ color: 'var(--am)', fontWeight: 600 }}>5 ⚡</span></div>
          <div style={{ fontSize: 11, color: 'var(--tx2)' }}>Tu as {credits} ⚡</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 12, background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--tx2)', fontSize: 13, cursor: 'pointer' }}>Annuler</button>
          <button onClick={rejoindre} disabled={loading || credits < 5} style={{ flex: 1, padding: 12, background: credits >= 5 ? 'rgba(245,166,35,0.15)' : 'var(--bg3)', border: `1px solid ${credits >= 5 ? 'rgba(245,166,35,0.3)' : 'var(--border)'}`, borderRadius: 10, color: credits >= 5 ? 'var(--am)' : 'var(--tx2)', fontSize: 13, fontWeight: 600, cursor: credits >= 5 ? 'pointer' : 'not-allowed', opacity: loading ? 0.6 : 1 }}>
            {loading ? '...' : credits < 5 ? 'Pas assez ⚡' : 'Rejoindre (5 ⚡)'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── PAGE PRINCIPALE ──────────────────────────────────────────
export default function ClansPage() {
  const { user, profile } = useAuth()
  const [clans, setClans] = useState([])
  const [monClan, setMonClan] = useState(null)
  const [selectedClan, setSelectedClan] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showCreer, setShowCreer] = useState(false)
  const [rejoindreTarget, setRejoindreTarget] = useState(null)
  const credits = profile?.credits || 0

  useEffect(() => { fetchAll() }, [profile])

  async function fetchAll() {
    setLoading(true)
    // Récupérer tous les clans avec leurs membres count
    const { data: clansData } = await supabase
      .from('clans')
      .select('*, clan_membres(count)')
      .order('tresor', { ascending: false })
    setClans(clansData || [])

    // Mon clan
    if (profile?.clan_id) {
      const { data: monClanData } = await supabase
        .from('clans')
        .select('*')
        .eq('id', profile.clan_id)
        .single()
      setMonClan(monClanData)
    } else {
      setMonClan(null)
    }
    setLoading(false)
  }

  // Rang de mon clan
  const monRang = monClan ? clans.findIndex(c => c.id === monClan.id) + 1 : null

  if (selectedClan) return (
    <div style={{ minHeight: '100dvh', paddingBottom: 90, background: 'var(--bg)', paddingTop: 52 }}>
      <DetailClan clan={selectedClan} me={profile} onBack={() => setSelectedClan(null)} onRefresh={fetchAll} />
    </div>
  )

  return (
    <div style={{ minHeight: '100dvh', paddingBottom: 90, background: 'var(--bg)' }}>
      {showCreer && <CreerClan credits={credits} onClose={() => setShowCreer(false)} onSuccess={() => { setShowCreer(false); fetchAll() }} />}
      {rejoindreTarget && <RejoindreModal clan={rejoindreTarget} credits={credits} onClose={() => setRejoindreTarget(null)} onSuccess={() => { setRejoindreTarget(null); fetchAll() }} />}

      {/* Header */}
      <div style={{ padding: '52px 16px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontFamily: 'Bebas Neue,sans-serif', fontSize: 13, color: 'var(--am)', letterSpacing: '.08em' }}>COMPÉTITION</div>
          <div style={{ fontFamily: 'Bebas Neue,sans-serif', fontSize: 32, color: 'var(--tx)', lineHeight: 1 }}>⚔️ CLANS</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ background: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.25)', borderRadius: 20, padding: '6px 12px', fontSize: 13, color: 'var(--am)', fontWeight: 600 }}>
            {credits} ⚡
          </div>
          <ProfileAvatar />
        </div>
      </div>

      <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Mon clan */}
        {monClan && (
          <div onClick={() => setSelectedClan(monClan)} style={{ background: 'var(--card-bg)', border: '1px solid rgba(245,166,35,0.3)', borderRadius: 14, padding: 14, cursor: 'pointer' }}>
            <div style={{ fontSize: 10, color: 'var(--tx2)', marginBottom: 8, fontWeight: 600 }}>MON CLAN</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(245,166,35,0.15)', border: '1px solid rgba(245,166,35,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>{monClan.emoji}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--tx)' }}>{monClan.nom}</div>
                <div style={{ fontSize: 11, color: 'var(--tx2)' }}>
                  Trésor : <span style={{ color: 'var(--am)' }}>{monClan.tresor || 0} ⚡</span>
                  {monClan.chef_id === user?.id && <span style={{ marginLeft: 8, color: 'var(--am)' }}>👑 Chef</span>}
                </div>
              </div>
              {monRang && (
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'Bebas Neue,sans-serif', fontSize: 28, color: 'var(--am)', lineHeight: 1 }}>#{monRang}</div>
                  <div style={{ fontSize: 9, color: 'var(--tx2)' }}>classement</div>
                </div>
              )}
            </div>
            <div style={{ fontSize: 10, color: 'var(--tx2)', marginBottom: 4 }}>
              Prochain bonus : {Math.ceil((monClan.tresor || 0) / 100) * 100 || 100} ⚡
            </div>
            <div style={{ height: 5, background: 'var(--bg3)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: 5, background: 'linear-gradient(90deg,#c4841a,#f5a623)', borderRadius: 3, width: `${((monClan.tresor || 0) % 100)}%` }} />
            </div>
          </div>
        )}

        {/* Classement */}
        <div>
          <div style={{ fontSize: 11, color: 'var(--tx2)', fontWeight: 600, marginBottom: 8 }}>CLASSEMENT DES CLANS</div>
          {loading ? (
            <div style={{ padding: 30, textAlign: 'center', color: 'var(--tx2)' }}>Chargement...</div>
          ) : clans.length === 0 ? (
            <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 14, padding: 30, textAlign: 'center', color: 'var(--tx2)' }}>
              Aucun clan pour l'instant. Sois le premier !
            </div>
          ) : (
            <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
              {clans.map((clan, i) => {
                const isMon = clan.id === profile?.clan_id
                const nbMembres = clan.clan_membres?.[0]?.count || 0
                return (
                  <div key={clan.id} onClick={() => setSelectedClan(clan)} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                    borderBottom: i < clans.length - 1 ? '1px solid var(--border)' : 'none',
                    background: isMon ? 'rgba(245,166,35,0.04)' : 'transparent',
                    cursor: 'pointer',
                  }}>
                    <div style={{ width: 22, textAlign: 'center', fontSize: i < 3 ? 18 : 13, color: 'var(--tx2)', fontFamily: 'Bebas Neue,sans-serif', flexShrink: 0 }}>
                      {i < 3 ? ['🥇','🥈','🥉'][i] : i + 1}
                    </div>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--bg3)', border: `1px solid ${isMon ? 'rgba(245,166,35,0.3)' : 'var(--border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{clan.emoji}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--tx)', display: 'flex', alignItems: 'center', gap: 5 }}>
                        {clan.nom}
                        {isMon && <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 20, background: 'rgba(245,166,35,0.2)', color: 'var(--am)' }}>toi</span>}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--tx2)', marginTop: 1 }}>{nbMembres} membre{nbMembres > 1 ? 's' : ''}</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontFamily: 'Bebas Neue,sans-serif', fontSize: 20, color: i === 0 ? 'var(--am)' : 'var(--tx)', lineHeight: 1 }}>{clan.tresor || 0}</div>
                      <div style={{ fontSize: 9, color: 'var(--tx2)' }}>⚡ trésor</div>
                    </div>
                    <div style={{ fontSize: 14, color: 'var(--tx2)', flexShrink: 0 }}>›</div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Créer / Rejoindre */}
        {!monClan && (
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 14, padding: 14 }}>
            <div style={{ fontSize: 13, color: 'var(--tx2)', marginBottom: 12, textAlign: 'center' }}>
              Pas encore dans un clan ?
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setShowCreer(true)} style={{ flex: 1, padding: '12px 0', background: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.3)', borderRadius: 10, cursor: 'pointer', textAlign: 'center' }}>
                <div style={{ fontSize: 13, color: 'var(--am)', fontWeight: 600 }}>⚔️ Créer</div>
                <div style={{ fontSize: 10, color: 'var(--tx2)', marginTop: 2 }}>50 ⚡ requis</div>
              </button>
              {clans.length > 0 && (
                <button onClick={() => setRejoindreTarget(clans[0])} style={{ flex: 1, padding: '12px 0', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 10, cursor: 'pointer', textAlign: 'center' }}>
                  <div style={{ fontSize: 13, color: 'var(--tx)', fontWeight: 600 }}>🤝 Rejoindre</div>
                  <div style={{ fontSize: 10, color: 'var(--tx2)', marginTop: 2 }}>5 ⚡ requis</div>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Info crédits */}
        <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 12, padding: '10px 14px', fontSize: 11, color: 'var(--tx2)', textAlign: 'center' }}>
          💡 1 pinte postée = 1 ⚡ crédit · Les crédits servent à créer ou rejoindre des clans
        </div>
      </div>
    </div>
  )
}
