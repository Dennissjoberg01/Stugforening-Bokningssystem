# 🏡 Stugföreningen — Bokningssystem

## Kom igång på 3 minuter

### Förkrav
- [Node.js](https://nodejs.org) version 18 eller nyare installerat

### Starta lokalt

```bash
# 1. Gå in i projektmappen
cd stugforeningen

# 2. Installera paket (görs bara en gång)
npm install

# 3. Starta utvecklingsservern
npm run dev
```

Öppna sedan `http://localhost:5173` i webbläsaren.

**Testinloggning:**
- Andel 1 (Admin) — PIN: `1111`
- Andel 2 — PIN: `2222`
- Andel 3 — PIN: `3333` ... osv.

---

## Funktioner

| Funktion | Status |
|---|---|
| Kalendervy med alla bokningar | ✅ |
| Turordningslista vinter + sommar | ✅ |
| 3-stegs-rotation till nästa år (admin) | ✅ |
| Avbokning med bekräftelsedialog | ✅ |
| Boka ledig (avbokad) vecka | ✅ |
| Sparning i localStorage | ✅ |
| E-postnotiser vid avbokning | 🔧 Se nedan |

---

## Aktivera e-postnotiser med EmailJS

### Steg 1 — Skapa konto
Gå till [emailjs.com](https://www.emailjs.com) och skapa ett gratis konto.
Gratisplanen ger 200 mejl/månad, vilket är mer än tillräckligt.

### Steg 2 — Skapa en e-posttjänst
Under **Email Services**, koppla ditt Gmail-/Outlook-konto.
Spara **Service ID** (t.ex. `service_abc123`).

### Steg 3 — Skapa en e-postmall
Under **Email Templates**, skapa en mall med följande variabler:

```
Ämne: Ledig stugvecka! {{week_label}} ({{week_dates}}) är nu tillgänglig

Hej!

{{cancelled_by}} har avbokat sin vecka i stugföreningen.

Vecka: {{week_label}}
Period: {{week_dates}}
Säsong: {{season}}

Veckan är nu ledig för bokning. Logga in på bokningssystemet för att boka den.

Mvh,
Stugföreningen
```

Spara **Template ID** (t.ex. `template_xyz789`).

### Steg 4 — Hämta Public Key
Under **Account → General**, kopiera din **Public Key**.

### Steg 5 — Lägg in i koden

Öppna `src/App.jsx` och ersätt funktionen `sendCancellationEmail`:

```javascript
import emailjs from '@emailjs/browser'

// Kör en gång vid appstart
emailjs.init('DIN_PUBLIC_KEY')

function sendCancellationEmail(bookingKey, byName) {
  const season = bookingKey.startsWith('winter') ? 'Vinter' : 'Sommar'
  const weekNum = bookingKey.split('_')[1]
  const weeks = bookingKey.startsWith('winter') ? WINTER_WEEKS : SUMMER_WEEKS
  const weekInfo = weeks.find(w => `w${w.n}` === weekNum)

  // Skicka till varje medlem
  MEMBERS.forEach(member => {
    emailjs.send('DIN_SERVICE_ID', 'DIN_TEMPLATE_ID', {
      to_email: member.email,
      to_name: member.name,
      cancelled_by: byName,
      week_label: weekInfo?.label,
      week_dates: weekInfo?.dates,
      season,
    })
  })
}
```

Installera emailjs-paketet:
```bash
npm install @emailjs/browser
```

---

## Publicera på Netlify (gratis)

```bash
# Bygg produktionsversionen
npm run build
```

Dra och släpp mappen `dist/` på [netlify.com/drop](https://app.netlify.com/drop).

Din sajt är nu live med en URL du kan dela med alla 20 andelar!

---

## Nästa steg / förbättringar

- **Riktig databas** — Byt localStorage mot Supabase eller Firebase för delad data
- **Adminpanel** — Hantera medlemmar, ändra PIN-koder
- **Bokningshistorik** — Se vad som bokats historiskt per andel
- **Påminnelser** — Automatiska mejl när det snart är dags att välja vecka
