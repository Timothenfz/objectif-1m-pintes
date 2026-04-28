import { useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'

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
    if (document.getElementById('leaflet-css')) return initMap()
    const css = document.createElement('link')
    css.id = 'leaflet-css'
    css.rel = 'stylesheet'
    css.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css'
    document.head.appendChild(css)

    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js'
    script.onload = initMap
    document.head.appendChild(script)
  }

  function initMap() {
    if (mapInstanceRef.current || !mapRef.current) return
    if (!window.L) { setTimeout(initMap, 200); return }

    const map = window.L.map(mapRef.current, {
      center: [46.5, 2.5],
      zoom: 5,
      zoomControl: true,
    })

    window.L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap © CARTO',
      maxZoom: 19,
    }).addTo(map)

    mapInstanceRef.current = map
  }

  useEffect(() => {
    if (!mapInstanceRef.current || pintes.length === 0) return
    const map = mapInstanceRef.current

    pintes.forEach(p => {
      if (!p.latitude || !p.longitude) return
      const icon = window.L.divIcon({
        className: '',
        html: `<div style="width:32px;height:32px;border-radius:50%;background:#f5a623;border:2px solid #0d0d0d;display:flex;align-items:center;justify-content:center;font-size:14px;box-shadow:0 2px 8px rgba(0,0,0,0.5);">🍺</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      })
      const marker = window.L.marker([p.latitude, p.longitude], { icon }).addTo(map)
      marker.bindPopup(`
        <div style="font-family:DM Sans,sans-serif;min-width:120px;text-align:center;">
          <div style="font-weight:500;font-size:13px;">${p.profiles?.username || 'Anonyme'}</div>
          <div style="font-size:11px;color:#888;margin:2px 0;">#${p.numero_global}</div>
          ${p.lieu ? `<div style="font-size:11px;color:#888;">${p.lieu}</div>` : ''}
          ${p.photo_url ? `<img src="${p.photo_url}" style="width:100%;border-radius:6px;margin-top:6px;max-height:100px;object-fit:cover;" />` : ''}
        </div>
      `)
    })

    if (pintes.length > 0) {
      const coords = pintes.filter(p => p.latitude).map(p => [p.latitude, p.longitude])
      if (coords.length > 0) map.fitBounds(coords, { padding: [40, 40] })
    }
  }, [pintes, mapInstanceRef.current])

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: '#0d0d0d' }}>
      {/* Header */}
      <div style={{ padding: '52px 16px 12px', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ fontSize: 26 }}>🗺</div>
            <div>
              <div style={{ fontFamily: 'Bebas Neue,sans-serif', fontSize: 28, color: '#ede9e0', lineHeight: 1 }}>CARTE</div>
              <div style={{ fontSize: 11, color: '#7a7670' }}>{pintes.length} pinte{pintes.length > 1 ? 's' : ''} géolocalisée{pintes.length > 1 ? 's' : ''}</div>
            </div>
          </div>
          <button onClick={() => { fetchPintes() }} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '6px 10px', color: '#7a7670', cursor: 'pointer', fontSize: 16 }}>↺</button>
        </div>
      </div>

      {/* Carte */}
      {pintes.length === 0 && !loading ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#7a7670', gap: 12 }}>
          <div style={{ fontSize: 52 }}>📍</div>
          <div style={{ fontSize: 16, fontWeight: 500, color: '#ede9e0' }}>Aucun lieu enregistré</div>
          <div style={{ fontSize: 13, textAlign: 'center', maxWidth: 260, lineHeight: 1.5 }}>
            Active le GPS lors de ton prochain post pour apparaître sur la carte !
          </div>
        </div>
      ) : (
        <div ref={mapRef} style={{ flex: 1 }} />
      )}
    </div>
  )
}
