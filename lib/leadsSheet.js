import fs from "fs";
import path from "path";
import ExcelJS from "exceljs";
import { PATHS, RESULTS } from "./content.js";

const dataDir = path.join(process.cwd(), "data");
export const leadsFile = path.join(dataDir, "Senyara-leads.xlsx");

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

const STATUS_COL = 3;
const PHONE_COL = 5;
const NOTES_COL = 17;
const WIDTHS = [22, 14, 18, 22, 20, 12, 16, 24, 42, 18, 22, 46, 42, 55, 28, 12, 28];

function columnName(index) {
  let name = "";
  let n = index;
  while (n > 0) {
    const rem = (n - 1) % 26;
    name = String.fromCharCode(65 + rem) + name;
    n = Math.floor((n - 1) / 26);
  }
  return name;
}

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

function styleHeader(sheet) {
  const header = sheet.getRow(1);
  LEAD_HEADERS.forEach((label, index) => {
    header.getCell(index + 1).value = label;
  });
  header.font = { bold: true, color: { argb: "FFFFFFFF" }, name: "Calibri", size: 11 };
  header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF113B24" } };
  header.alignment = { vertical: "middle", wrapText: true };
  header.height = 24;
  WIDTHS.forEach((width, index) => {
    sheet.getColumn(index + 1).width = width;
  });
  sheet.views = [{ state: "frozen", ySplit: 1 }];
  sheet.autoFilter = `A1:${columnName(LEAD_HEADERS.length)}1`;
  sheet.dataValidations.add("C2:C5000", {
    type: "list",
    allowBlank: true,
    formulae: ['"New,Contacted,Confirmed,Completed,Not proceeding"'],
    showErrorMessage: true,
    errorTitle: "Status",
    error: "Choose New, Contacted, Confirmed, Completed, or Not proceeding.",
  });
}

function writeLead(row, booking, isNew) {
  const values = leadValues(booking);
  values.forEach((value, index) => {
    const column = index + 1;
    if (!isNew && (column === STATUS_COL || column === NOTES_COL)) return;
    row.getCell(column).value = value;
  });
  if (!String(row.getCell(STATUS_COL).value || "").trim()) row.getCell(STATUS_COL).value = "New";

  const digits = String(booking.phone || "").replace(/\D/g, "");
  const phone = row.getCell(PHONE_COL);
  if (digits) {
    phone.value = { text: String(booking.phone), hyperlink: `https://wa.me/${digits}` };
    phone.font = { color: { argb: "FF1155CC" }, underline: true, name: "Calibri", size: 11 };
  }
  row.alignment = { vertical: "top", wrapText: true };
  [12, 13, 14].forEach((column) => {
    row.getCell(column).alignment = { vertical: "top", wrapText: true };
  });
}

export async function syncLeadSheet(bookings) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Senyara Learning";
  try {
    await fs.promises.access(leadsFile);
    await workbook.xlsx.readFile(leadsFile);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  const sheet = workbook.getWorksheet("Leads") || workbook.addWorksheet("Leads");
  styleHeader(sheet);

  const existing = new Map();
  sheet.eachRow((row, number) => {
    if (number === 1) return;
    const reference = String(row.getCell(2).value || "").trim();
    if (reference) existing.set(reference, row);
  });

  bookings.forEach((booking) => {
    const row = existing.get(booking.id);
    if (row) {
      writeLead(row, booking, false);
      return;
    }
    writeLead(sheet.addRow([]), booking, true);
  });

  await fs.promises.mkdir(dataDir, { recursive: true });
  try {
    await workbook.xlsx.writeFile(leadsFile);
  } catch (error) {
    if (error.code === "EBUSY" || error.code === "EPERM") {
      throw new Error("Close Senyara-leads.xlsx in Excel so the new lead can be added.");
    }
    throw error;
  }
}
