import { after, NextResponse } from "next/server";
import { BookingError, createBooking } from "../../../lib/bookings.js";
import { notifyOffice } from "../../../lib/mail.js";
import { pushLeadToSheet } from "../../../lib/sheets.js";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Please check the form and try again." }, { status: 400 });
  }
  try {
    const booking = await createBooking(body, { deferSheet: true });
    after(async () => {
      try {
        await pushLeadToSheet(booking);
      } catch (error) {
        console.error(`The lead spreadsheet was not updated: ${error.message}`);
      }
      await notifyOffice(booking);
    });
    return NextResponse.json({ booking }, { status: 201 });
  } catch (error) {
    const status = error instanceof BookingError ? error.status : 500;
    const message = status === 500 ? "We couldn’t save that booking. Please try again." : error.message;
    return NextResponse.json({ error: message }, { status });
  }
}
