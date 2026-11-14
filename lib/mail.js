import nodemailer from "nodemailer";
import { PATHS } from "./content.js";

const OFFICE = "learn@senyaralearning.com";

const esc = (value) =>
  String(value ?? "")
    .replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);

function pathLabel(id) {
  return PATHS.find((item) => item.id === id)?.title.replace(/[“”"]/g, "") || "Not chosen";
}

function rows(pairs) {
  return pairs
    .map(
      ([label, value]) =>
        `<tr><td style="padding:7px 16px 7px 0;color:#4a4a4a;vertical-align:top">${esc(label)}</td><td style="padding:7px 0">${esc(value || "—")}</td></tr>`,
    )
    .join("");
}

export async function notifyOffice(booking) {
  const user = process.env.SMTP_USER || OFFICE;
  const pass = process.env.SMTP_PASS;
  if (!pass) {
    console.warn("Booking saved without email. Set SMTP_PASS for learn@senyaralearning.com.");
    return { ok: false, code: "not_configured" };
  }

  const host = process.env.SMTP_HOST || "smtp.office365.com";
  const port = Number(process.env.SMTP_PORT || 587);
  const to = process.env.SMTP_TO || OFFICE;
  const answers = Array.isArray(booking.answers) ? booking.answers : [];
  const answerText = answers.length
    ? answers.map((item) => `${item.question} — ${item.answer}`).join("\n")
    : booking.skipped
      ? "The parent skipped the questions."
      : "No answers were recorded.";

  const html = `
<div style="font-family:Georgia,Helvetica,sans-serif;color:#1a1a1a;max-width:640px;margin:0 auto;line-height:1.5;background:#faf8f4">
  <div style="height:4px;background:#113b24"></div>
  <div style="padding:24px 28px 32px">
    <p style="margin:0 0 6px;font-size:13px;letter-spacing:0.04em;text-transform:uppercase;color:#1b5e35">Senyara Learning</p>
    <p style="margin:0 0 8px;font-size:22px">New clarity session</p>
    <p style="margin:0 0 18px">${esc(booking.name)} booked a free online clarity session. Reference ${esc(booking.id)}.</p>
    <p style="margin:0 0 8px;font-weight:700">Session</p>
    <table style="border-collapse:collapse;width:100%;margin:0 0 18px">
      ${rows([
        ["Reference", booking.id],
        ["When", `${booking.slotLabel} · ${booking.durationMinutes} minutes`],
        ["Wants to start", booking.start],
      ])}
    </table>
    <p style="margin:0 0 8px;font-weight:700">Parent</p>
    <table style="border-collapse:collapse;width:100%;margin:0 0 18px">
      ${rows([
        ["Name", booking.name],
        ["WhatsApp", booking.phone],
        ["Child’s age", booking.age],
        ["Area", booking.area],
        ["Where they started", pathLabel(booking.path)],
      ])}
    </table>
    <p style="margin:0 0 8px;font-weight:700">What they told us</p>
    <p style="margin:0 0 12px">${esc(booking.summary || "No summary yet.")}</p>
    <p style="margin:0;white-space:pre-line">${esc(answerText)}</p>
  </div>
</div>`;

  const text = [
    `New clarity session ${booking.id}`,
    "",
    `${booking.name} booked a free online clarity session.`,
    `When: ${booking.slotLabel} · ${booking.durationMinutes} minutes`,
    `Wants to start: ${booking.start}`,
    "",
    `WhatsApp: ${booking.phone}`,
    `Child’s age: ${booking.age}`,
    `Area: ${booking.area}`,
    `Where they started: ${pathLabel(booking.path)}`,
    "",
    booking.summary || "No summary yet.",
    "",
    answerText,
  ].join("\n");

  try {
    const transport = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      requireTLS: port === 587,
      auth: { user, pass },
      tls: { minVersion: "TLSv1.2" },
    });
    const info = await transport.sendMail({
      from: `Senyara Learning <${user}>`,
      to,
      subject: `New clarity session ${booking.id}: ${booking.name}`,
      html,
      text,
    });
    console.info("Booking email accepted", booking.id, info.messageId);
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Email failed";
    console.error("Booking email failed", booking.id, message);
    return { ok: false, code: "smtp_failed" };
  }
}
