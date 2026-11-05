import { NextResponse } from "next/server";
import { BookingError, createBooking } from "../../../lib/bookings.js";

export const dynamic = "force-dynamic";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Please check the form and try again." }, { status: 400 });
  }
  try {
    const booking = await createBooking(body);
    return NextResponse.json({ booking }, { status: 201 });
  } catch (error) {
    const status = error instanceof BookingError ? error.status : 500;
    const message = status === 500 ? "We couldn’t save that booking. Please try again." : error.message;
    return NextResponse.json({ error: message }, { status });
  }
}
