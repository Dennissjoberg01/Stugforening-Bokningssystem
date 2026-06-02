import { useState } from 'react'

function getMemberName(members, id) {
  return members.find(m => m.id === id)?.name || '—'
}

function SeasonBanner({ season, isLocked, isMyTurn, hasPrimary, hasExtra, turnName }) {
  if (isLocked) {
    return (
      <div className="notice notice-warn" style={{ marginBottom: '0.75rem', fontSize: 13 }}>
        🔒 Bokningsperioden är stängd.
        {' Lediga veckor kan bokas som extra veckor utan begränsning.'}
      </div>
    )
  }
  if (hasPrimary) {
    return (
      <div className="notice notice-info" style={{ marginBottom: '0.75rem', fontSize: 13 }}>
        ✓ Du har bokat din {season === 'winter' ? 'vinter' : 'sommar'}vecka. Avboka på Min sida om du vill byta.
      </div>
    )
  }
  if (isMyTurn) {
    return (
      <div className="notice notice-success" style={{ marginBottom: '0.75rem', fontSize: 13 }}>
        🎉 Det är din tur att boka! Välj en ledig vecka nedan.
      </div>
    )
  }
  return (
    <div className="notice notice-info" style={{ marginBottom: '0.75rem', fontSize: 13 }}>
      ⏳ {turnName ? `Det är ${turnName}s tur att boka just nu.` : 'Alla har bokat.'} Du får ett mejl när det är din tur.
    </div>
  )
}

function WeekList({
  weeks, season, bookings, members, currentUser, onBookFree,
  isLocked, hasPrimary, hasExtra, isMyTurn,
}) {
  const [confirmKey, setConfirmKey] = useState(null)

  return (
    <div>
      {weeks.map(w => {
        const key = `${season}_w${w.n}`
        const booking = bookings[key]
        const isCancelled = booking?.cancelled
        const isBooked = booking && !isCancelled
        const isMine = isBooked && booking.memberId === currentUser.id
        const isFree = !booking || isCancelled

        let canBook = false
        let blockReason = null
        if (isFree) {
          if (currentUser.isAdmin) {
            canBook = true
          } else if (!isLocked) {
            if (hasPrimary) blockReason = 'already-primary'
            else if (!isMyTurn) blockReason = 'not-your-turn'
            else canBook = true
          } else {
            canBook = true
          }
        }

        let badge
        if (isMine) {
          badge = (
            <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span className="badge badge-mine">Min bokning</span>
              {booking.isExtra && <span className="badge" style={{ background: 'var(--amber-bg)', color: 'var(--amber)', fontSize: 11 }}>Extra</span>}
            </span>
          )
        } else if (isBooked) {
          badge = <span className="badge badge-booked">Bokad</span>
        } else if (isLocked) {
          badge = <span className="badge" style={{ background: 'var(--amber-bg)', color: 'var(--amber)' }}>Extra vecka</span>
        } else {
          badge = <span className="badge badge-free">Ledig</span>
        }

        const dimmed = isFree && !canBook && !currentUser.isAdmin
        const title =
          blockReason === 'already-primary' ? 'Du har redan bokat din vecka denna säsong' :
          blockReason === 'not-your-turn' ? 'Väntar på din tur i turordningen' :
          canBook ? 'Klicka för att boka' : ''

        return (
          <div
            key={w.n}
            className={`week-row${canBook ? ' is-free' : ''}`}
            title={title}
            onClick={() => canBook && setConfirmKey(key)}
            style={{ opacity: dimmed ? 0.5 : 1 }}
          >
            <span className="week-num">{w.label}</span>
            <span className="week-dates">{w.dates}</span>
            {isBooked && !isMine && (
              <span className="week-owner">{getMemberName(members, booking.memberId)}</span>
            )}
            {badge}

            {confirmKey === key && (
              <div
                style={{
                  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200,
                }}
                onClick={e => { e.stopPropagation(); setConfirmKey(null) }}
              >
                <div
                  className="card card-pad"
                  style={{ maxWidth: 340, width: '100%' }}
                  onClick={e => e.stopPropagation()}
                >
                  <h3 style={{ fontFamily: 'Lora,serif', marginBottom: 8 }}>
                    {isLocked ? 'Boka extra vecka?' : 'Boka veckan?'}
                  </h3>
                  <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 16 }}>
                    {w.label} ({w.dates})
                    {isLocked && <span> — räknas som <strong>extra vecka</strong>.</span>}
                  </p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-primary" onClick={() => { onBookFree(key); setConfirmKey(null) }}>
                      Ja, boka veckan
                    </button>
                    <button className="btn" onClick={() => setConfirmKey(null)}>Avbryt</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function Overview({
  state, currentUser, members, winterWeeks, summerWeeks, onBookFree,
  isWinterLocked, isSummerLocked,
  hasPrimaryWinter, hasPrimarySummer,
  hasExtraWinter, hasExtraSummer,
  winterTurnId, summerTurnId,
}) {
  const booked = Object.values(state.bookings).filter(b => !b.cancelled).length
  const cancelled = Object.values(state.bookings).filter(b => b.cancelled).length
  const total = winterWeeks.length + summerWeeks.length

  const isMyWinterTurn = winterTurnId === currentUser.id
  const isMySummerTurn = summerTurnId === currentUser.id
  const winterTurnName = winterTurnId ? members.find(m => m.id === winterTurnId)?.name : null
  const summerTurnName = summerTurnId ? members.find(m => m.id === summerTurnId)?.name : null

  return (
    <div>
      <div className="section-header">
        <h2>Kalender {state.year}</h2>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <span className="badge badge-booked" style={{ padding: '4px 12px' }}>{booked} bokade</span>
          <span className="badge badge-free" style={{ padding: '4px 12px' }}>{cancelled} avbokade</span>
          <span className="badge" style={{ padding: '4px 12px', background: 'var(--warm)', color: 'var(--muted)' }}>
            {total - booked - cancelled} ej valda
          </span>
        </div>
      </div>

      <div className="cal-grid">
        <div className="cal-section">
          <div className="cal-header">
            <span>❄️</span>
            <div>
              <h3>Vinterveckor <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--muted)' }}>dec–maj</span></h3>
              <p style={{ fontSize: 11, color: isWinterLocked ? 'var(--amber)' : 'var(--green)', marginTop: 2, fontWeight: 500 }}>
                {isWinterLocked ? '🔒 Stängd — deadline 1 okt passerad' : '🟢 Öppen — deadline 1 okt'}
              </p>
            </div>
          </div>
          {!currentUser.isAdmin && (
            <SeasonBanner
              season="winter"
              isLocked={isWinterLocked}
              isMyTurn={isMyWinterTurn}
              hasPrimary={hasPrimaryWinter}
              hasExtra={hasExtraWinter}
              turnName={winterTurnName}
            />
          )}
          <WeekList
            weeks={winterWeeks}
            season="winter"
            bookings={state.bookings}
            members={members}
            currentUser={currentUser}
            onBookFree={onBookFree}
            isLocked={isWinterLocked}
            hasPrimary={hasPrimaryWinter}
            hasExtra={hasExtraWinter}
            isMyTurn={isMyWinterTurn}
          />
        </div>

        <div className="cal-section">
          <div className="cal-header">
            <span>☀️</span>
            <div>
              <h3>Sommarveckor <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--muted)' }}>jun–nov</span></h3>
              <p style={{ fontSize: 11, color: isSummerLocked ? 'var(--amber)' : 'var(--green)', marginTop: 2, fontWeight: 500 }}>
                {isSummerLocked ? '🔒 Stängd — deadline 1 apr passerad' : '🟢 Öppen — deadline 1 apr'}
              </p>
            </div>
          </div>
          {!currentUser.isAdmin && (
            <SeasonBanner
              season="summer"
              isLocked={isSummerLocked}
              isMyTurn={isMySummerTurn}
              hasPrimary={hasPrimarySummer}
              hasExtra={hasExtraSummer}
              turnName={summerTurnName}
            />
          )}
          <WeekList
            weeks={summerWeeks}
            season="summer"
            bookings={state.bookings}
            members={members}
            currentUser={currentUser}
            onBookFree={onBookFree}
            isLocked={isSummerLocked}
            hasPrimary={hasPrimarySummer}
            hasExtra={hasExtraSummer}
            isMyTurn={isMySummerTurn}
          />
        </div>
      </div>

      <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: '1rem', textAlign: 'center' }}>
        Primärbokning följer turordningen · Efter deadline kan lediga veckor bokas som extra (max 1 per säsong)
      </p>
    </div>
  )
}
