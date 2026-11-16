import fs from "fs";
import path from "path";
import { LEAD_HEADERS, leadValues } from "./leadsSheet.js";

const dataDir = path.join(process.cwd(), "data");
const tokenFile = path.join(dataDir, "excel-token.json");
const graphRoot = "https://graph.microsoft.com/v1.0";
const fileGuid = "3b2dec56-574a-4ab3-a623-2a0377115e95";
let memoryToken = null;

function readOnlyFs(error) {
  return ["EROFS", "EPERM", "EACCES", "ENOTSUP"].includes(error?.code);
}

function configured() {
  return Boolean(process.env.MS_CLIENT_ID && process.env.MS_TENANT_ID);
}

async function readToken() {
  if (memoryToken?.refresh_token) return memoryToken;
  try {
    const parsed = JSON.parse(await fs.promises.readFile(tokenFile, "utf8"));
    if (parsed.refresh_token) {
      memoryToken = parsed;
      return memoryToken;
    }
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  if (!process.env.MS_REFRESH_TOKEN) return null;
  memoryToken = {
    refresh_token: process.env.MS_REFRESH_TOKEN,
    access_token: "",
    expires_at: 0,
    tenant: process.env.MS_TENANT_ID || "",
  };
  return memoryToken;
}

async function saveToken(token) {
  memoryToken = token;
  try {
    await fs.promises.mkdir(dataDir, { recursive: true });
    await fs.promises.writeFile(tokenFile, JSON.stringify(token));
  } catch (error) {
    if (!readOnlyFs(error)) throw error;
  }
}

async function accessToken() {
  const saved = await readToken();
  if (!saved) return null;
  const clientId = process.env.MS_CLIENT_ID;
  const tenant = process.env.MS_TENANT_ID || saved.tenant;
  if (!clientId || !tenant) return null;
  if (saved.access_token && saved.expires_at > Date.now() + 60_000) return saved.access_token;

  const body = new URLSearchParams({
    client_id: clientId,
    grant_type: "refresh_token",
    refresh_token: saved.refresh_token,
    scope: "https://graph.microsoft.com/Files.ReadWrite offline_access",
  });
  const response = await fetch(`https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error_description || "Excel sign-in expired. Connect the workbook again.");
  }
  await saveToken({
    refresh_token: data.refresh_token || saved.refresh_token,
    access_token: data.access_token,
    expires_at: Date.now() + data.expires_in * 1000,
    tenant,
  });
  return data.access_token;
}

async function graph(token, url, { method = "GET", body, session } = {}) {
  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(session ? { "Workbook-Session-Id": session } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { error: { message: text.slice(0, 240) } };
    }
  }
  if (!response.ok) {
    const message = data?.error?.message || response.statusText;
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }
  return data;
}

const workbookNames = ["SenyaraLearningLeads.xlsx", "Book.xlsx"];

async function findWorkbook(token) {
  if (process.env.EXCEL_ITEM_ID) return process.env.EXCEL_ITEM_ID;
  const names = [...new Set([process.env.EXCEL_FILE, ...workbookNames].filter(Boolean))];
  for (const fileName of names) {
    try {
      const direct = await graph(token, `${graphRoot}/me/drive/root:/${encodeURIComponent(fileName)}`);
      if (direct?.id) return direct.id;
    } catch (error) {
      if (error.status !== 404) throw error;
    }
  }

  const found = [];
  for (const fileName of names) {
    const stem = fileName.replace(/\.xlsx$/i, "");
    const result = await graph(token, `${graphRoot}/me/drive/root/search(q='${stem}')?$select=id,name,webUrl`);
    found.push(...(result.value || []));
  }
  const items = found.filter((item) => names.some((name) => item.name?.toLowerCase() === name.toLowerCase()));
  const match =
    items.find((item) => String(item.webUrl || "").toLowerCase().includes(fileGuid)) ||
    items.find((item) => item.name?.toLowerCase() === "senyaralearningleads.xlsx") ||
    items[0];
  if (!match) throw new Error("Couldn’t find SenyaraLearningLeads.xlsx in the learn@ OneDrive.");
  return match.id;
}

async function leadSheetName(token, item, session) {
  const base = `${graphRoot}/me/drive/items/${item}/workbook`;
  const sheets = await graph(token, `${base}/worksheets?$select=name,position`, { session });
  const list = [...(sheets.value || [])].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  for (const sheet of list) {
    const cell = await graph(
      token,
      `${base}/worksheets/${encodeURIComponent(sheet.name)}/range(address='A1')`,
      { session },
    );
    if (String(cell?.values?.[0]?.[0] || "") === LEAD_HEADERS[0]) return sheet.name;
  }
  return (
    list.find((sheet) => sheet.name === "Leads")?.name ||
    list.find((sheet) => sheet.name === "Sheet1")?.name ||
    list[0]?.name ||
    "Sheet1"
  );
}

async function ensureTable(token, item, session) {
  const base = `${graphRoot}/me/drive/items/${item}/workbook`;
  const tables = await graph(token, `${base}/tables`, { session });
  const existing = (tables.value || []).find((table) => table.name === "Leads");
  if (existing) return;

  const sheet = await leadSheetName(token, item, session);
  const last = columnName(LEAD_HEADERS.length);
  await graph(token, `${base}/worksheets/${sheet}/range(address='A1:${last}1')`, {
    method: "PATCH",
    session,
    body: { values: [LEAD_HEADERS] },
  });
  const created = await graph(token, `${base}/tables/add`, {
    method: "POST",
    session,
    body: { address: `${sheet}!A1:${last}1`, hasHeaders: true },
  });
  await graph(token, `${base}/tables/${created.id}`, {
    method: "PATCH",
    session,
    body: { name: "Leads", style: "TableStyleMedium7" },
  });
  await graph(token, `${base}/worksheets/${sheet}/range(address='A1:${last}1')/format`, {
    method: "PATCH",
    session,
    body: { fill: { color: "#113B24" }, font: { bold: true, color: "#FFFFFF" } },
  }).catch(() => undefined);
}

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

async function existingReferences(token, item, session) {
  const base = `${graphRoot}/me/drive/items/${item}/workbook`;
  const rows = await graph(token, `${base}/tables/Leads/rows`, { session });
  const refs = new Set();
  (rows.value || []).forEach((row) => {
    const reference = row.values?.[0]?.[1];
    if (reference) refs.add(String(reference));
  });
  return refs;
}

export async function connectWithDeviceCode(onCode) {
  const clientId = process.env.MS_CLIENT_ID;
  const tenant = process.env.MS_TENANT_ID || "organizations";
  if (!clientId) throw new Error("Set MS_CLIENT_ID and MS_TENANT_ID in .env.local.");

  const started = await fetch(`https://login.microsoftonline.com/${tenant}/oauth2/v2.0/devicecode`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      scope: "https://graph.microsoft.com/Files.ReadWrite https://graph.microsoft.com/User.Read offline_access",
    }),
  });
  const codes = await started.json();
  if (!started.ok) throw new Error(codes.error_description || "Couldn’t start the Excel sign-in.");
  onCode({ userCode: codes.user_code, url: codes.verification_uri, message: codes.message });

  const waitMs = Math.max(5, codes.interval || 5) * 1000;
  const deadline = Date.now() + codes.expires_in * 1000;
  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, waitMs));
    const response = await fetch(`https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:device_code",
        client_id: clientId,
        device_code: codes.device_code,
      }),
    });
    const data = await response.json();
    if (response.ok) {
      const signedInTenant = tenantFromAccessToken(data.access_token) || (tenant === "organizations" ? "" : tenant);
      await saveToken({
        refresh_token: data.refresh_token,
        access_token: data.access_token,
        expires_at: Date.now() + data.expires_in * 1000,
        tenant: signedInTenant,
      });
      return { tenant: signedInTenant };
    }
    if (data.error === "authorization_pending" || data.error === "slow_down") continue;
    throw new Error(data.error_description || data.error || "Excel sign-in failed.");
  }
  throw new Error("Excel sign-in timed out.");
}

function tenantFromAccessToken(accessToken) {
  try {
    const payload = JSON.parse(Buffer.from(accessToken.split(".")[1], "base64url").toString("utf8"));
    return payload.tid || "";
  } catch {
    return "";
  }
}

export async function checkExcelConnection() {
  const token = await accessToken();
  if (!token) return { ok: false, code: "not_connected" };
  const item = await findWorkbook(token);
  const info = await graph(token, `${graphRoot}/me/drive/items/${item}?$select=name`);
  const tables = await graph(token, `${graphRoot}/me/drive/items/${item}/workbook/tables?$select=name`);
  const leads = (tables.value || []).find((table) => table.name === "Leads");
  return { ok: Boolean(leads), name: info.name, table: leads?.name || "" };
}

export async function pushLeadsToExcel(bookings) {
  if (!configured()) return { ok: false, code: "not_configured" };
  const token = await accessToken();
  if (!token) return { ok: false, code: "not_connected" };

  const item = await findWorkbook(token);
  const base = `${graphRoot}/me/drive/items/${item}/workbook`;
  const session = await graph(token, `${base}/createSession`, {
    method: "POST",
    body: { persistChanges: true },
  });
  try {
    await ensureTable(token, item, session.id);
    const have = await existingReferences(token, item, session.id);
    const missing = bookings.filter((booking) => booking.id && !have.has(booking.id));
    if (!missing.length) return { ok: true, added: 0 };
    await graph(token, `${base}/tables/Leads/rows/add`, {
      method: "POST",
      session: session.id,
      body: { index: null, values: missing.map((booking) => leadValues(booking).map((value) => value ?? "")) },
    });
    return { ok: true, added: missing.length };
  } finally {
    await graph(token, `${base}/closeSession`, { method: "POST", session: session.id }).catch(() => undefined);
  }
}

export async function findLeadByReference(reference) {
  if (!configured() || !reference) return null;
  const token = await accessToken();
  if (!token) return null;
  const item = await findWorkbook(token);
  const base = `${graphRoot}/me/drive/items/${item}/workbook`;
  const session = await graph(token, `${base}/createSession`, {
    method: "POST",
    body: { persistChanges: false },
  });
  try {
    const rows = await graph(token, `${base}/tables/Leads/rows`, { session: session.id });
    const match = (rows.value || []).find((row) => String(row.values?.[0]?.[1] || "") === reference);
    const values = match?.values?.[0];
    if (!values) return null;
    return {
      id: String(values[1] || ""),
      name: String(values[3] || ""),
      phone: String(values[4] || ""),
      age: String(values[5] || ""),
      area: String(values[6] || ""),
      start: String(values[7] || ""),
      slotLabel: String(values[14] || ""),
      durationMinutes: Number(values[15]) || 30,
    };
  } finally {
    await graph(token, `${base}/closeSession`, { method: "POST", session: session.id }).catch(() => undefined);
  }
}
