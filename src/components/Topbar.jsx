export default function Topbar({ user, page, onNav, onLogout }) {
  const navItems = [
    { id: 'overview',   label: '📅 Kalender' },
    { id: 'turordning', label: '📋 Turordning' },
    { id: 'min-sida',   label: '👤 Min sida' },
  ]

  return (
    <div className="topbar">
      <span className="topbar-title">🏡 Stugförening Furustigen 31</span>
      <nav className="topbar-nav">
        {navItems.map(item => (
          <button
            key={item.id}
            className={`nav-btn${page === item.id ? ' active' : ''}`}
            onClick={() => onNav(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>
      <span className="topbar-user">
        {user.name}
        {user.isAdmin && <span className="admin-tag" style={{ marginLeft: 6 }}>ADMIN</span>}
      </span>
      <button className="nav-btn" onClick={onLogout}>Logga ut</button>
    </div>
  )
}
