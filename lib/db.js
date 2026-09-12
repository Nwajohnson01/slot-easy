// Data layer. Uses Vercel Postgres when POSTGRES_URL is configured.
// Falls back to an in-memory store so the app runs immediately, before
// any database is connected — useful for early preview, but note this
// memory resets on every server restart/redeploy.

const SERVICES = [
  { id: 1, name: "Initial Consultation", duration_minutes: 30, description: "A first conversation to scope the work." },
  { id: 2, name: "Working Session", duration_minutes: 60, description: "Focused session to move a project forward." },
  { id: 3, name: "Follow-up Check-in", duration_minutes: 15, description: "Short check-in on progress or open questions." },
];

const usePostgres = !!process.env.POSTGRES_URL;

let memoryBookings = [];
let memoryId = 1;

async function getPg() {
  const { sql } = await import("@vercel/postgres");
  return sql;
}

export async function ensureSchema() {
  if (!usePostgres) return;
  const sql = await getPg();
  await sql`
    CREATE TABLE IF NOT EXISTS bookings (
      id SERIAL PRIMARY KEY,
      service_id INTEGER NOT NULL,
      customer_name TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      booking_date DATE NOT NULL,
      booking_time TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'confirmed',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE(booking_date, booking_time)
    );
  `;
}

export function getServices() {
  return SERVICES;
}

export function getService(id) {
  return SERVICES.find((s) => s.id === Number(id));
}

export async function getBookingsForDate(date) {
  if (usePostgres) {
    const sql = await getPg();
    const { rows } = await sql`
      SELECT * FROM bookings WHERE booking_date = ${date} AND status != 'cancelled';
    `;
    return rows;
  }
  return memoryBookings.filter((b) => b.booking_date === date && b.status !== "cancelled");
}

export async function getAllBookings() {
  if (usePostgres) {
    const sql = await getPg();
    const { rows } = await sql`
      SELECT * FROM bookings ORDER BY booking_date ASC, booking_time ASC;
    `;
    return rows;
  }
  return [...memoryBookings].sort((a, b) =>
    a.booking_date === b.booking_date
      ? a.booking_time.localeCompare(b.booking_time)
      : a.booking_date.localeCompare(b.booking_date)
  );
}

export async function createBooking({ service_id, customer_name, customer_email, booking_date, booking_time }) {
  if (usePostgres) {
    const sql = await getPg();
    const { rows } = await sql`
      INSERT INTO bookings (service_id, customer_name, customer_email, booking_date, booking_time)
      VALUES (${service_id}, ${customer_name}, ${customer_email}, ${booking_date}, ${booking_time})
      RETURNING *;
    `;
    return rows[0];
  }
  const clash = memoryBookings.find(
    (b) => b.booking_date === booking_date && b.booking_time === booking_time && b.status !== "cancelled"
  );
  if (clash) {
    const err = new Error("slot_taken");
    throw err;
  }
  const record = {
    id: memoryId++,
    service_id,
    customer_name,
    customer_email,
    booking_date,
    booking_time,
    status: "confirmed",
    created_at: new Date().toISOString(),
  };
  memoryBookings.push(record);
  return record;
}

export async function updateBookingStatus(id, status) {
  if (usePostgres) {
    const sql = await getPg();
    const { rows } = await sql`
      UPDATE bookings SET status = ${status} WHERE id = ${id} RETURNING *;
    `;
    return rows[0];
  }
  const record = memoryBookings.find((b) => b.id === Number(id));
  if (record) record.status = status;
  return record;
}
