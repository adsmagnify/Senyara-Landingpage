import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, "data");
const bookingsFile = path.join(dataDir, "bookings.json");
const distDir = path.join(__dirname, "..", "client", "dist");
const PORT = Number(process.env.PORT) || 3001;

const AGES = ["5 to 8", "9 to 11", "12 to 14", "15 to 18"];
const AREAS = ["Dubai", "Sharjah", "Ajman", "Abu Dhabi", "Other emirate"];
const STARTS = ["As soon as possible", "Within the next month", "Next term", "Just exploring for now"];
const PATHS = ["sen", "after", "unsure"];
const TIMES = ["09:00", "10:30", "12:00", "14:00", "15:30", "17:00"];
const SESSION_MINUTES = 45;

const app = express();
app.use(express.json({ limit: "32kb" }));

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
    const raw = await fs.promises.readFile(bookingsFile, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

let writeChain = Promise.resolve();
function withBookings(mutate) {
  const run = writeChain.then(async () => {
    const bookings = await readBookings();
    const result = await mutate(bookings);
    await fs.promises.mkdir(dataDir, { recursive: true });
    await fs.promises.writeFile(bookingsFile, JSON.stringify(bookings, null, 2));
    return result;
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
      return {
        id,
        label: hm,
        available: !taken.has(id),
      };
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

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "senyara" });
});

app.get("/api/slots", async (_req, res) => {
  const bookings = await readBookings();
  const taken = new Set(bookings.map((booking) => booking.slotId));
  res.json({
    timezone: "Asia/Dubai",
    durationMinutes: SESSION_MINUTES,
    days: buildDays(taken),
  });
});

app.get("/api/bookings/:id", async (req, res) => {
  const id = cleanText(req.params.id, 12).toUpperCase();
  if (!/^SY-[A-Z0-9]{4}$/.test(id)) {
    return res.status(404).json({ error: "We couldn’t find that booking." });
  }
  const bookings = await readBookings();
  const booking = bookings.find((item) => item.id === id);
  if (!booking) return res.status(404).json({ error: "We couldn’t find that booking." });
  res.json({
    booking: {
      id: booking.id,
      name: booking.name,
      phone: booking.phone,
      age: booking.age,
      area: booking.area,
      start: booking.start,
      slotLabel: booking.slotLabel,
      durationMinutes: booking.durationMinutes,
    },
  });
});

app.post("/api/bookings", async (req, res) => {
  const body = req.body || {};
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
    return res.status(400).json({ error: "Please add your name and a valid WhatsApp number." });
  }
  if (!consent) {
    return res.status(400).json({ error: "Please agree to be contacted about your free session." });
  }
  if (!AGES.includes(age) || !AREAS.includes(area) || !STARTS.includes(start)) {
    return res.status(400).json({ error: "Please check the age, area, and start time." });
  }
  if (pathId && !PATHS.includes(pathId)) {
    return res.status(400).json({ error: "Please start the questions again." });
  }

  const picks = Array.isArray(body.picks) ? body.picks.slice(0, 5) : [];
  const answers = picks.map((pick) => ({
    question: cleanText(pick.question, 180),
    answer: cleanText(pick.answer, 120),
  }));

  try {
    const booking = await withBookings(async (bookings) => {
      const taken = new Set(bookings.map((item) => item.slotId));
      const slot = slotMap(taken).get(slotId);
      if (!slot || !slot.available) {
        const error = new Error("That time was just taken. Please pick another.");
        error.status = 409;
        throw error;
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
        slotId,
        slotLabel: slot.slotLabel,
        durationMinutes: SESSION_MINUTES,
      };
      bookings.push(record);
      return record;
    });
    res.status(201).json({ booking });
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({
      error: status === 500 ? "We couldn’t save that booking. Please try again." : error.message,
    });
  }
});

if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.use((req, res, next) => {
    if (req.method !== "GET" || req.path.startsWith("/api")) return next();
    res.sendFile(path.join(distDir, "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`Senyara API listening on http://localhost:${PORT}`);
});
