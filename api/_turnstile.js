const { send, getIp } = require("./_lib");

// Cek token Cloudflare Turnstile. Mengembalikan true jika lolos.
async function checkTurnstile(req, res) {
  const secret = process.env.TURNSTILE_SECRET;
  if (!secret) return true; // belum dipasang: tidak memblokir
  const token = String((req.body || {}).turnstile || "");
  if (!token) { send(res, 400, { error: "captcha" }); return false; }
  try {
    const r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token, remoteip: getIp(req) })
    });
    const d = await r.json();
    if (d && d.success) return true;
  } catch (e) { console.error(e); }
  send(res, 400, { error: "captcha" });
  return false;
}

module.exports = { checkTurnstile };
