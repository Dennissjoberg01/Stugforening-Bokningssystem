import { useState, useRef } from 'react'

export default function TurordningView({
  state, currentUser, members,
  onNextYear, onChangePin, onUpdateMember,
  onReorderWinter, onReorderSummer,
}) {
  const [confirming, setConfirming] = useState(false)
  const [shifted, setShifted] = useState(false)

  // PIN edits
  const [pinEdits, setPinEdits] = useState({})
  const [pinSaved, setPinSaved] = useState({})

  // Member edits
  const [memberEdits, setMemberEdits] = useState({}) // { id: { name, email } }
  const [memberSaved, setMemberSaved] = useState({})

  function getMember(id) {
    return members.find(m => m.id === id) || { name: '—', email: '' }
  }

  function handleShift() {
    onNextYear()
    setConfirming(false)
    setShifted(true)
    setTimeout(() => setShifted(false), 3000)
  }

  // ── PIN ──
  function handlePinSave(memberId) {
    const newPin = (pinEdits[memberId] ?? '').trim()
    if (newPin.length < 4) return
    onChangePin(memberId, newPin)
    setPinEdits(prev => { const n = { ...prev }; delete n[memberId]; return n })
    setPinSaved(prev => ({ ...prev, [memberId]: true }))
    setTimeout(() => setPinSaved(prev => { const n = { ...prev }; delete n[memberId]; return n }), 2000)
  }

  // ── Member edit ──
  function startMemberEdit(m) {
    setMemberEdits(prev => ({
      ...prev,
      [m.id]: { name: m.name, email: m.email }
    }))
  }

  function handleMemberField(id, field, value) {
    setMemberEdits(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }))
  }

  function saveMemberEdit(id) {
    const edit = memberEdits[id]
    if (!edit) return
    onUpdateMember(id, edit)
    setMemberEdits(prev => { const n = { ...prev }; delete n[id]; return n })
    setMemberSaved(prev => ({ ...prev, [id]: true }))
    setTimeout(() => setMemberSaved(prev => { const n = { ...prev }; delete n[id]; return n }), 2000)
  }

  function cancelMemberEdit(id) {
    setMemberEdits(prev => { const n = { ...prev }; delete n[id]; return n })
  }

  // ── Drag-and-drop order list ──
  function DraggableOrderList({ order, label, onReorder }) {
    const dragIdx = useRef(null)
    const [dragOver, setDragOver] = useState(null)

    function onDragStart(i) { dragIdx.current = i }
    function onDragEnter(i) { setDragOver(i) }
    function onDragEnd() {
      if (dragIdx.current === null || dragOver === null || dragIdx.current === dragOver) {
        dragIdx.current = null; setDragOver(null); return
      }
      const next = [...order]
      const [moved] = next.splice(dragIdx.current, 1)
      next.splice(dragOver, 0, moved)
      onReorder(next)
      dragIdx.current = null
      setDragOver(null)
    }

    return (
      <div className="order-card">
        <div className="order-card-header">
          <h3>{label}</h3>
          <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
            {currentUser.isAdmin
              ? 'Dra rader för att ändra ordning · Topp 3 väljer vecka först'
              : 'Topp 3 väljer vecka först · Alla roterar 3 steg nästa år'}
          </p>
        </div>
        {order.map((memberId, i) => {
          const isMe = memberId === currentUser.id
          const isTop3 = i < 3
          const isDragTarget = dragOver === i
          return (
            <div
              key={memberId}
              className={`order-row${isTop3 ? ' top3' : ''}${isMe ? ' is-me' : ''}`}
              draggable={currentUser.isAdmin}
              onDragStart={() => onDragStart(i)}
              onDragEnter={() => onDragEnter(i)}
              onDragOver={e => e.preventDefault()}
              onDragEnd={onDragEnd}
              style={{
                cursor: currentUser.isAdmin ? 'grab' : 'default',
                outline: isDragTarget ? '2px solid var(--pine-soft)' : 'none',
                borderRadius: isDragTarget ? 6 : undefined,
                opacity: dragIdx.current === i ? 0.4 : 1,
              }}
            >
              {currentUser.isAdmin && (
                <span style={{ color: 'var(--muted)', fontSize: 14, marginRight: 6, userSelect: 'none' }}>⠿</span>
              )}
              <div className="order-rank">{i + 1}</div>
              <span className="order-name">
                {getMember(memberId).name}
                {isMe && <span className="badge badge-mine" style={{ marginLeft: 8 }}>Du</span>}
              </span>
              {isTop3 && !isMe && (
                <span className="order-tag">Väljer vecka {['1:a', '2:a', '3:e'][i]}</span>
              )}
              {i >= 17 && (
                <span className="order-tag" style={{ color: 'var(--muted)', fontSize: 10 }}>
                  → topp {i - 17 + 1} nästa år
                </span>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div>
      <div className="section-header">
        <div>
          <h2>Turordning {state.year}</h2>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>
            Grön rad = väljer vecka i år · Blå rad = du · De tre sista roterar upp nästa år
          </p>
        </div>
        {currentUser.isAdmin && (
          <button className="btn btn-amber" onClick={() => setConfirming(true)}>
            ⏭ Skifta till {state.year + 1}
          </button>
        )}
      </div>

      {shifted && (
        <div className="notice notice-success" style={{ marginBottom: '1rem' }}>
          ✓ Turordningen har skiftats till {state.year}! Alla har flyttats 3 steg uppåt.
        </div>
      )}

      {!currentUser.isAdmin && (
        <div className="notice notice-info" style={{ marginBottom: '1rem' }}>
          Endast administratören (Andel 1) kan skifta turordningen till nästa år.
        </div>
      )}

      <div className="order-grid">
        <DraggableOrderList order={state.winterOrder} label="❄️ Vinterveckor" onReorder={onReorderWinter} />
        <DraggableOrderList order={state.summerOrder} label="☀️ Sommarveckor" onReorder={onReorderSummer} />
      </div>

      {/* Förklaringsruta */}
      <div className="card card-pad" style={{ marginTop: '1.5rem', background: 'var(--warm)' }}>
        <h3 style={{ fontSize: '1rem', marginBottom: 8 }}>Hur fungerar turordningen?</h3>
        <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.7 }}>
          Varje år väljer de 20 andelarna sin vintervecka och sommarvecka i turordning — den som
          är högst upp väljer först. Varje år roteras alla <strong>3 steg uppåt</strong>: de tre
          som var överst hamnar längst ned, och alla andra klättrar upp tre platser.
        </p>
      </div>

      {/* Admin: Redigera medlemmar */}
      {currentUser.isAdmin && (
        <div className="card card-pad" style={{ marginTop: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: 4 }}>✏️ Redigera medlemmar</h3>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>
            Klicka Redigera för att ändra namn och e-post på en andel.
          </p>
          <div style={{ display: 'grid', gap: 8 }}>
            {members.map(m => {
              const editing = memberEdits[m.id]
              const saved = memberSaved[m.id]
              return (
                <div key={m.id} style={{
                  display: 'grid', gridTemplateColumns: '120px 1fr', gap: 8,
                  alignItems: 'center', padding: '6px 0',
                  borderBottom: '1px solid var(--border)'
                }}>
                  <span style={{ fontSize: 13, color: 'var(--muted)' }}>Andel {m.id}</span>
                  {editing ? (
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                      <input
                        value={editing.name}
                        onChange={e => handleMemberField(m.id, 'name', e.target.value)}
                        placeholder="Namn"
                        style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '5px 10px', fontSize: 13, width: 160 }}
                      />
                      <input
                        value={editing.email}
                        onChange={e => handleMemberField(m.id, 'email', e.target.value)}
                        placeholder="E-post"
                        type="email"
                        style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '5px 10px', fontSize: 13, width: 200 }}
                      />
                      <button
                        className="btn btn-primary"
                        style={{ padding: '5px 12px', fontSize: 13 }}
                        disabled={!editing.name.trim()}
                        onClick={() => saveMemberEdit(m.id)}
                      >
                        Spara
                      </button>
                      <button
                        className="btn"
                        style={{ padding: '5px 12px', fontSize: 13 }}
                        onClick={() => cancelMemberEdit(m.id)}
                      >
                        Avbryt
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 14, flex: 1 }}>
                        <strong>{m.name}</strong>
                        {m.email && <span style={{ color: 'var(--muted)', marginLeft: 8, fontSize: 12 }}>{m.email}</span>}
                      </span>
                      {saved
                        ? <span style={{ fontSize: 13, color: 'var(--green)' }}>✓ Sparat</span>
                        : <button className="btn" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => startMemberEdit(m)}>Redigera</button>
                      }
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Admin: PIN-hantering */}
      {currentUser.isAdmin && (
        <div className="card card-pad" style={{ marginTop: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: 4 }}>🔑 Ändra PIN-koder</h3>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>
            Ange nytt lösenord för en andel och klicka Spara. Ändringen gäller direkt.
          </p>
          <div style={{ display: 'grid', gap: 10 }}>
            {members.map(m => {
              const currentPin = m.pin
              const draft = pinEdits[m.id] ?? ''
              const saved = pinSaved[m.id]
              return (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <span style={{ minWidth: 180, fontSize: 14 }}>
                    <strong>Andel {m.id}</strong> — {m.name}
                  </span>
                  <input
                    type="text"
                    value={draft}
                    placeholder={`Nuvarande: ${currentPin}`}
                    onChange={e => setPinEdits(prev => ({ ...prev, [m.id]: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && handlePinSave(m.id)}
                    style={{
                      border: '1px solid var(--border)', borderRadius: 8, padding: '6px 10px',
                      fontSize: 14, width: 140, fontFamily: 'monospace'
                    }}
                  />
                  <button
                    className="btn btn-primary"
                    style={{ padding: '6px 14px', fontSize: 13 }}
                    disabled={draft.trim().length < 4}
                    onClick={() => handlePinSave(m.id)}
                  >
                    Spara
                  </button>
                  {saved && <span style={{ fontSize: 13, color: 'var(--green)' }}>✓ Sparat</span>}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Admin-bekräftelsedialog */}
      {confirming && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200
          }}
          onClick={() => setConfirming(false)}
        >
          <div
            className="card card-pad"
            style={{ maxWidth: 380, width: '90%' }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ fontFamily: 'Lora,serif', marginBottom: 8 }}>
              Skifta till {state.year + 1}?
            </h3>
            <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 6 }}>
              Detta kommer att:
            </p>
            <ul style={{ fontSize: 13, color: 'var(--muted)', marginLeft: '1.2rem', marginBottom: 16, lineHeight: 1.9 }}>
              <li>Rensa alla bokningar för {state.year}</li>
              <li>Flytta alla 3 steg uppåt i turordningen</li>
              <li>Starta ett nytt bokningsår ({state.year + 1})</li>
            </ul>
            <div className="notice notice-warn" style={{ marginBottom: '1rem' }}>
              ⚠ Åtgärden kan inte ångras!
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary" onClick={handleShift}>
                Ja, skifta till {state.year + 1}
              </button>
              <button className="btn" onClick={() => setConfirming(false)}>Avbryt</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
