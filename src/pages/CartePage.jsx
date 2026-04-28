import { useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'

const NAV_HEIGHT = 76

export default function CartePage() {
  const [pintes, setPintes] = useState([])
  const [loading, setLoading] = useState(true)
  const mapRef = useRef()
  const mapInstanceRef = useRef()

  useEffect(() => {
    fetchPintes()
    loadLeaflet()
  }, [])

  async function fetchPintes() {
    const { data } = await supabase
      .from('pintes')
      .select('*, profiles(username)')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)
      .order('created_at', { ascending: false })
    setPintes(data || [])
    setLoading(false)
  }

  function loadLeaflet() {
    if (document.getElementById('leaflet-css')) { setTimeout(initMap, 300); return }
    const css = document.createElement('link')
    css.id = 'leaflet-css'
    css.rel = 'stylesheet'
    css.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css'
    document.head.appendChild(css)
    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js'
    script.onload = () => setTimeout(initMap, 100)
    document.head.appendChild(script)
  }

  function initMap() {
    if (mapInstanceRef.current || !mapRef.current || !window.L) {
      if (!window.L) setTimeout(initMap, 200)
      return
    }
    const map = window.L.map(mapRef.current, {
      center: [46.5, 2.5], zoom: 5, zoomControl: false,
    })
    window.L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap © CARTO', maxZoom: 19,
    }).addTo(map)
    window.L.control.zoom({ position: 'topright' }).addTo(map)
    mapInstanceRef.current = map
  }

  useEffect(() => {
    if (!mapInstanceRef.current || pintes.length === 0) return
    const map = mapInstanceRef.current
    pintes.forEach(p => {
      if (!p.latitude || !p.longitude) return
      const icon = window.L.divIcon({
        className: '',
        html: `<div style="width:32px;height:32px;border-radius:50%;background:#f5a623;border:2px solid #0d0d0d;display:flex;align-items:center;justify-content:center;font-size:15px;box-shadow:0 2px 8px rgba(0,0,0,.5);">🍺</div>`,
        iconSize: [32, 32], iconAnchor: [16, 16],
      })
      const marker = window.L.marker([p.latitude, p.longitude], { icon }).addTo(map)
      marker.bindPopup(`
        <div style="font-family:DM Sans,sans-serif;min-width:130px;text-align:center;">
          <div style="font-weight:500;font-size:13px;">${p.profiles?.username || 'Anonyme'}</div>
          <div style="font-size:11px;color:#888;margin:2px 0;">#${p.numero_global}</div>
          ${p.lieu ? `<div style="font-size:11px;color:#888;">${p.lieu}</div>` : ''}
          ${p.photo_url ? `<img src="${p.photo_url}" style="width:100%;border-radius:6px;margin-top:6px;max-height:100px;object-fit:cover;"/>` : ''}
        </div>
      `)
    })
    const coords = pintes.filter(p => p.latitude).map(p => [p.latitude, p.longitude])
    if (coords.length) map.fitBounds(coords, { padding: [40, 40] })
  }, [pintes, mapInstanceRef.current])

  const HEADER_H = 90

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--bg)', overflow: 'hidden' }}>
      {/* Header fixe */}
      <div style={{ padding: '52px 16px 12px', borderBottom: '1px solid var(--border)', flexShrink: 0, background: 'var(--bg)', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ fontSize: 24 }}>🗺</div>
            <div>
              <div style={{ fontFamily: 'Bebas Neue,sans-serif', fontSize: 26, color: 'var(--tx)', lineHeight: 1 }}>CARTE</div>
              <div style={{ fontSize: 11, color: 'var(--tx2)' }}>{pintes.length} pinte{pintes.length !== 1 ? 's' : ''} géolocalisée{pintes.length !== 1 ? 's' : ''}</div>
            </div>
          </div>
          <button onClick={fetchPintes} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 10px', color: 'var(--tx2)', cursor: 'pointer', fontSize: 16 }}>↺</button>
        </div>
      </div>

      {/* Carte — hauteur = 100dvh - header - nav */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', marginBottom: NAV_HEIGHT }}>
        {pintes.length === 0 && !loading ? (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--tx2)', gap: 12 }}>
            <div style={{ fontSize: 52 }}>📍</div>
            <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--tx)' }}>Aucun lieu enregistré</div>
            <div style={{ fontSize: 13, textAlign: 'center', maxWidth: 260, lineHeight: 1.5 }}>
              Active le GPS lors de ton prochain post pour apparaître sur la carte !
            </div>
          </div>
        ) : (
          <div ref={mapRef} style={{ position: 'absolute', inset: 0 }} />
        )}
      </div>
    </div>
  )
}
