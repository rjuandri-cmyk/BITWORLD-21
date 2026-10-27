const { neon } = require("@neondatabase/serverless");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const sql = neon(process.env.DATABASE_URL);
const MAXAGE = 60 * 60 * 24 * 30; // sesi login 30 hari
const RATE = 0.004; // poin per jam
const HOURS = 24;   // lama 1 sesi mining (jam)
const SITE_URL = (process.env.SITE_URL || "https://bitworld-web3-phi.vercel.app").trim().replace(/\/$/, "");

function secret() {
  if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET belum diisi di Vercel");
  return process.env.JWT_SECRET;
}
function send(res, status, data) {
  res.setHeader("Cache-Control", "no-store");
  res.status(status).json(data);
}
function setSession(res, uid) {
  const t = jwt.sign({ uid: String(uid) }, secret(), { expiresIn: MAXAGE });
  res.setHeader("Set-Cookie", `session=${t}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${MAXAGE}`);
}
function clearSession(res) {
  res.setHeader("Set-Cookie", "session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0");
}
function getUid(req) {
  const m = (req.headers.cookie || "").match(/(?:^|; )session=([^;]+)/);
  if (!m) return null;
  try { return jwt.verify(m[1], secret()).uid; } catch (e) { return null; }
}
// Hanya terima POST berformat JSON (membantu mencegah CSRF)
function jsonOnly(req, res) {
  if (req.method !== "POST") { send(res, 405, { error: "method" }); return false; }
  if (!(req.headers["content-type"] || "").includes("application/json")) { send(res, 415, { error: "invalid_input" }); return false; }
  return true;
}
function getIp(req) {
  return (String(req.headers["x-forwarded-for"] || "").split(",")[0] || "").trim() || "unknown";
}

// Pembatasan: maksimal `max` percobaan per `minutes` menit untuk satu key
async function limit(key, max, minutes) {
  const r = await sql`select count(*)::int as n from bw_auth_attempts
                      where key = ${key} and created_at > now() - make_interval(mins => ${minutes})`;
  if (r[0].n >= max) return false;
  await sql`insert into bw_auth_attempts (key) values (${key})`;
  if (Math.random() < 0.02) await sql`delete from bw_auth_attempts where created_at < now() - interval '1 day'`;
  return true;
}

// Token sekali pakai (disimpan sebagai hash SHA-256)
const sha = (t) => crypto.createHash("sha256").update(String(t)).digest("hex");
async function issueToken(userId, type, hours) {
  const token = crypto.randomBytes(32).toString("hex");
  await sql`update bw_tokens set used_at = now() where user_id = ${userId} and type = ${type} and used_at is null`;
  await sql`insert into bw_tokens (user_id, type, token_hash, expires_at)
            values (${userId}, ${type}, ${sha(token)}, now() + make_interval(hours => ${hours}))`;
  return token;
}
// Atomik: token hanya bisa dipakai sekali
async function consumeToken(token, type) {
  const rows = await sql`update bw_tokens set used_at = now()
                         where token_hash = ${sha(token)} and type = ${type} and used_at is null and expires_at > now()
                         returning user_id`;
  return rows.length ? rows[0].user_id : null;
}

// ---------- Kirim email: Brevo (jika BREVO_API_KEY ada), selain itu Resend ----------
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// MAIL_FROM boleh "Nama <email@domain.com>" atau cukup "email@domain.com"
function parseFrom(raw) {
  const s = String(raw || "").trim().replace(/^["']+|["']+$/g, "");
  const m = s.match(/^(.*)<\s*([^<>\s]+@[^<>\s]+)\s*>$/);
  if (m) return { name: m[1].trim().replace(/["']/g, "") || "Bitworld", email: m[2].trim() };
  if (/^[^<>\s]+@[^<>\s]+$/.test(s)) return { name: "Bitworld", email: s };
  return null;
}

async function sendMail(to, subject, html) {
  const brevoKey = String(process.env.BREVO_API_KEY || "").trim();
  console.log("mail provider:", brevoKey ? "brevo" : "resend");

  if (brevoKey) {
    const sender = parseFrom(process.env.MAIL_FROM);
    if (!sender) throw new Error("MAIL_FROM tidak valid. Contoh: Bitworld <email@domain.com> atau email@domain.com");
    const br = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": brevoKey, "Content-Type": "application/json", accept: "application/json" },
      body: JSON.stringify({ sender, to: [{ email: to }], subject, htmlContent: html })
    });
    const body = await br.text();
    if (!br.ok) throw new Error("Brevo gagal: " + br.status + " " + body);
    console.log("brevo terkirim:", br.status);
    return;
  }

  const key = String(process.env.RESEND_API_KEY || "").trim();
  const from = String(process.env.MAIL_FROM || "").trim();
  if (!key || !from) throw new Error("BREVO_API_KEY tidak terbaca, dan RESEND_API_KEY / MAIL_FROM belum diisi di Vercel");
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: "Bearer " + key, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to, subject, html })
  });
  if (!r.ok) throw new Error("Resend gagal: " + r.status + " " + (await r.text()));
}
function mailHtml(name, text, link, label) {
  return `<div style="font-family:system-ui,Arial,sans-serif;max-width:480px;margin:auto;padding:20px">
  <h2 style="color:#b7791f">Bitworld (BTW)</h2>
  <p>Halo ${esc(name || "")},</p><p>${text}</p>
  <p style="margin:24px 0"><a href="${link}" style="background:#f5b82e;color:#1a1400;padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:700">${label}</a></p>
  <p style="font-size:12px;color:#666">Jika tombol tidak berfungsi, salin link ini ke browser:<br>${link}</p>
  <p style="font-size:12px;color:#666">Jika Anda tidak merasa melakukan ini, abaikan email ini.</p></div>`;
}
async function sendVerifyMail(user) {
  const t = await issueToken(user.id, "verify", 24);
  await sendMail(user.email, "Verifikasi email Bitworld",
    mailHtml(user.name, "Klik tombol di bawah untuk memverifikasi email Anda (berlaku 24 jam).", `${SITE_URL}/?verify=${t}`, "Verifikasi Email"));
}
async function sendResetMail(user) {
  const t = await issueToken(user.id, "reset", 1);
  await sendMail(user.email, "Reset password Bitworld",
    mailHtml(user.name, "Klik tombol di bawah untuk membuat password baru (berlaku 1 jam).", `${SITE_URL}/?reset=${t}`, "Buat Password Baru"));
}

// Masukkan poin sesi mining yang sudah selesai ke saldo (atomik, tidak bisa ganda).
// Dipakai oleh api/app.js sebelum membaca saldo/dompet.
async function settle(uid) {
  const rows = await sql`
    with old as (select id, mine_start from bw_users where id = ${uid} for update)
    update bw_users u set balance = u.balance + ${RATE}::numeric * ${HOURS}::numeric, mine_start = null
    from old
    where u.id = old.id and old.mine_start is not null
      and now() >= old.mine_start + make_interval(hours => ${HOURS}::int)
    returning u.id`;
  if (rows.length) await sql`insert into bw_mining_log (user_id, amount) values (${uid}, ${RATE * HOURS})`;
}

module.exports = { RATE, HOURS, sql, send, setSession, clearSession, getUid, jsonOnly, getIp, limit, settle, consumeToken, sendVerifyMail, sendResetMail };
