import fs from "fs";
import path from "path";
import { findLeadByReference, pushLeadToSheet } from "./sheets.js";

const dataDir = path.join(process.cwd(), "data");
const bookingsFile = path.join(dataDir, "bookings.json");

const AGES = ["5 to 8", "9 to 11", "12 to 14", "15 to 18"];
const AREAS = ["Dubai", "Sharjah", "Ajman", "Abu Dhabi", "Other emirate"];
const STARTS = ["As soon as possible", "Within the next month", "Next term", "Just exploring for now"];
const PATHS = ["sen", "after", "unsure"];
const TIMES = ["09:00", "10:30", "12:00", "14:00", "15:30", "17:00"];
const SESSION_MINUTES = 45;

export class BookingError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function dubaiNow() {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Dubai",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(new Date())
      .map((part) => [part.type, part.value])
  );
  return {
    ymd: `${parts.year}-${parts.month}-${parts.day}`,
    hm: `${parts.hour}:${parts.minute}`,
  };
}

function addDays(ymd, days) {
  const [year, month, day] = ymd.split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + days));
  const y = next.getUTCFullYear();
  const m = String(next.getUTCMonth() + 1).padStart(2, "0");
  const d = String(next.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function weekday(ymd) {
  const [year, month, day] = ymd.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

function dayLabel(ymd) {
  const [year, month, day] = ymd.split("-").map(Number);
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

async function readBookings() {
  try {
    const raw = await fs.promises.readFile(bookingFile(), "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if (error.code === "ENOENT") return [];
    if (process.env.VERCEL && readOnlyFs(error)) return [];
    throw error;
  }
}

function readOnlyFs(error) {
  return ["EROFS", "EPERM", "EACCES", "ENOTSUP", "ENOENT", "ENOTDIR"].includes(error?.code);
}

function bookingFile() {
  return process.env.VERCEL ? "/tmp/bookings.json" : bookingsFile;
}

let writeChain = Promise.resolve();
function withBookings(mutate) {
  const run = writeChain.then(async () => {
    const bookings = await readBookings();
    const result = await mutate(bookings);
    const file = bookingFile();
    let savedLocally = false;
    try {
      await fs.promises.mkdir(path.dirname(file), { recursive: true });
      await fs.promises.writeFile(file, JSON.stringify(bookings, null, 2));
      savedLocally = true;
    } catch (error) {
      if (!(process.env.VERCEL || readOnlyFs(error))) throw error;
      console.warn("Booking file was not written on this host.");
    }
    if (!result?.sheetOk && (process.env.VERCEL || !savedLocally)) {
      const reason = result?.sheetError ? ` (${result.sheetError})` : "";
      throw new BookingError(502, `We couldn’t add that lead to the sheet${reason}. Please try again.`);
    }
    return result.record;
  });
  writeChain = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}

function buildDays(taken) {
  const now = dubaiNow();
  const days = [];
  for (let offset = 0; days.length < 8 && offset < 21; offset += 1) {
    const date = addDays(now.ymd, offset);
    if (weekday(date) === 0) continue;
    const times = TIMES.filter((hm) => date !== now.ymd || hm > now.hm).map((hm) => {
      const id = `${date}T${hm}`;
      return { id, label: hm, available: !taken.has(id) };
    });
    if (times.length) days.push({ date, label: dayLabel(date), times });
  }
  return days;
}

function slotMap(taken) {
  const map = new Map();
  buildDays(taken).forEach((day) => {
    day.times.forEach((time) => {
      map.set(time.id, { ...time, dayLabel: day.label, slotLabel: `${day.label} · ${time.label} GST` });
    });
  });
  return map;
}

function cleanText(value, max) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, max);
}

export async function listSlots() {
  const bookings = await readBookings();
  const taken = new Set(bookings.map((booking) => booking.slotId));
  return {
    timezone: "Asia/Dubai",
    durationMinutes: SESSION_MINUTES,
    days: buildDays(taken),
  };
}

export async function getBooking(rawId) {
  const id = cleanText(rawId, 12).toUpperCase();
  if (!/^SY-[A-Z0-9]{4}$/.test(id)) {
    throw new BookingError(404, "We couldn’t find that booking.");
  }
  const bookings = await readBookings();
  const booking = bookings.find((item) => item.id === id);
  if (!booking) {
    try {
      const fromSheet = await findLeadByReference(id);
      if (fromSheet) return fromSheet;
    } catch (error) {
      console.error(`Could not read ${id} from the spreadsheet: ${error.message}`);
    }
    throw new BookingError(404, "We couldn’t find that booking.");
  }
  return {
    id: booking.id,
    name: booking.name,
    phone: booking.phone,
    age: booking.age,
    area: booking.area,
    start: booking.start,
    slotLabel: booking.slotLabel,
    durationMinutes: booking.durationMinutes,
  };
}

export async function createBooking(body = {}) {
  const name = cleanText(body.name, 80);
  const phone = cleanText(body.phone, 24);
  const digits = phone.replace(/\D/g, "");
  const age = cleanText(body.age, 20);
  const area = cleanText(body.area, 40);
  const start = cleanText(body.start, 40);
  const slotId = cleanText(body.slotId, 20);
  const pathId = body.path ? cleanText(body.path, 20) : null;
  const skipped = Boolean(body.skipped);
  const consent = body.consent === true;

  if (name.length < 2 || digits.length < 7 || digits.length > 15) {
    throw new BookingError(400, "Please add your name and a valid WhatsApp number.");
  }
  if (!consent) {
    throw new BookingError(400, "Please agree to be contacted about your free session.");
  }
  if (!AGES.includes(age) || !AREAS.includes(area) || !STARTS.includes(start)) {
    throw new BookingError(400, "Please check the age, area, and start time.");
  }
  if (pathId && !PATHS.includes(pathId)) {
    throw new BookingError(400, "Please start the questions again.");
  }

  const picks = Array.isArray(body.picks) ? body.picks.slice(0, 5) : [];
  const answers = picks.map((pick) => ({
    question: cleanText(pick.question, 180),
    answer: cleanText(pick.answer, 120),
  }));

  const calendlyEvent = cleanText(body.calendlyEvent, 240);
  const calendlyStart = cleanText(body.calendlyStart, 64);
  const calendlyWhen = sessionWhen(calendlyStart);

  return withBookings(async (bookings) => {
    const onCalendly = slotId === "calendly";
    let slotLabel = calendlyWhen || "Scheduled on Calendly";
    let durationMinutes = 30;
    if (!onCalendly) {
      const taken = new Set(bookings.map((item) => item.slotId));
      const slot = slotMap(taken).get(slotId);
      if (!slot || !slot.available) {
        throw new BookingError(409, "That time was just taken. Please pick another.");
      }
      slotLabel = slot.slotLabel;
      durationMinutes = SESSION_MINUTES;
    }
    const record = {
      id: `SY-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      createdAt: new Date().toISOString(),
      name,
      phone,
      age,
      area,
      start,
      consent: true,
      path: pathId,
      skipped,
      answers,
      summary: cleanText(body.summary, 500),
      mirror: Array.isArray(body.mirror) ? body.mirror.slice(0, 4).map((line) => cleanText(line, 180)) : [],
      resultKey: cleanText(body.resultKey, 20),
      slotId: onCalendly ? "calendly" : slotId,
      slotLabel,
      durationMinutes,
      calendlyEvent,
    };
    bookings.push(record);
    let sheetOk = false;
    let sheetError = "";
    try {
      const online = await pushLeadToSheet(record);
      sheetOk = Boolean(online.ok);
      if (!sheetOk) {
        sheetError = online.code || "unknown";
        console.warn(`The lead spreadsheet was not updated (${sheetError}).`);
      }
    } catch (error) {
      sheetError = error.message;
      console.error(`The lead spreadsheet was not updated: ${sheetError}`);
    }
    return { record, sheetOk, sheetError };
  });
}

function sessionWhen(iso) {
  const date = new Date(iso);
  if (!iso || Number.isNaN(date.getTime())) return "";
  const label = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Dubai",
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
  return `${label} GST`;
}
