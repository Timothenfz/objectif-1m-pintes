import { useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'

const NAV_H = 76

const FLAGS = {
  'Paris': '🗼', 'Lyon': '🦁', 'Marseille': '⚓', 'Bordeaux': '🍷',
  'Annecy': '🏔', 'Grenoble': '⛷', 'Toulouse': '🌹', 'Nice': '☀️',
  'Nantes': '🐘', 'Lille': '🍟', 'Strasbourg': '🥨', 'Montpellier': '🌊',
  'Rennes': '🏴', 'Dijon': '🥗', 'Genève': '🇨🇭', 'Bordeaux': '🍷',
  'Londres': '🎡', 'London': '🎡', 'Bruxelles': '🍫', 'Barcelona': '🌊',
}
function getFlag(ville) {
  for (const [k, v] of Object.entries(FLAGS)) {
    if (ville?.toLowerCase().includes(k.toLowerCase())) return v
  }
  return '📍'
}

export default function CartePage() {
  const [tab, setTab] = useState('carte')
  const [pintes, setPintes] = useState([])
  const [villes, setVilles] = useState([])
  const [loading, setLoading] = useState(true)
  const mapRef = useRef()
  const mapInstanceRef = useRef()
  const markersRef = useRef([])

  useEffect(() => { fetchData() }, [])
  useEffect(() => { if (tab === 'carte') setTimeout(initMap, 100) }, [tab])

  async function fetchData() {
    const [{ data: pintesData }, { data: villesData }] = await Promise.all([
      supabase.from('pintes').select('*, profiles(username)').not('latitude', 'is', null).not('longitude', 'is', null).order('created_at', { ascending: false }),
      supabase.from('classement_villes').select('*').order('total_pintes', { ascending: false }).limit(30),
    ])
    setPintes(pintesData || [])
    setVilles(villesData || [])
    setLoading(false)
  }

  function loadLeaflet(cb) {
    if (window.L) { cb(); return }
    if (!document.getElementById('leaflet-css')) {
      const css = document.createElement('link')
      css.id = 'leaflet-css'
      css.rel = 'stylesheet'
      css.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css'
      document.head.appendChild(css)
    }
    if (!document.getElementById('leaflet-js')) {
      const script = document.createElement('script')
      script.id = 'leaflet-js'
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js'
      script.onload = cb
      document.head.appendChild(script)
    } else {
      setTimeout(cb, 200)
    }
  }

  function initMap() {
    loadLeaflet(() => {
      if (!mapRef.current || !window.L) return
      if (!mapInstanceRef.current) {
        const map = window.L.map(mapRef.current, { center: [46.5, 2.5], zoom: 5, zoomControl: false })
        window.L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          attribution: '© OpenStreetMap © CARTO', maxZoom: 19,
        }).addTo(map)
        window.L.control.zoom({ position: 'topright' }).addTo(map)
        mapInstanceRef.current = map
      }
      // Ajouter les markers
      if (pintes.length > 0 && markersRef.current.length === 0) {
        pintes.forEach(p => {
          if (!p.latitude || !p.longitude) return
          const icon = window.L.divIcon({
            className: '',
            html: `<div style="width:30px;height:30px;border-radius:50%;background:#f5a623;border:2px solid #0d0d0d;display:flex;align-items:center;justify-content:center;font-size:14px;box-shadow:0 2px 8px rgba(0,0,0,.5);">🍺</div>`,
            iconSize: [30, 30], iconAnchor: [15, 15],
          })
          const marker = window.L.marker([p.latitude, p.longitude], { icon }).addTo(mapInstanceRef.current)
          marker.bindPopup(`
            <div style="font-family:DM Sans,sans-serif;min-width:120px;text-align:center;">
              <div style="font-weight:500;font-size:13px;">${p.profiles?.username || 'Anonyme'}</div>
              <div style="font-size:11px;color:#888;margin:2px 0;">#${p.numero_global}</div>
              ${p.lieu ? `<div style="font-size:11px;color:#888;">${p.lieu}</div>` : ''}
              ${p.photo_url ? `<img src="${p.photo_url}" style="width:100%;border-radius:6px;margin-top:6px;max-height:100px;object-fit:cover;"/>` : ''}
            </div>
          `)
          markersRef.current.push(marker)
        })
        const coords = pintes.filter(p => p.latitude).map(p => [p.latitude, p.longitude])
        if (coords.length) mapInstanceRef.current.fitBounds(coords, { padding: [40, 40] })
      }
      setTimeout(() => mapInstanceRef.current?.invalidateSize(), 200)
    })
  }

  const max = villes[0]?.total_pintes || 1

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--bg)', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '52px 16px 0', background: 'var(--bg)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ fontSize: 24 }}>{tab === 'carte' ? '🗺' : '🏙'}</div>
            <div>
              <div style={{ fontFamily: 'Bebas Neue,sans-serif', fontSize: 26, color: 'var(--tx)', lineHeight: 1 }}>
                {tab === 'carte' ? 'CARTE' : 'VILLES'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--tx2)' }}>
                {tab === 'carte' ? `${pintes.length} pinte${pintes.length !== 1 ? 's' : ''} géolocalisée${pintes.length !== 1 ? 's' : ''}` : `${villes.length} villes`}
              </div>
            </div>
          </div>
          {tab === 'carte' && (
            <button onClick={() => { markersRef.current = []; mapInstanceRef.current = null; fetchData() }}
              style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 10px', color: 'var(--tx2)', cursor: 'pointer', fontSize: 16 }}>↺</button>
          )}
        </div>

        {/* Onglets */}
        <div style={{ display: 'flex', gap: 6, background: 'var(--bg3)', borderRadius: 10, padding: 4 }}>
          {['carte', 'villes'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex: 1, padding: '8px 0', borderRadius: 8,
              background: tab === t ? 'var(--am)' : 'transparent',
              color: tab === t ? '#0d0d0d' : 'var(--tx2)',
              border: 'none', cursor: 'pointer', fontSize: 13,
              fontWeight: tab === t ? 500 : 400,
              fontFamily: 'DM Sans,sans-serif', transition: 'all .15s',
            }}>
              {t === 'carte' ? '🗺 Carte' : '🏙 Classement'}
            </button>
          ))}
        </div>
      </div>

      {/* Contenu */}
      <div style={{ flex: 1, overflow: tab === 'villes' ? 'auto' : 'hidden', marginBottom: NAV_H, position: 'relative' }}>

        {/* CARTE */}
        {tab === 'carte' && (
          pintes.length === 0 && !loading ? (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--tx2)', gap: 12 }}>
              <div style={{ fontSize: 52 }}>📍</div>
              <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--tx)' }}>Aucun lieu enregistré</div>
              <div style={{ fontSize: 13, textAlign: 'center', maxWidth: 260, lineHeight: 1.5 }}>
                Active le GPS lors de ton prochain post pour apparaître sur la carte !
              </div>
            </div>
          ) : (
            <div ref={mapRef} style={{ position: 'absolute', inset: 0 }} />
          )
        )}

        {/* VILLES */}
        {tab === 'villes' && (
          <div style={{ padding: '14px 14px 0' }}>
            {villes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--tx2)' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🏙</div>
                <div style={{ fontSize: 14, color: 'var(--tx)' }}>Aucune ville renseignée</div>
                <div style={{ fontSize: 12, marginTop: 6 }}>Ajoute ta ville dans ton profil !</div>
              </div>
            ) : (
              <>
                {/* Podium top 3 */}
                {villes.length >= 3 && (
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginBottom: 16, justifyContent: 'center' }}>
                    {[villes[1], villes[0], villes[2]].map((v, i) => {
                      const heights = [110, 145, 90]
                      const colors = ['#888780', 'var(--am)', 'var(--amd)']
                      const labels = ['🥈', '🥇', '🥉']
                      return (
                        <div key={v.ville} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                          <div style={{ fontSize: 11, color: 'var(--tx)', fontWeight: 500, textAlign: 'center' }}>{v.ville}</div>
                          <div style={{ fontSize: 18 }}>{getFlag(v.ville)}</div>
                          <div style={{ fontSize: 15, color: colors[i], fontFamily: 'Bebas Neue,sans-serif' }}>{v.total_pintes} 🍺</div>
                          <div style={{ width: '100%', height: heights[i], background: 'var(--bg3)', border: `1px solid ${i === 1 ? 'rgba(245,166,35,0.3)' : 'var(--border)'}`, borderRadius: '8px 8px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: i === 1 ? 24 : 18 }}>
                            {labels[i]}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Liste */}
                <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', marginBottom: 14 }}>
                  {villes.map((v, i) => (
                    <div key={v.ville} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderBottom: i < villes.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      <div style={{ width: 20, textAlign: 'center', fontSize: i < 3 ? 16 : 12, fontFamily: 'Bebas Neue,sans-serif', color: 'var(--tx2)', flexShrink: 0 }}>
                        {i < 3 ? ['🥇','🥈','🥉'][i] : i + 1}
                      </div>
                      <div style={{ fontSize: 18, flexShrink: 0 }}>{getFlag(v.ville)}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--tx)' }}>{v.ville}</div>
                        <div style={{ height: 3, background: 'var(--bg3)', borderRadius: 2, marginTop: 4 }}>
                          <div style={{ height: 3, borderRadius: 2, background: 'var(--am)', width: `${Math.round(v.total_pintes / max * 100)}%`, transition: 'width .5s' }} />
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--tx2)', marginTop: 2 }}>{v.nb_membres} membre{v.nb_membres > 1 ? 's' : ''}</div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontFamily: 'Bebas Neue,sans-serif', fontSize: 22, color: i === 0 ? 'var(--am)' : 'var(--tx)', lineHeight: 1 }}>{v.total_pintes}</div>
                        <div style={{ fontSize: 9, color: 'var(--tx2)' }}>pintes</div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
