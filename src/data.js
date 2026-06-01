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

// Veckodefinitioner — vinterveckor = dec–maj (v.1–21 + v.49–52), sommarveckor = jun–nov (v.22–48)

// Vinterveckor: v.1–21 (jan–maj år+1) + v.49–52 (dec år), totalt 25 veckor
// Tar emot säsongsåret (t.ex. 2025 → dec 2025 + jan–maj 2026)
export function getWinterWeeks(year) {
  const y  = year       // Dec tillhör detta år
  const y1 = year + 1   // Jan–maj tillhör nästa år
  return [
    { n: 1,  label: "v.1",  dates: `30 dec ${y} – 5 jan ${y1}` },
    { n: 2,  label: "v.2",  dates: `6 – 12 jan ${y1}` },
    { n: 3,  label: "v.3",  dates: `13 – 19 jan ${y1}` },
    { n: 4,  label: "v.4",  dates: `20 – 26 jan ${y1}` },
    { n: 5,  label: "v.5",  dates: `27 jan – 2 feb ${y1}` },
    { n: 6,  label: "v.6",  dates: `3 – 9 feb ${y1}` },
    { n: 7,  label: "v.7",  dates: `10 – 16 feb ${y1}` },
    { n: 8,  label: "v.8",  dates: `17 – 23 feb ${y1}` },
    { n: 9,  label: "v.9",  dates: `24 feb – 2 mar ${y1}` },
    { n: 10, label: "v.10", dates: `3 – 9 mar ${y1}` },
    { n: 11, label: "v.11", dates: `10 – 16 mar ${y1}` },
    { n: 12, label: "v.12", dates: `17 – 23 mar ${y1}` },
    { n: 13, label: "v.13", dates: `24 – 30 mar ${y1}` },
    { n: 14, label: "v.14", dates: `31 mar – 6 apr ${y1}` },
    { n: 15, label: "v.15", dates: `7 – 13 apr ${y1}` },
    { n: 16, label: "v.16", dates: `14 – 20 apr ${y1}` },
    { n: 17, label: "v.17", dates: `21 – 27 apr ${y1}` },
    { n: 18, label: "v.18", dates: `28 apr – 4 maj ${y1}` },
    { n: 19, label: "v.19", dates: `5 – 11 maj ${y1}` },
    { n: 20, label: "v.20", dates: `12 – 18 maj ${y1}` },
    { n: 21, label: "v.21", dates: `19 – 25 maj ${y1}` },
    { n: 49, label: "v.49", dates: `1 – 7 dec ${y}` },
    { n: 50, label: "v.50", dates: `8 – 14 dec ${y}` },
    { n: 51, label: "v.51", dates: `15 – 21 dec ${y}` },
    { n: 52, label: "v.52", dates: `22 – 28 dec ${y}` },
  ]
}

// Sommarveckor: v.22–48 (jun–nov), totalt 27 veckor — alla tillhör samma år
export function getSummerWeeks(year) {
  const y = year
  return [
    { n: 22, label: "v.22", dates: `26 maj – 1 jun ${y}` },
    { n: 23, label: "v.23", dates: `2 – 8 jun ${y}` },
    { n: 24, label: "v.24", dates: `9 – 15 jun ${y}` },
    { n: 25, label: "v.25", dates: `16 – 22 jun ${y}` },
    { n: 26, label: "v.26", dates: `23 – 29 jun ${y}` },
    { n: 27, label: "v.27", dates: `30 jun – 6 jul ${y}` },
    { n: 28, label: "v.28", dates: `7 – 13 jul ${y}` },
    { n: 29, label: "v.29", dates: `14 – 20 jul ${y}` },
    { n: 30, label: "v.30", dates: `21 – 27 jul ${y}` },
    { n: 31, label: "v.31", dates: `28 jul – 3 aug ${y}` },
    { n: 32, label: "v.32", dates: `4 – 10 aug ${y}` },
    { n: 33, label: "v.33", dates: `11 – 17 aug ${y}` },
    { n: 34, label: "v.34", dates: `18 – 24 aug ${y}` },
    { n: 35, label: "v.35", dates: `25 – 31 aug ${y}` },
    { n: 36, label: "v.36", dates: `1 – 7 sep ${y}` },
    { n: 37, label: "v.37", dates: `8 – 14 sep ${y}` },
    { n: 38, label: "v.38", dates: `15 – 21 sep ${y}` },
    { n: 39, label: "v.39", dates: `22 – 28 sep ${y}` },
    { n: 40, label: "v.40", dates: `29 sep – 5 okt ${y}` },
    { n: 41, label: "v.41", dates: `6 – 12 okt ${y}` },
    { n: 42, label: "v.42", dates: `13 – 19 okt ${y}` },
    { n: 43, label: "v.43", dates: `20 – 26 okt ${y}` },
    { n: 44, label: "v.44", dates: `27 okt – 2 nov ${y}` },
    { n: 45, label: "v.45", dates: `3 – 9 nov ${y}` },
    { n: 46, label: "v.46", dates: `10 – 16 nov ${y}` },
    { n: 47, label: "v.47", dates: `17 – 23 nov ${y}` },
    { n: 48, label: "v.48", dates: `24 – 30 nov ${y}` },
  ]
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
