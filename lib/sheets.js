import { leadValues } from "./leadRow.js";

function configured() {
  return Boolean(process.env.SHEETS_WEBHOOK_URL && process.env.SHEETS_SECRET);
}

async function readJson(response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error("The spreadsheet did not accept the lead. Check the Apps Script web app URL.");
  }
}

export async function pushLeadToSheet(booking) {
  if (!configured()) return { ok: false, code: "not_configured" };
  const response = await fetch(process.env.SHEETS_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      secret: process.env.SHEETS_SECRET,
      lead: leadValues(booking).map((value) => value ?? ""),
    }),
    redirect: "follow",
  });
  const data = await readJson(response);
  if (!response.ok || data.ok === false) {
    throw new Error(data.error || "The spreadsheet did not accept the lead.");
  }
  return { ok: true, added: data.added || 0 };
}

export async function findLeadByReference(reference) {
  if (!configured() || !reference) return null;
  const url = new URL(process.env.SHEETS_WEBHOOK_URL);
  url.searchParams.set("secret", process.env.SHEETS_SECRET);
  url.searchParams.set("reference", reference);
  const response = await fetch(url, { redirect: "follow" });
  const data = await readJson(response);
  if (!response.ok || data.ok === false || !data.lead) return null;
  return data.lead;
}
