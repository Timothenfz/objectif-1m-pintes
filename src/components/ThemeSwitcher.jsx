import { useTheme } from '../hooks/useTheme.jsx'

export default function ThemeSwitcher({ style }) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <div
      onClick={toggleTheme}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 14px',
        background: 'var(--bg3)',
        border: '1px solid var(--border)',
        borderRadius: 10,
        cursor: 'pointer',
        ...style,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 16 }}>{isDark ? '🌙' : '☀️'}</span>
        <span style={{ fontSize: 13, color: 'var(--tx)' }}>
          {isDark ? 'Thème sombre' : 'Thème clair'}
        </span>
      </div>
      {/* Toggle switch */}
      <div style={{
        width: 44, height: 26, borderRadius: 13,
        background: isDark ? 'var(--bg4)' : 'var(--am)',
        position: 'relative', transition: 'background .2s',
        flexShrink: 0,
      }}>
        <div style={{
          width: 20, height: 20, borderRadius: '50%',
          background: 'white',
          position: 'absolute', top: 3,
          left: isDark ? 3 : 21,
          transition: 'left .2s',
          boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
        }} />
      </div>
    </div>
  )
}
