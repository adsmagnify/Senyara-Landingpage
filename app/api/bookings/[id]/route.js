import { after, NextResponse } from "next/server";
import { BookingError, getBooking, updateBooking } from "../../../../lib/bookings.js";
import { notifyOffice } from "../../../../lib/mail.js";
import { pushSessionToSheet } from "../../../../lib/sheets.js";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

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

export async function PATCH(request, { params }) {
  const { id } = await params;
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Please check the form and try again." }, { status: 400 });
  }
  try {
    const booking = await updateBooking(id, body, { deferSheet: body.scheduleOnly === true });
    if (body.scheduleOnly) {
      after(async () => {
        try {
          await pushSessionToSheet(booking);
        } catch (error) {
          console.error(`The lead spreadsheet was not updated: ${error.message}`);
        }
        await notifyOffice(booking);
      });
    }
    return NextResponse.json({ booking });
  } catch (error) {
    const status = error instanceof BookingError ? error.status : 500;
    const message = status === 500 ? "We couldn’t save that booking. Please try again." : error.message;
    return NextResponse.json({ error: message }, { status });
  }
}
