const bcrypt = require("bcryptjs");
const { sql, send, jsonOnly, getIp, limit, sendVerifyMail } = require("./_lib");

module.exports = async (req, res) => {
  try {
    if (!jsonOnly(req, res)) return;
    if (!(await limit("reg:" + getIp(req), 5, 60))) return send(res, 429, { error: "rate_limited" });
    const b = req.body || {};
    const email = String(b.email || "").trim().toLowerCase();
    const name = String(b.name || "").trim().slice(0, 80);
    const pw = String(b.password || "");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200 || !name) return send(res, 400, { error: "invalid_input" });
    if (pw.length < 8 || pw.length > 72) return send(res, 400, { error: "weak_password" });

    const hash = await bcrypt.hash(pw, 10);
    const rows = await sql`insert into bw_users (email, name, password_hash, email_verified)
                           values (${email}, ${name}, ${hash}, false)
                           on conflict (email) do nothing returning id`;
    if (!rows.length) return send(res, 409, { error: "email_taken" });

    let mailSent = true;
    try { await sendVerifyMail({ id: rows[0].id, email, name }); }
    catch (e) {
      // pesan ditulis satu baris (e.message) supaya terbaca penuh di Vercel Logs
      console.error("Gagal kirim email: " + (e && e.message ? e.message : String(e)));
      mailSent = false;
    }
    send(res, 200, { ok: true, mail_sent: mailSent });
  } catch (e) { console.error(e); send(res, 500, { error: "server" }); }
};
