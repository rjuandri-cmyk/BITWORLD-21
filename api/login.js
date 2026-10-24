const bcrypt = require("bcryptjs");
const { sql, send, setSession, jsonOnly, getIp, limit } = require("./_lib");
const { checkTurnstile } = require("./_turnstile");
const DUMMY = "$2a$10$CwTycUXWue0Thq9StjUM0uJ8.0Gv0v1c5l9mH2o5mVY9vOq3O6o5e";

module.exports = async (req, res) => {
  try {
    if (!jsonOnly(req, res)) return;
    if (!(await checkTurnstile(req, res))) return;
    const b = req.body || {};
    const email = String(b.email || "").trim().toLowerCase();
    const pw = String(b.password || "");
    if (!(await limit("login:" + getIp(req) + ":" + email, 10, 15))) return send(res, 429, { error: "rate_limited" });

    const rows = await sql`select id, password_hash, email_verified from bw_users where email = ${email}`;
    const ok = await bcrypt.compare(pw, rows.length ? rows[0].password_hash : DUMMY);
    if (!rows.length || !ok) return send(res, 401, { error: "invalid_credentials" });
    if (!rows[0].email_verified) return send(res, 403, { error: "not_verified" });
    setSession(res, rows[0].id);
    send(res, 200, { ok: true });
  } catch (e) { console.error(e); send(res, 500, { error: "server" }); }
};
