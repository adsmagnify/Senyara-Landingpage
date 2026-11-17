import { PATHS, RESULTS } from "./content.js";

export const LEAD_HEADERS = [
  "Submitted (GST)",
  "Reference",
  "Status",
  "Parent",
  "WhatsApp",
  "Child age",
  "Area",
  "Wants to start",
  "Started from",
  "Skipped questions",
  "Profile",
  "Summary",
  "What stood out",
  "Answers",
  "Session",
  "Minutes",
  "Notes",
];

function gst(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Dubai",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
}

function pathLabel(id) {
  const title = PATHS.find((item) => item.id === id)?.title || "Not chosen";
  return title.replace(/[“”"]/g, "");
}

function answerText(booking) {
  const answers = Array.isArray(booking.answers) ? booking.answers : [];
  if (answers.length) return answers.map((item) => `${item.question} — ${item.answer}`).join("\n");
  return booking.skipped ? "The parent skipped the questions." : "No answers were recorded.";
}

export function leadValues(booking) {
  const stoodOut = Array.isArray(booking.mirror) ? booking.mirror.filter(Boolean).join("\n") : "";
  return [
    gst(booking.createdAt),
    booking.id,
    "New",
    booking.name,
    booking.phone,
    booking.age,
    booking.area,
    booking.start,
    pathLabel(booking.path),
    booking.skipped ? "Yes" : "No",
    RESULTS[booking.resultKey]?.name || "",
    booking.summary || "",
    stoodOut,
    answerText(booking),
    booking.slotLabel || "",
    booking.durationMinutes || "",
    "",
  ];
}
