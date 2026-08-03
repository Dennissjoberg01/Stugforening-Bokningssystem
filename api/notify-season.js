// Vercel cron-funktion — tre automatiska händelser per år:
// 1 juli  → vintersäsongen byter år: rensa vinterbokningar, rotera vinterturordning, skicka öppningsmejl
// 1 nov   → sommarsäsongen byter år: rensa sommarbokningar, rotera sommarturordning (tyst)
// 1 dec   → sommarbokning öppnar: skicka öppningsmejl

const SUPABASE_URL = 'https://wnpwfsqxrpwenhrvovuy.supabase.co'
const SUPABASE_KEY = 'sb_publishable_aj3I1_eoHwv2TxhXnLXaiQ_db-owkqP'
const EJ_SERVICE   = 'service_lk9fzfk'
const EJ_TURN      = 'template_hcgatso'
const EJ_NOTIFY    = 'template_v4uxcbb'
const EJ_KEY       = 'Ff4tdAEELanj5_oiI'

function rotateOrder(order) {
  return [...order.slice(3), ...order.slice(0, 3)]
}

async function sbGet(path) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  })
  return res.json()
}

async function sbPatch(path, body) {
  return fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    method: 'PATCH',
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(body),
  })
}

async function sbDelete(path) {
  return fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    method: 'DELETE',
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      Prefer: 'return=minimal',
    },
  })
}

async function ejSend(templateId, toEmail, toName, params) {
  return fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      service_id: EJ_SERVICE,
      template_id: templateId,
      user_id: EJ_KEY,
      template_params: { to_name: toName, to_email: toEmail, ...params },
    }),
  })
}

export default async function handler(req, res) {
  const now   = new Date()
  const month = now.getMonth() + 1
  const day   = now.getDate()

  // 1 juli: vinter byter år + öppnar
  // 1 nov:  sommar byter år (tyst — mejl skickas 1 dec)
  // 1 dec:  sommarbokning öppnar — skicka mejl
  const isJul1 = month === 7  && day === 1
  const isNov1 = month === 11 && day === 1
  const isDec1 = month === 12 && day === 1

  if (!isJul1 && !isNov1 && !isDec1) {
    return res.status(200).json({ message: 'Inget att göra idag.' })
  }

  try {
    const [members, settings] = await Promise.all([
      sbGet('/members?select=*&order=id'),
      sbGet('/settings?id=eq.1&select=*'),
    ])
    const setting = settings[0]

    // ── 1 juli: vinter byter år ─────────────────────────────────
    if (isJul1) {
      const newWinterOrder = rotateOrder(setting.winter_order)
      const newWinterYear  = (setting.winter_year ?? setting.year ?? 2025) + 1

      await Promise.all([
        sbPatch('/settings?id=eq.1', { winter_order: newWinterOrder, winter_year: newWinterYear }),
        sbDelete('/bookings?booking_key=like.winter_%25'),
      ])

      const firstId   = newWinterOrder[0]
      const firstName = members.find(m => m.id === firstId)?.name ?? ''
      await Promise.all(members.filter(m => m.email).map(m => {
        if (m.id === firstId) {
          return ejSend(EJ_TURN, m.email, m.name, { from_name: 'Hemfjällsklubben', season: 'vinter' })
        }
        return ejSend(EJ_NOTIFY, m.email, m.name, {
          from_name: 'Hemfjällsklubben',
          message: `meddelar att bokningen av vinterveckor nu är öppen! Det är ${firstName}s tur att boka sin vecka först. Du får ett mejl när det är din tur.`,
          date: '',
        })
      }))

      return res.status(200).json({ success: true, action: 'winter-new-year', winterYear: newWinterYear, sent: members.filter(m => m.email).length })
    }

    // ── 1 november: sommar byter år (tyst) ──────────────────────
    if (isNov1) {
      const newSummerOrder = rotateOrder(setting.summer_order)
      const newSummerYear  = (setting.year ?? 2025) + 1

      await Promise.all([
        sbPatch('/settings?id=eq.1', { summer_order: newSummerOrder, year: newSummerYear }),
        sbDelete('/bookings?booking_key=like.summer_%25'),
      ])

      return res.status(200).json({ success: true, action: 'summer-new-year', summerYear: newSummerYear })
    }

    // ── 1 december: skicka sommaröppningsmejl ───────────────────
    if (isDec1) {
      const firstId   = setting.summer_order[0]
      const firstName = members.find(m => m.id === firstId)?.name ?? ''

      await Promise.all(members.filter(m => m.email).map(m => {
        if (m.id === firstId) {
          return ejSend(EJ_TURN, m.email, m.name, { from_name: 'Hemfjällsklubben', season: 'sommar' })
        }
        return ejSend(EJ_NOTIFY, m.email, m.name, {
          from_name: 'Hemfjällsklubben',
          message: `meddelar att bokningen av sommarveckor nu är öppen! Det är ${firstName}s tur att boka sin vecka först. Du får ett mejl när det är din tur.`,
          date: '',
        })
      }))

      return res.status(200).json({ success: true, action: 'summer-notify', sent: members.filter(m => m.email).length })
    }
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
