import { NextResponse } from "next/server";
import { getBookingsForDate, getService } from "../../../lib/db";
import { generateSlots } from "../../../lib/slots";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const serviceId = searchParams.get("service_id");

  if (!date || !serviceId) {
    return NextResponse.json({ error: "date and service_id are required" }, { status: 400 });
  }

  const service = getService(serviceId);
  if (!service) {
    return NextResponse.json({ error: "unknown service" }, { status: 404 });
  }

  const existingBookings = await getBookingsForDate(date);
  const slots = generateSlots({
    durationMinutes: service.duration_minutes,
    existingBookings,
    serviceById: getService,
  });

  return NextResponse.json({ date, service_id: Number(serviceId), slots });
}
