// Delivery dates and time slots, always reckoned in India time whatever the
// server's clock says. Pure functions: the checkout form uses them to show
// choices and the server uses them again to validate the order.

export type Slot = { start: string; end: string }; // "HH:MM", 24-hour

export type DeliveryRules = {
  sameDayCutoff: string; // "HH:MM", or "" for no cut-off
  leadTimeMinutes: number; // a slot must end at least this long after "now"
  slots: Slot[];
  daysAhead: number;
};

const TIME_ZONE = "Asia/Kolkata";

export function indiaNow(at = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(at);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  return {
    dateKey: `${get("year")}-${get("month")}-${get("day")}`,
    minutes: Number(get("hour")) * 60 + Number(get("minute")),
  };
}

export type IndiaNow = ReturnType<typeof indiaNow>;

export function toMinutes(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

/** "08:00" → "8 AM", "13:30" → "1:30 PM". */
export function formatTime(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  const suffix = h < 12 ? "AM" : "PM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${hour} ${suffix}` : `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
}

export function slotLabel(slot: Slot) {
  return `${formatTime(slot.start)} – ${formatTime(slot.end)}`;
}

export function addDays(dateKey: string, days: number) {
  const d = new Date(`${dateKey}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

const dayFormat = new Intl.DateTimeFormat("en-IN", { weekday: "short", timeZone: "UTC" });
const dateFormat = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", timeZone: "UTC" });
const longFormat = new Intl.DateTimeFormat("en-IN", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});

/** { day: "Today" | "Tomorrow" | "Fri", date: "3 Oct" } */
export function dateChip(dateKey: string, todayKey: string) {
  const d = new Date(`${dateKey}T00:00:00Z`);
  const day =
    dateKey === todayKey ? "Today" : dateKey === addDays(todayKey, 1) ? "Tomorrow" : dayFormat.format(d);
  return { day, date: dateFormat.format(d) };
}

/** "Friday, 3 October" */
export function formatLongDate(dateKey: string) {
  return longFormat.format(new Date(`${dateKey}T00:00:00Z`));
}

export function slotsFor(dateKey: string, rules: DeliveryRules, now: IndiaNow = indiaNow()): Slot[] {
  const sorted = [...rules.slots].sort((a, b) => toMinutes(a.start) - toMinutes(b.start));
  if (dateKey < now.dateKey || dateKey > addDays(now.dateKey, rules.daysAhead)) return [];
  if (dateKey > now.dateKey) return sorted;
  if (rules.sameDayCutoff && now.minutes >= toMinutes(rules.sameDayCutoff)) return [];
  return sorted.filter((s) => toMinutes(s.end) - rules.leadTimeMinutes >= now.minutes);
}

/** Every date from today to `daysAhead` that still has at least one slot. */
export function deliveryDays(rules: DeliveryRules, now: IndiaNow = indiaNow()) {
  const days: { dateKey: string; slots: Slot[] }[] = [];
  for (let i = 0; i <= rules.daysAhead; i++) {
    const dateKey = addDays(now.dateKey, i);
    const slots = slotsFor(dateKey, rules, now);
    if (slots.length) days.push({ dateKey, slots });
  }
  return days;
}

export function isValidDelivery(dateKey: string, label: string, rules: DeliveryRules, now: IndiaNow = indiaNow()) {
  return slotsFor(dateKey, rules, now).some((s) => slotLabel(s) === label);
}
