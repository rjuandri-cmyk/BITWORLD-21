(function () {
  var TS_SITEKEY = `0x4AAAAAAFjzAz_TOIjrcnA5`.trim();
  if (!TS_SITEKEY) return;

  var g = function (id) { return document.getElementById(id); };
  var T = function (a, b) { return window.lang === "en" ? b : a; };
  var tsToken = "", tsWidget = null, capFail = false;
  var PATHS = ["/api/login", "/api/register", "/api/forgot"];

  function resetWidget() {
    tsToken = "";
    try { if (window.turnstile && tsWidget !== null) window.turnstile.reset(tsWidget); } catch (e) {}
  }

  var _fetch = window.fetch;
  window.fetch = function (url, opts) {
    try {
      var u = typeof url === "string" ? url : (url && url.url) || "";
      if (opts && opts.method === "POST" && opts.body && PATHS.indexOf(u.split("?")[0]) > -1) {
        var body = JSON.parse(opts.body);
        body.turnstile = tsToken;
        var o2 = Object.assign({}, opts, { body: JSON.stringify(body) });
        return _fetch.call(window, url, o2).then(function (r) {
          return r.clone().json().then(function (d) {
            if (d && d.error === "captcha") capFail = true;
            resetWidget();
            return r;
          }).catch(function () { resetWidget(); return r; });
        });
      }
    } catch (e) {}
    return _fetch.apply(window, arguments);
  };

  function mount() {
    var form = g("aForm"), fb = g("fBtn");
    if (!form || !fb || g("tsBox") || !window.turnstile) return;
    var box = document.createElement("div");
    box.id = "tsBox";
    box.style.cssText = "margin-top:14px;min-height:65px";
    fb.parentNode.insertBefore(box, fb);
    tsToken = "";
    tsWidget = window.turnstile.render(box, {
      sitekey: TS_SITEKEY, theme: "dark", size: "flexible",
      callback: function (t) { tsToken = t; },
      "expired-callback": function () { tsToken = ""; },
      "error-callback": function () { tsToken = ""; }
    });
  }

  var s = document.createElement("script");
  s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
  s.async = true; s.defer = true; s.onload = mount;
  document.head.appendChild(s);

  var ab = g("authBody");
  if (ab) new MutationObserver(mount).observe(ab, { childList: true, subtree: true });

  new MutationObserver(function (list) {
    if (!capFail) return;
    var m = g("fmsg");
    var hit = list.some(function (x) {
      return x.target === m || (x.target.parentNode && x.target.parentNode === m);
    });
    if (!hit || !m.classList.contains("err")) return;
    capFail = false;
    m.textContent = T("Selesaikan verifikasi \"Saya manusia\" dulu, lalu coba lagi.", "Please complete the human verification, then try again.");
  }).observe(document.body, { childList: true, attributes: true, characterData: true, subtree: true });
})();
