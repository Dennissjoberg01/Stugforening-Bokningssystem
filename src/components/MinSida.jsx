import { useState } from 'react'

export default function MinSida({
  state, currentUser, members, winterWeeks, summerWeeks, onCancel, onBookFree,
  isWinterLocked, isSummerLocked,
  hasPrimaryWinter, hasPrimarySummer,
  hasExtraWinter, hasExtraSummer,
  winterTurnId, summerTurnId,
}) {
  const [cancelConfirm, setCancelConfirm] = useState(null)
  const [cancelledNotice, setCancelledNotice] = useState(null)

  const allWeeks = [
    ...winterWeeks.map(w => ({ ...w, season: 'winter', key: `winter_w${w.n}`, seasonLabel: '❄️ Vintervecka' })),
    ...summerWeeks.map(w => ({ ...w, season: 'summer', key: `summer_w${w.n}`, seasonLabel: '☀️ Sommarvecka' })),
  ]

  const myBookings = allWeeks.filter(w => {
    const bk = state.bookings[w.key]
    return bk && bk.memberId === currentUser.id
  })

  // Veckor som är lediga (aldrig bokade eller avbokade av annan) — visas som extra-pool
  const freeWeeks = allWeeks.filter(w => {
    const bk = state.bookings[w.key]
    const isFreeSlot = !bk || (bk.cancelled && bk.memberId !== currentUser.id)
    return isFreeSlot
  })

  const winterFreeWeeks = freeWeeks.filter(w => w.season === 'winter')
  const summerFreeWeeks = freeWeeks.filter(w => w.season === 'summer')

  function doCancel(key) {
    onCancel(key)
    setCancelConfirm(null)
    setCancelledNotice(key)
    setTimeout(() => setCancelledNotice(null), 4000)
  }

  const winterPos = state.winterOrder.indexOf(currentUser.id) + 1
  const summerPos = state.summerOrder.indexOf(currentUser.id) + 1
  const totalMembers = members.length
  const isMyWinterTurn = winterTurnId === currentUser.id
  const isMySummerTurn = summerTurnId === currentUser.id

  return (
    <div>
      <div className="section-header">
        <h2>Min sida</h2>
      </div>

      {/* Info-panel */}
      <div className="card card-pad" style={{ marginBottom: '1.5rem', background: 'var(--warm)', border: '0.5px solid var(--border)' }}>
        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Andelsägare</div>
            <div style={{ fontSize: 17, fontWeight: 500, marginTop: 2 }}>{currentUser.name}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Turordning vinter</div>
            <div style={{ fontSize: 17, fontWeight: 500, marginTop: 2 }}>Plats {winterPos} av {totalMembers}</div>
            {!isWinterLocked && !hasPrimaryWinter && (
              <div style={{ fontSize: 12, marginTop: 3, color: isMyWinterTurn ? 'var(--green)' : 'var(--muted)' }}>
                {isMyWinterTurn ? '🎉 Din tur att boka!' : '⏳ Väntar på din tur'}
              </div>
            )}
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Turordning sommar</div>
            <div style={{ fontSize: 17, fontWeight: 500, marginTop: 2 }}>Plats {summerPos} av {totalMembers}</div>
            {!isSummerLocked && !hasPrimarySummer && (
              <div style={{ fontSize: 12, marginTop: 3, color: isMySummerTurn ? 'var(--green)' : 'var(--muted)' }}>
                {isMySummerTurn ? '🎉 Din tur att boka!' : '⏳ Väntar på din tur'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mina bokningar */}
      <h3 style={{ fontFamily: 'Lora,serif', fontSize: '1.1rem', marginBottom: '0.75rem' }}>
        Mina bokningar {state.year}
      </h3>

      {cancelledNotice && (
        <div className="notice notice-warn" style={{ marginBottom: '1rem' }}>
          ✓ Veckan har avbokats och alla medlemmar har fått en e-postnotis (simulerad).
        </div>
      )}

      {myBookings.length === 0 ? (
        <p className="empty">Du har inga bokningar för {state.year} ännu.</p>
      ) : (
        <div className="my-bookings-list">
          {myBookings.map(w => {
            const bk = state.bookings[w.key]
            const isCancelled = bk?.cancelled
            return (
              <div key={w.key} className={`my-booking-card${isCancelled ? ' my-booking-cancelled' : ''}`}>
                <div className="my-booking-info">
                  <div className="my-booking-week">
                    {w.seasonLabel} {w.label}
                    {bk?.isExtra && !isCancelled && (
                      <span className="badge" style={{ marginLeft: 8, background: 'var(--amber-bg)', color: 'var(--amber)', fontSize: 11 }}>Extra</span>
                    )}
                    {isCancelled && (
                      <span className="badge badge-free" style={{ marginLeft: 10 }}>Avbokad</span>
                    )}
                  </div>
                  <div className="my-booking-dates">{w.dates}</div>
                </div>
                {!isCancelled && (
                  <button className="btn btn-danger btn-sm" onClick={() => setCancelConfirm(w.key)}>
                    Avboka
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Extra veckor att boka (efter deadline) */}
      {isWinterLocked && winterFreeWeeks.length > 0 && (
        <ExtraPool
          label="❄️ Extra vinterveckor"
          weeks={winterFreeWeeks}
          hasExtra={hasExtraWinter}
          isAdmin={currentUser.isAdmin}
          onBook={key => onBookFree(key)}
        />
      )}
      {isSummerLocked && summerFreeWeeks.length > 0 && (
        <ExtraPool
          label="☀️ Extra sommarveckor"
          weeks={summerFreeWeeks}
          hasExtra={hasExtraSummer}
          isAdmin={currentUser.isAdmin}
          onBook={key => onBookFree(key)}
        />
      )}

      {/* E-post-info */}
      <div className="card card-pad" style={{ marginTop: '2rem', borderLeft: '3px solid var(--pine-soft)', borderRadius: '0 var(--r-lg) var(--r-lg) 0' }}>
        <h3 style={{ fontSize: '1rem', marginBottom: 6 }}>📧 E-postnotiser</h3>
        <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.7 }}>
          Just nu simuleras e-postnotiser i webbläsarkonsolen (F12). För att aktivera
          riktiga mejl: skapa ett gratis konto på{' '}
          <a href="https://www.emailjs.com" target="_blank" rel="noopener noreferrer"
            style={{ color: 'var(--pine)', fontWeight: 500 }}>EmailJS.com</a>{' '}
          och lägg in din Service ID + Template ID i koden.
        </p>
      </div>

      {/* Avboka-dialog */}
      {cancelConfirm && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200,
          }}
          onClick={() => setCancelConfirm(null)}
        >
          <div
            className="card card-pad"
            style={{ maxWidth: 360, width: '90%' }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ fontFamily: 'Lora,serif', marginBottom: 8 }}>Avboka veckan?</h3>
            <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 16, lineHeight: 1.6 }}>
              Veckan frigörs och alla medlemmar får en e-postnotis.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-danger" onClick={() => doCancel(cancelConfirm)}>Ja, avboka</button>
              <button className="btn" onClick={() => setCancelConfirm(null)}>Avbryt</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ExtraPool({ label, weeks, onBook }) {
  return (
    <>
      <h3 style={{ fontFamily: 'Lora,serif', fontSize: '1.1rem', margin: '1.5rem 0 0.5rem' }}>
        {label} <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--amber)' }}>— extra veckor</span>
      </h3>
      <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: '0.75rem' }}>
        Lediga veckor som kan bokas utöver din ordinarie bokning.
      </p>
      <div className="my-bookings-list">
        {weeks.map(w => (
          <div key={w.key} className="my-booking-card" style={{ background: 'var(--amber-bg)' }}>
            <div className="my-booking-info">
              <div className="my-booking-week">{w.seasonLabel} {w.label}</div>
              <div className="my-booking-dates">{w.dates}</div>
            </div>
            <button className="btn btn-sm" style={{ background: 'var(--amber)', color: '#fff' }} onClick={() => onBook(w.key)}>Boka extra</button>
          </div>
        ))}
      </div>
    </>
  )
}
