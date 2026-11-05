import { NextResponse } from "next/server";
import { BookingError, getBooking } from "../../../../lib/bookings.js";

export const dynamic = "force-dynamic";

export async function GET(_request, { params }) {
  const { id } = await params;
  try {
    const booking = await getBooking(id);
    return NextResponse.json({ booking });
  } catch (error) {
    const status = error instanceof BookingError ? error.status : 500;
    const message = status === 500 ? "We couldn’t open that booking." : error.message;
    return NextResponse.json({ error: message }, { status });
  }
}
