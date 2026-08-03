// Vercel cron-funktion — körs automatiskt 1 juli (vinter öppnar) och 1 dec (sommar öppnar)
const SUPABASE_URL = 'https://wnpwfsqxrpwenhrvovuy.supabase.co'
const SUPABASE_KEY = 'sb_publishable_aj3I1_eoHwv2TxhXnLXaiQ_db-owkqP'
const EJ_SERVICE   = 'service_lk9fzfk'
const EJ_TURN      = 'template_hcgatso'
const EJ_NOTIFY    = 'template_v4uxcbb'
const EJ_KEY       = 'Ff4tdAEELanj5_oiI'

async function sbFetch(path) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  })
  return res.json()
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

module.exports = async function handler(req, res) {
  const now = new Date()
  const month = now.getMonth() + 1
  const day   = now.getDate()

  let season = null
  if (month === 7  && day === 1) season = 'winter'  // 1 juli  → vinterbokning öppnar
  if (month === 12 && day === 1) season = 'summer'  // 1 dec   → sommarbokning öppnar

  if (!season) {
    return res.status(200).json({ message: 'Inget att skicka idag.' })
  }

  try {
    const [members, settings] = await Promise.all([
      sbFetch('/members?select=*&order=id'),
      sbFetch('/settings?id=eq.1&select=*'),
    ])

    const setting    = settings[0]
    const order      = season === 'winter' ? setting.winter_order : setting.summer_order
    const firstId    = order[0]
    const firstName  = members.find(m => m.id === firstId)?.name ?? ''
    const seasonName = season === 'winter' ? 'vinter' : 'sommar'

    const emailMembers = members.filter(m => m.email)

    await Promise.all(emailMembers.map(m => {
      if (m.id === firstId) {
        return ejSend(EJ_TURN, m.email, m.name, {
          from_name: 'Hemfjällsklubben',
          season: seasonName,
        })
      }
      return ejSend(EJ_NOTIFY, m.email, m.name, {
        from_name: 'Hemfjällsklubben',
        message: `meddelar att bokningen av ${seasonName}veckor nu är öppen! Det är ${firstName}s tur att boka sin vecka först. Du får ett mejl när det är din tur.`,
        date: '',
      })
    }))

    res.status(200).json({ success: true, season, sent: emailMembers.length })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
