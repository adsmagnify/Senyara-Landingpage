import fs from "fs";
import path from "path";

const root = path.resolve(import.meta.dirname, "..");
const envFile = path.join(root, ".env.local");
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, "utf8").split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!match || process.env[match[1]]) continue;
    process.env[match[1]] = match[2].trim().replace(/^["']|["']$/g, "");
  }
}

const { connectWithDeviceCode, checkExcelConnection } = await import("../lib/excelOnline.js");

await connectWithDeviceCode((prompt) => {
  console.log(prompt.message);
});
const check = await checkExcelConnection();
console.log(JSON.stringify({ ok: check.ok, name: check.name, table: check.table }));
