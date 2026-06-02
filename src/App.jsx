import { useState, useEffect } from 'react'
import {
  MEMBERS, getWinterWeeks, getSummerWeeks,
  INITIAL_ORDER_WINTER, INITIAL_ORDER_SUMMER,
  rotateOrder,
} from './data.js'
import { supabase } from './supabase.js'
import Login from './components/Login.jsx'
import Topbar from './components/Topbar.jsx'
import Overview from './components/Overview.jsx'
import TurordningView from './components/TurordningView.jsx'
import MinSida from './components/MinSida.jsx'

// ── Konvertera DB-rader till appens state-format ──────────────
function rowsToState(settings, memberRows, bookingRows) {
  const bookings = {}
  for (const b of (bookingRows || [])) {
    bookings[b.booking_key] = { memberId: b.member_id, cancelled: b.cancelled, isExtra: b.is_extra, earlyDeparture: b.early_departure ?? null }
  }
  return {
    year: settings.year,
    winterOrder: settings.winter_order,
    summerOrder: settings.summer_order,
    bookings,
    members: memberRows || [],
  }
}

export default function App() {
  const [state, setState] = useState(null)   // null = laddar
  const [loadError, setLoadError] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)
  const [page, setPage] = useState('overview')

  // ── Ladda data från Supabase vid start ──
  useEffect(() => {
    loadAll().then(setState).catch(err => setLoadError(err.message))
  }, [])

  async function loadAll() {
    const [{ data: settings, error: sErr }, { data: memberRows }, { data: bookingRows }] =
      await Promise.all([
        supabase.from('settings').select('*').eq('id', 1).single(),
        supabase.from('members').select('*').order('id'),
        supabase.from('bookings').select('*'),
      ])

    if (sErr) {
      // Första gången — initiera databasen
      await initDB()
      return loadAll()
    }
    return rowsToState(settings, memberRows, bookingRows)
  }

  async function initDB() {
    const year = 2025
    const winterOrder = INITIAL_ORDER_WINTER
    const summerOrder = INITIAL_ORDER_SUMMER

    await supabase.from('settings').upsert({ id: 1, year, winter_order: winterOrder, summer_order: summerOrder })
    await supabase.from('members').upsert(
      MEMBERS.map(m => ({ id: m.id, name: m.name, email: m.email, pin: m.pin }))
    )
  }

  // ── Deadlines ──
  const today = new Date()
  const year = state?.year ?? 2025
  const isSummerLocked = today >= new Date(year, 3, 1)   // 1 april
  const isWinterLocked = today >= new Date(year, 9, 1)   // 1 oktober

  // ── Hjälpfunktioner ──
  function getCurrentTurnId(season, bookings = state?.bookings ?? {}) {
    const order = season === 'winter' ? state.winterOrder : state.summerOrder
    return order.find(id =>
      !Object.entries(bookings).some(
        ([key, b]) => key.startsWith(season) && b.memberId === id && !b.cancelled && !b.isExtra
      )
    ) ?? null
  }

  function hasPrimaryBooking(season, uid = currentUser?.id, bookings = state?.bookings ?? {}) {
    return Object.entries(bookings).some(
      ([key, b]) => key.startsWith(season) && b.memberId === uid && !b.cancelled && !b.isExtra
    )
  }

  function hasExtraBooking(season, uid = currentUser?.id, bookings = state?.bookings ?? {}) {
    return Object.entries(bookings).some(
      ([key, b]) => key.startsWith(season) && b.memberId === uid && !b.cancelled && b.isExtra
    )
  }

  // ── Logga in ──
  function handleLogin(member, pin) {
    if (member.pin !== pin) return 'Fel PIN-kod'
    setCurrentUser({ id: member.id, name: member.name, isAdmin: member.id === 1 })
    setPage('overview')
    return null
  }

  // ── Logga ut ──
  function handleLogout() {
    setCurrentUser(null)
    setPage('overview')
  }

  // ── Avboka ──
  async function handleCancel(bookingKey) {
    const booking = state.bookings[bookingKey]
    if (!booking || booking.memberId !== currentUser.id) return

    await supabase.from('bookings').update({ cancelled: true }).eq('booking_key', bookingKey)

    setState(prev => ({
      ...prev,
      bookings: { ...prev.bookings, [bookingKey]: { ...booking, cancelled: true } },
    }))
    sendCancellationEmail(bookingKey, currentUser.name)
  }

  // ── Boka vecka ──
  async function handleBookFree(bookingKey) {
    if (!currentUser) return
    const season = bookingKey.startsWith('winter') ? 'winter' : 'summer'
    const isLocked = season === 'winter' ? isWinterLocked : isSummerLocked

    if (!currentUser.isAdmin) {
      if (!isLocked) {
        if (getCurrentTurnId(season) !== currentUser.id) return
        if (hasPrimaryBooking(season)) return
      }
    }

    const newBooking = { memberId: currentUser.id, cancelled: false, isExtra: isLocked }
    const newBookings = { ...state.bookings, [bookingKey]: newBooking }

    await supabase.from('bookings').upsert({
      booking_key: bookingKey,
      member_id: currentUser.id,
      cancelled: false,
      is_extra: isLocked,
    })

    setState(prev => ({ ...prev, bookings: newBookings }))

    if (!isLocked) {
      const order = season === 'winter' ? state.winterOrder : state.summerOrder
      const nextId = order.find(id =>
        id !== currentUser.id &&
        !Object.entries(newBookings).some(
          ([key, b]) => key.startsWith(season) && b.memberId === id && !b.cancelled && !b.isExtra
        )
      )
      if (nextId) sendTurnEmail(season, nextId)
    }
  }

  // ── Lämnar tidigt ──
  async function handleEarlyDeparture(bookingKey, date) {
    await supabase.from('bookings').update({ early_departure: date }).eq('booking_key', bookingKey)
    setState(prev => ({
      ...prev,
      bookings: { ...prev.bookings, [bookingKey]: { ...prev.bookings[bookingKey], earlyDeparture: date } }
    }))

    // Hitta nästa vecka och rätt mottagare
    const season = bookingKey.startsWith('winter') ? 'winter' : 'summer'
    const weeks = season === 'winter' ? winterWeeks : summerWeeks
    const weekN = parseInt(bookingKey.split('_w')[1])
    const currentIdx = weeks.findIndex(w => w.n === weekN)
    const nextWeek = weeks[currentIdx + 1]

    if (nextWeek) {
      const nextKey = `${season}_w${nextWeek.n}`
      const nextBooking = state.bookings[nextKey]
      if (nextBooking && !nextBooking.cancelled) {
        sendEarlyDepartureEmail(date, nextBooking.memberId, currentUser.name)
      } else {
        sendEarlyDepartureEmailAll(date, currentUser.name)
      }
    }
  }

  // ── Admin: uppdatera namn/e-post ──
  async function handleUpdateMember(memberId, fields) {
    if (!currentUser?.isAdmin) return
    await supabase.from('members').update(fields).eq('id', memberId)
    setState(prev => ({
      ...prev,
      members: prev.members.map(m => m.id === memberId ? { ...m, ...fields } : m),
    }))
  }

  // ── Admin: ändra PIN ──
  async function handleChangePin(memberId, newPin) {
    if (!currentUser?.isAdmin) return
    await supabase.from('members').update({ pin: newPin }).eq('id', memberId)
    setState(prev => ({
      ...prev,
      members: prev.members.map(m => m.id === memberId ? { ...m, pin: newPin } : m),
    }))
  }

  // ── Admin: ändra turordning ──
  async function handleReorderWinter(newOrder) {
    if (!currentUser?.isAdmin) return
    await supabase.from('settings').update({ winter_order: newOrder }).eq('id', 1)
    setState(prev => ({ ...prev, winterOrder: newOrder }))
  }

  async function handleReorderSummer(newOrder) {
    if (!currentUser?.isAdmin) return
    await supabase.from('settings').update({ summer_order: newOrder }).eq('id', 1)
    setState(prev => ({ ...prev, summerOrder: newOrder }))
  }

  // ── Admin: skifta till nästa år ──
  async function handleNextYear() {
    if (!currentUser?.isAdmin) return
    const newWinter = rotateOrder(state.winterOrder)
    const newSummer = rotateOrder(state.summerOrder)
    const newYear = state.year + 1

    await Promise.all([
      supabase.from('settings').update({ year: newYear, winter_order: newWinter, summer_order: newSummer }).eq('id', 1),
      supabase.from('bookings').delete().neq('booking_key', ''),
    ])

    setState(prev => ({ ...prev, year: newYear, winterOrder: newWinter, summerOrder: newSummer, bookings: {} }))
  }

  // ── Veckodefinitioner med rätt årstal ──
  const winterWeeks = getWinterWeeks(state?.year ?? 2025)
  const summerWeeks = getSummerWeeks(state?.year ?? 2025)

  // ── E-post (simulerad) ──
  const members = state?.members ?? []

  function sendCancellationEmail(bookingKey, byName) {
    const season = bookingKey.startsWith('winter') ? 'vinter' : 'sommar'
    const weeks = bookingKey.startsWith('winter') ? winterWeeks : summerWeeks
    const weekInfo = weeks.find(w => `winter_w${w.n}` === bookingKey || `summer_w${w.n}` === bookingKey)
    console.log(`📧 [SIMULERAD E-POST] till alla: "${byName} har avbokat sin ${season}vecka ${weekInfo?.label}."`)
  }

  function sendEarlyDepartureEmail(date, memberId, fromName) {
    const member = members.find(m => m.id === memberId)
    console.log(`📧 [SIMULERAD E-POST] till ${member?.name} (${member?.email}):\n"${fromName} lämnar stugan tidigt den ${date}. Stugan är tillgänglig från det datumet!"`)
  }

  function sendEarlyDepartureEmailAll(date, fromName) {
    console.log(`📧 [SIMULERAD E-POST] till alla medlemmar:\n"${fromName} lämnar stugan tidigt den ${date}. Veckan är ledig från det datumet — passa på att boka en extra vecka!"`)
  }

  function sendTurnEmail(season, memberId) {
    const member = members.find(m => m.id === memberId)
    const seasonName = season === 'winter' ? 'vinter' : 'sommar'
    console.log(`📧 [SIMULERAD E-POST] till ${member?.name} (${member?.email}): "Det är nu din tur att boka din ${seasonName}vecka!"`)
  }

  // ── Laddningsskärm ──
  if (loadError) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', flexDirection: 'column', gap: 12 }}>
        <p style={{ color: 'var(--red)', fontWeight: 500 }}>Kunde inte ansluta till databasen</p>
        <p style={{ fontSize: 13, color: 'var(--muted)' }}>{loadError}</p>
        <button className="btn btn-primary" onClick={() => { setLoadError(null); loadAll().then(setState).catch(e => setLoadError(e.message)) }}>
          Försök igen
        </button>
      </div>
    )
  }

  if (!state) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <p style={{ color: 'var(--muted)', fontSize: 15 }}>Laddar…</p>
      </div>
    )
  }

  if (!currentUser) {
    return <Login members={members} onLogin={handleLogin} />
  }

  const hasPW = hasPrimaryBooking('winter')
  const hasPS = hasPrimaryBooking('summer')
  const hasEW = hasExtraBooking('winter')
  const hasES = hasExtraBooking('summer')
  const winterTurnId = getCurrentTurnId('winter')
  const summerTurnId = getCurrentTurnId('summer')

  return (
    <>
      <Topbar user={currentUser} page={page} onNav={setPage} onLogout={handleLogout} />
      <div className="page">
        {page === 'overview' && (
          <Overview
            state={state}
            currentUser={currentUser}
            members={members}
            winterWeeks={winterWeeks}
            summerWeeks={summerWeeks}
            onBookFree={handleBookFree}
            isWinterLocked={isWinterLocked}
            isSummerLocked={isSummerLocked}
            hasPrimaryWinter={hasPW}
            hasPrimarySummer={hasPS}
            hasExtraWinter={hasEW}
            hasExtraSummer={hasES}
            winterTurnId={winterTurnId}
            summerTurnId={summerTurnId}
          />
        )}
        {page === 'turordning' && (
          <TurordningView
            state={state}
            currentUser={currentUser}
            members={members}
            onNextYear={handleNextYear}
            onChangePin={handleChangePin}
            onUpdateMember={handleUpdateMember}
            onReorderWinter={handleReorderWinter}
            onReorderSummer={handleReorderSummer}
          />
        )}
        {page === 'min-sida' && (
          <MinSida
            state={state}
            currentUser={currentUser}
            members={members}
            winterWeeks={winterWeeks}
            summerWeeks={summerWeeks}
            onCancel={handleCancel}
            onBookFree={handleBookFree}
            onEarlyDeparture={handleEarlyDeparture}
            isWinterLocked={isWinterLocked}
            isSummerLocked={isSummerLocked}
            hasPrimaryWinter={hasPW}
            hasPrimarySummer={hasPS}
            hasExtraWinter={hasEW}
            hasExtraSummer={hasES}
            winterTurnId={winterTurnId}
            summerTurnId={summerTurnId}
          />
        )}
      </div>
    </>
  )
}
