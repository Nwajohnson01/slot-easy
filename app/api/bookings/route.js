import { NextResponse } from "next/server";
import { createBooking, getAllBookings, ensureSchema, updateBookingStatus } from "../../../lib/db";

export async function GET() {
  await ensureSchema();
  const bookings = await getAllBookings();
  return NextResponse.json({ bookings });
}

export async function POST(request) {
  await ensureSchema();
  const body = await request.json();
  const { service_id, customer_name, customer_email, booking_date, booking_time } = body;

  if (!service_id || !customer_name || !customer_email || !booking_date || !booking_time) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }

  try {
    const booking = await createBooking({
      service_id: Number(service_id),
      customer_name,
      customer_email,
      booking_date,
      booking_time,
    });
    return NextResponse.json({ booking }, { status: 201 });
  } catch (err) {
    if (err.message === "slot_taken" || err.code === "23505") {
      return NextResponse.json({ error: "That slot was just taken. Please pick another." }, { status: 409 });
    }
    return NextResponse.json({ error: "could not create booking" }, { status: 500 });
  }
}

export async function PATCH(request) {
  const body = await request.json();
  const { id, status } = body;
  if (!id || !status) {
    return NextResponse.json({ error: "id and status required" }, { status: 400 });
  }
  const booking = await updateBookingStatus(id, status);
  return NextResponse.json({ booking });
}
