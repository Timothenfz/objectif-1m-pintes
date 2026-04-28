// Composant Avatar réutilisable partout dans l'app
// Si l'utilisateur a une photo de profil, on l'affiche
// Sinon on affiche les initiales colorées

export default function Avatar({ username, avatarUrl, size = 36, border = true, style = {} }) {
  const hue = (username?.charCodeAt(0) || 0) * 15 % 360

  const base = {
    width: size,
    height: size,
    borderRadius: '50%',
    flexShrink: 0,
    overflow: 'hidden',
    border: border ? `${size > 50 ? 3 : 1.5}px solid hsl(${hue},55%,40%)` : 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: `hsl(${hue},40%,16%)`,
    ...style,
  }

  if (avatarUrl) {
    return (
      <div style={base}>
        <img
          src={avatarUrl}
          alt={username}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>
    )
  }

  return (
    <div style={base}>
      <span style={{
        fontSize: size * 0.38,
        fontWeight: 500,
        color: `hsl(${hue},80%,70%)`,
        lineHeight: 1,
        userSelect: 'none',
      }}>
        {(username || '?')[0].toUpperCase()}
      </span>
    </div>
  )
}
