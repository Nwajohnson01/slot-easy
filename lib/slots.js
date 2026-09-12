// Generates the working-hours time grid and removes slots that would
// overlap an existing booking, given a service duration.

const OPEN_HOUR = 9;
const CLOSE_HOUR = 17;
const STEP_MINUTES = 30;

export function nextBusinessDays(count) {
  const days = [];
  let d = new Date();
  while (days.length < count) {
    d = new Date(d.getTime() + 24 * 60 * 60 * 1000);
    const day = d.getDay();
    if (day !== 0 && day !== 6) {
      days.push(d.toISOString().slice(0, 10));
    }
  }
  return days;
}

function toMinutes(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function toHHMM(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function generateSlots({ durationMinutes, existingBookings, serviceById }) {
  const taken = existingBookings.map((b) => {
    const start = toMinutes(b.booking_time);
    const dur = serviceById(b.service_id)?.duration_minutes ?? STEP_MINUTES;
    return { start, end: start + dur };
  });

  const slots = [];
  for (let m = OPEN_HOUR * 60; m + durationMinutes <= CLOSE_HOUR * 60; m += STEP_MINUTES) {
    const end = m + durationMinutes;
    const overlaps = taken.some((t) => m < t.end && end > t.start);
    if (!overlaps) slots.push(toHHMM(m));
  }
  return slots;
}
