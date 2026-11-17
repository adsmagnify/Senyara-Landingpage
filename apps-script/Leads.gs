/**
 * Senyara Learning — lead tracker
 *
 * 1. Open the Google Sheet, then Extensions → Apps Script.
 * 2. Replace the default code with this file and save.
 * 3. Change SECRET below to a long private string. Use the same value as SHEETS_SECRET on the site.
 * 4. Deploy → New deployment → Web app.
 *    Execute as: Me
 *    Who has access: Anyone
 * 5. Copy the web app URL into SHEETS_WEBHOOK_URL.
 *    Each new deployment gets a new URL. Use Manage deployments → Edit → New version when you change this script.
 */

const SECRET = "replace-with-a-long-random-string";

const HEADERS = [
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

const WIDTHS = [22, 14, 18, 22, 20, 12, 16, 24, 42, 18, 22, 46, 42, 55, 28, 12, 28];

function doPost(e) {
  return handle_(function () {
    const body = JSON.parse((e.postData && e.postData.contents) || "{}");
    if (!authorized_(body.secret)) return { ok: false, error: "unauthorized" };
    if (!Array.isArray(body.lead) || !body.lead[1]) return { ok: false, error: "missing_lead" };

    const lock = LockService.getScriptLock();
    lock.waitLock(20000);
    try {
      const sheet = ensureSheet_();
      const reference = String(body.lead[1]);
      if (findRow_(sheet, reference)) return { ok: true, added: 0 };
      appendLead_(sheet, body.lead);
      return { ok: true, added: 1, reference: reference };
    } finally {
      lock.releaseLock();
    }
  });
}

function doGet(e) {
  return handle_(function () {
    const params = (e && e.parameter) || {};
    if (!authorized_(params.secret)) return { ok: false, error: "unauthorized" };
    if (!params.reference) return { ok: true, ready: true };

    const sheet = ensureSheet_();
    const row = findRow_(sheet, String(params.reference));
    if (!row) return { ok: true, lead: null };
    const values = sheet.getRange(row, 1, 1, HEADERS.length).getDisplayValues()[0];
    return {
      ok: true,
      lead: {
        id: values[1] || "",
        name: values[3] || "",
        phone: values[4] || "",
        age: values[5] || "",
        area: values[6] || "",
        start: values[7] || "",
        slotLabel: values[14] || "",
        durationMinutes: Number(values[15]) || 30,
      },
    };
  });
}

function handle_(work) {
  try {
    return json_(work());
  } catch (error) {
    return json_({ ok: false, error: String(error && error.message ? error.message : error) });
  }
}

function json_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}

function authorized_(secret) {
  const stored = PropertiesService.getScriptProperties().getProperty("SHEETS_SECRET");
  const expected = stored || SECRET;
  return Boolean(secret) && secret === expected && expected !== "replace-with-a-long-random-string";
}

function ensureSheet_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName("Leads") || spreadsheet.insertSheet("Leads");
  const header = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
  const ready = HEADERS.every(function (label, index) {
    return String(header[index] || "") === label;
  });
  if (!ready) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.getRange(1, 1, 1, HEADERS.length)
      .setFontWeight("bold")
      .setFontColor("#ffffff")
      .setBackground("#113B24")
      .setVerticalAlignment("middle")
      .setWrap(true);
    sheet.setRowHeight(1, 28);
    sheet.setFrozenRows(1);
    WIDTHS.forEach(function (width, index) {
      sheet.setColumnWidth(index + 1, width * 8);
    });
    const status = sheet.getRange("C2:C5000");
    const rule = SpreadsheetApp.newDataValidation()
      .requireValueInList(["New", "Contacted", "Confirmed", "Completed", "Not proceeding"], true)
      .setAllowInvalid(false)
      .build();
    status.setDataValidation(rule);
  }
  return sheet;
}

function findRow_(sheet, reference) {
  const last = sheet.getLastRow();
  if (last < 2) return 0;
  const values = sheet.getRange(2, 2, last - 1, 1).getDisplayValues();
  for (let index = 0; index < values.length; index += 1) {
    if (String(values[index][0]) === reference) return index + 2;
  }
  return 0;
}

function appendLead_(sheet, lead) {
  const row = Math.max(sheet.getLastRow(), 1) + 1;
  const values = HEADERS.map(function (_, index) {
    return lead[index] == null ? "" : lead[index];
  });
  sheet.getRange(row, 1, 1, HEADERS.length).setValues([values]).setVerticalAlignment("top").setWrap(true);

  const phone = String(values[4] || "");
  const digits = phone.replace(/\D/g, "");
  if (digits) {
    const safe = phone.replace(/"/g, "");
    sheet.getRange(row, 5).setFormula('=HYPERLINK("https://wa.me/' + digits + '","' + safe + '")');
  }
  if (!String(sheet.getRange(row, 3).getValue() || "").trim()) {
    sheet.getRange(row, 3).setValue("New");
  }
}
