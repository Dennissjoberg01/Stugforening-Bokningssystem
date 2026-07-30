// ============================================================
// MOCK DATA — ersätt med riktig databas längre fram
// ============================================================

export const CURRENT_YEAR = 2025;

// 20 andelar med namn och e-post
export const MEMBERS = [
  { id: 1,  name: "Anna Lindqvist",    email: "anna@example.com",    pin: "1111" },
  { id: 2,  name: "Björn Eriksson",    email: "bjorn@example.com",   pin: "2222" },
  { id: 3,  name: "Cecilia Holm",      email: "cecilia@example.com", pin: "3333" },
  { id: 4,  name: "David Karlsson",    email: "david@example.com",   pin: "4444" },
  { id: 5,  name: "Eva Svensson",      email: "eva@example.com",     pin: "5555" },
  { id: 6,  name: "Fredrik Berg",      email: "fredrik@example.com", pin: "6666" },
  { id: 7,  name: "Gunilla Larsson",   email: "gunilla@example.com", pin: "7777" },
  { id: 8,  name: "Hans Johansson",    email: "hans@example.com",    pin: "8888" },
  { id: 9,  name: "Ingrid Nilsson",    email: "ingrid@example.com",  pin: "9999" },
  { id: 10, name: "Johan Persson",     email: "johan@example.com",   pin: "1010" },
  { id: 11, name: "Karin Andersson",   email: "karin@example.com",   pin: "1111" },
  { id: 12, name: "Lars Gustafsson",   email: "lars@example.com",    pin: "1212" },
  { id: 13, name: "Maria Olsson",      email: "maria@example.com",   pin: "1313" },
  { id: 14, name: "Nils Magnusson",    email: "nils@example.com",    pin: "1414" },
  { id: 15, name: "Olivia Hansson",    email: "olivia@example.com",  pin: "1515" },
  { id: 16, name: "Peter Jansson",     email: "peter@example.com",   pin: "1616" },
  { id: 17, name: "قanna Bengtsson",   email: "ranna@example.com",   pin: "1717" },
  { id: 18, name: "Stefan Claesson",   email: "stefan@example.com",  pin: "1818" },
  { id: 19, name: "Therese Isaksson",  email: "therese@example.com", pin: "1919" },
  { id: 20, name: "Ulf Söderström",    email: "ulf@example.com",     pin: "2020" },
  { id: 21, name: "Andel 21",          email: "",                    pin: "2121" },
];

// Turordningslistor — ordning avgör vem som väljer FÖRST (index 0 = väljer först)
// Varje år roteras 3 steg uppåt (de tre överst hamnar längst ned)
export const INITIAL_ORDER_WINTER = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21];
export const INITIAL_ORDER_SUMMER = [11,12,13,14,15,16,17,18,19,20,21,1,2,3,4,5,6,7,8,9,10];

// ── Hjälpfunktioner för veckoberäkning ──────────────────────────

const MÅN = ['jan','feb','mar','apr','maj','jun','jul','aug','sep','okt','nov','dec']

// Returnerar måndagen för ISO-vecka N år Y
function isoVeckaMåndag(år, vecka) {
  const jan4 = new Date(år, 0, 4)
  const dag = jan4.getDay() || 7          // mån=1 … sön=7
  const v1Mån = new Date(jan4)
  v1Mån.setDate(jan4.getDate() - dag + 1) // tillbaka till måndag
  const mån = new Date(v1Mån)
  mån.setDate(v1Mån.getDate() + (vecka - 1) * 7)
  return mån
}

// Ger söndag–söndag-perioden för ISO-veckan (sön innan t.o.m. sön efter)
function söndagPeriod(måndag) {
  const start = new Date(måndag)
  start.setDate(måndag.getDate() - 1)     // söndag innan
  const slut = new Date(start)
  slut.setDate(start.getDate() + 7)       // nästa söndag
  return { start, slut }
}

function datumText(start, slut) {
  const sd = start.getDate(), sm = start.getMonth(), sy = start.getFullYear()
  const ed = slut.getDate(),  em = slut.getMonth(),  ey = slut.getFullYear()
  if (sy === ey && sm === em) return `${sd} – ${ed} ${MÅN[sm]} ${sy}`
  if (sy === ey)              return `${sd} ${MÅN[sm]} – ${ed} ${MÅN[em]} ${sy}`
  return `${sd} ${MÅN[sm]} ${sy} – ${ed} ${MÅN[em]} ${ey}`
}

// Vinterveckor: v.1–21 (jan–maj år+1) + v.49–52 (dec år), totalt 25 veckor
export function getWinterWeeks(year) {
  const veckor = []
  for (const n of [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21]) {
    const { start, slut } = söndagPeriod(isoVeckaMåndag(year + 1, n))
    veckor.push({ n, label: `v.${n}`, dates: datumText(start, slut) })
  }
  for (const n of [49,50,51,52]) {
    const { start, slut } = söndagPeriod(isoVeckaMåndag(year, n))
    veckor.push({ n, label: `v.${n}`, dates: datumText(start, slut) })
  }
  return veckor
}

// Sommarveckor: v.22–48 (maj–nov), totalt 27 veckor
export function getSummerWeeks(year) {
  const veckor = []
  for (let n = 22; n <= 48; n++) {
    const { start, slut } = söndagPeriod(isoVeckaMåndag(year, n))
    veckor.push({ n, label: `v.${n}`, dates: datumText(start, slut) })
  }
  return veckor
}

// Roterar listan 3 steg uppåt (de 3 översta hamnar längst ned)
export function rotateOrder(order) {
  return [...order.slice(3), ...order.slice(0, 3)];
}

// Genererar startbokningar: varje medlem tilldelas en vinter- och en sommarvecka
export function generateMockBookings(winterOrder, summerOrder) {
  const bookings = {};

  winterOrder.forEach((memberId, i) => {
    if (i < WINTER_WEEKS.length) {
      const week = WINTER_WEEKS[i];
      bookings[`winter_w${week.n}`] = { memberId, cancelled: false };
    }
  });

  summerOrder.forEach((memberId, i) => {
    if (i < SUMMER_WEEKS.length) {
      const week = SUMMER_WEEKS[i];
      bookings[`summer_w${week.n}`] = { memberId, cancelled: false };
    }
  });

  return bookings;
}
