import { NextResponse } from "next/server";
import { listSlots } from "../../../lib/bookings.js";

export const dynamic = "force-dynamic";

export async function GET() {
  const slots = await listSlots();
  return NextResponse.json(slots);
}
