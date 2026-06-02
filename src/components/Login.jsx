import { useState } from 'react'

export default function Login({ members, onLogin }) {
  const [selectedId, setSelectedId] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    const member = members.find(m => m.id === parseInt(selectedId))
    if (!member) return setError('Välj en andel')
    const err = onLogin(member, pin)
    if (err) { setError(err); setPin('') }
  }

  return (
    <div className="login-wrap">
      <div className="login-box">
        <div className="login-logo">🏡</div>
        <h1>Stugförening Furustigen 31</h1>
        <p>Logga in med din andel och PIN-kod</p>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Din andel</label>
            <select value={selectedId} onChange={e => { setSelectedId(e.target.value); setError('') }}>
              <option value="">— välj andel —</option>
              {members.map(m => (
                <option key={m.id} value={m.id}>Andel {m.id} — {m.name}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>PIN-kod</label>
            <input
              type="password"
              value={pin}
              onChange={e => { setPin(e.target.value); setError('') }}
              maxLength={4}
              placeholder="••••"
              autoComplete="off"
            />
          </div>
          {error && <div className="notice notice-err">{error}</div>}
          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }}>
            Logga in
          </button>
          <p style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'center', marginTop: '1rem' }}>
            Kontakta administratören om du glömt din PIN-kod
          </p>
        </form>

      </div>
    </div>
  )
}
