(function () {
  var g = function (id) { return document.getElementById(id); };
  var T = function (a, b) { return window.lang === "en" ? b : a; };
  var me = null;
  var editing = false;
  var f6 = function (n) { return Number(n || 0).toLocaleString("id-ID", { minimumFractionDigits: 6, maximumFractionDigits: 6 }); };

  /* saldo langsung = saldo + poin sesi yang sedang berjalan */
  function liveBalance() {
    if (!me) return 0;
    var RATE = me.rate || 0.004, DUR = (me.session_hours || 24) * 3600000;
    var skew = me.server_now ? new Date(me.server_now).getTime() - Date.now() : 0;
    var start = me.mine_start ? new Date(me.mine_start).getTime() : 0;
    var elapsed = start ? Math.max(0, Math.min(Date.now() + skew - start, DUR)) : 0;
    return Number(me.balance || 0) + RATE * (elapsed / 3600000);
  }

  /* ===== Gaya ===== */
  var st = document.createElement("style");
  st.textContent =
    'html nav.bottom{display:grid!important;grid-template-columns:repeat(5,1fr);gap:6px;padding:8px 10px!important;overflow:visible!important;position:relative;z-index:40}' +
    'html nav.bottom button{padding:10px 2px!important;min-height:40px;font-size:12.5px!important;font-weight:600;white-space:nowrap;line-height:1.1;text-align:center;color:var(--muted)!important;background:var(--card)!important;border:1px solid var(--line)!important;border-radius:10px!important;box-shadow:none!important;margin:0!important}' +
    'html nav.bottom button.on{color:var(--accent)!important;background:rgba(240,185,11,.12)!important;border-color:rgba(240,185,11,.55)!important}' +
    'html nav.bottom button.locked{color:#586177!important}' +
    '#navDrawer{display:none;position:absolute;top:calc(100% + 6px);left:10px;right:10px;z-index:60;grid-template-columns:repeat(3,1fr);gap:8px;padding:10px;background:#0f1520;border:1px solid var(--line);border-radius:14px;box-shadow:0 14px 34px rgba(0,0,0,.6)}' +
    '#navDrawer.open{display:grid}' +
    '#navDrawer button{padding:12px 4px!important;font-size:12.5px!important;white-space:normal!important}' +
    '.pbadge{display:inline-block;margin:12px 0 0;padding:7px 14px;border-radius:999px;background:rgba(34,197,94,.18);color:#86efac;font-size:13px;font-weight:700}' +
    '.fm input[readonly]{opacity:.65}' +
    '#v-mine2{background:#f4f5fb;color:#1b1d3a;justify-content:flex-start}' +
    '.mn-wrap{width:100%;max-width:520px;margin:0 auto;text-align:center;padding-bottom:28px}' +
    '.mn-orb{width:164px;height:164px;border-radius:50%;margin:10px auto 14px;position:relative;display:flex;align-items:center;justify-content:center;background:radial-gradient(circle at 35% 28%,#fff 0%,#eceefc 48%,#c7cbf5 100%);box-shadow:0 18px 38px rgba(107,95,240,.28),inset -10px -14px 26px rgba(107,95,240,.18)}' +
    '.mn-orb::before{content:"";position:absolute;inset:-9px;border-radius:50%;border:2px dashed rgba(107,95,240,.5);animation:mnspin 18s linear infinite}' +
    '.mn-orb::after{content:"";position:absolute;inset:0;border-radius:50%;box-shadow:0 0 0 0 rgba(107,95,240,.35)}' +
    '.mn-orb.run::after{animation:mnpulse 2.2s ease-out infinite}' +
    '.mn-coin{width:70px;height:70px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:17px;letter-spacing:.5px;color:#5a4300;background:linear-gradient(135deg,#fff0a8,#e9b50c);box-shadow:0 6px 14px rgba(160,110,0,.35),inset 0 2px 4px rgba(255,255,255,.7)}' +
    '@keyframes mnspin{to{transform:rotate(360deg)}}' +
    '@keyframes mnpulse{0%{box-shadow:0 0 0 0 rgba(107,95,240,.4)}100%{box-shadow:0 0 0 28px rgba(107,95,240,0)}}' +
    '.mn-bal{display:flex;align-items:center;justify-content:center;gap:10px;font-size:42px;font-weight:800;color:#d9a400;letter-spacing:-1px;font-variant-numeric:tabular-nums;margin-bottom:18px}' +
    '.mn-dot{width:30px;height:30px;border-radius:50%;background:linear-gradient(135deg,#fff0a8,#e9b50c);flex-shrink:0}' +
    '.mn-card{background:#fff;border-radius:22px;padding:14px 18px;margin-bottom:12px;box-shadow:0 6px 20px rgba(60,60,140,.08)}' +
    '.mn-row{display:flex;align-items:center;justify-content:space-between;padding:9px 0;font-size:15px;color:#3d4163;text-align:left}' +
    '.mn-row b{color:#12142e;font-weight:700}' +
    '.mn-row em{font-style:normal;font-weight:700;color:#5b52e8;background:#ecebff;padding:6px 14px;border-radius:999px;font-size:14px}' +
    '.mn-tiles{display:grid;grid-template-columns:1fr 1fr;gap:12px}' +
    '.mn-tile{margin-bottom:12px;text-align:left;padding:16px 16px}' +
    '.mn-tile small{display:block;color:#8a8fb0;font-size:13px;margin-bottom:8px}' +
    '.mn-tile b{font-size:19px;color:#12142e;font-weight:800;font-variant-numeric:tabular-nums}' +
    '.mn-prog{height:8px;border-radius:99px;background:#e1e3f7;margin:2px 4px 16px;overflow:hidden}' +
    '.mn-prog i{display:block;height:100%;width:0;border-radius:99px;background:linear-gradient(90deg,#8c83f6,#6b5ff0);transition:width .6s}' +
    '.mn-btn{width:100%;border:0;border-radius:999px;padding:18px;font-size:19px;font-weight:700;color:#fff;background:#6b5ff0;box-shadow:0 10px 22px rgba(107,95,240,.35);cursor:pointer;font-family:inherit;font-variant-numeric:tabular-nums}' +
    '.mn-btn:active{transform:scale(.98)}' +
    '.mn-btn:disabled{background:#a9a4f3;box-shadow:none;cursor:default;transform:none}' +
    '.mn-msg{margin-top:12px;padding:10px 12px;border-radius:12px;font-size:13px;display:none}' +
    '.mn-msg.err{display:block;background:#ffe3e3;color:#a12626}' +
    '.mn-msg.ok{display:block;background:#dcf7e6;color:#17663b}';
  document.head.appendChild(st);

  /* ===== Menu: 4 utama + Lainnya ===== */
  var nav = document.querySelector("nav.bottom");
  var btn = document.createElement("button");
  btn.type = "button"; btn.id = "n-profile"; btn.setAttribute("data-go", "profile");
  nav.insertBefore(btn, g("n-mine").nextSibling);

  var moreBtn = document.createElement("button");
  moreBtn.type = "button"; moreBtn.id = "n-more";
  var drawer = document.createElement("div");
  drawer.id = "navDrawer";
  ["n-alloc", "n-dist", "n-road", "n-wp", "n-vision", "n-contract", "n-sec", "n-docs", "n-team", "n-news", "n-faq", "n-gloss", "n-chan"].forEach(function (id) {
    var el = g(id); if (el) drawer.appendChild(el);
  });
  nav.appendChild(moreBtn);
  nav.appendChild(drawer);

  function closeMenu() { drawer.classList.remove("open"); }
  function sync() {
    var on = nav.querySelector("button.on");
    moreBtn.classList.toggle("on", !!(on && drawer.contains(on)) || drawer.classList.contains("open"));
  }
  moreBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    drawer.classList.toggle("open");
    sync();
  });
  document.addEventListener("click", function (e) {
    if (drawer.classList.contains("open") && !nav.contains(e.target)) { closeMenu(); sync(); }
  });

  /* ===== Halaman baru: Profil & Mining ===== */
  var main = document.querySelector("main");
  var sec = document.createElement("section");
  sec.className = "view"; sec.id = "v-profile";
  sec.innerHTML = '<div class="panel fm" id="profBody"></div>';
  main.appendChild(sec);
  VIEWS.profile = "v-profile";

  var mv = document.createElement("section");
  mv.className = "view"; mv.id = "v-mine2";
  mv.innerHTML = '<div class="mn-wrap" id="mnBody"></div>';
  main.appendChild(mv);
  VIEWS.mine = "v-mine2";

  function api(path, body) {
    var post = body !== undefined;
    return fetch("/api/" + path, {
      method: post ? "POST" : "GET", credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: post ? JSON.stringify(body) : undefined
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (d) { return { ok: r.ok, data: d }; });
    }).catch(function () { return { ok: false, data: { error: "network" } }; });
  }
  function errText(c) {
    if (c === "invalid_wallet") return T("Alamat wallet tidak valid. Harus diawali 0x dan 42 karakter.", "Invalid wallet address. It must start with 0x and be 42 characters.");
    if (c === "wallet_taken") return T("Alamat wallet ini sudah dipakai akun lain.", "This wallet is already used by another account.");
    if (c === "unauthorized") return T("Sesi habis. Silakan masuk lagi.", "Session expired. Please log in again.");
    if (c === "cooldown") return T("Sesi mining masih berjalan.", "Mining session is still running.");
    if (c === "rate_limited") return T("Terlalu banyak percobaan. Coba lagi nanti.", "Too many attempts. Try again later.");
    if (c === "network") return T("Koneksi bermasalah.", "Connection problem.");
    return T("Terjadi kesalahan di server. Coba lagi.", "Server error. Try again.");
  }

  /* ---------- Profil ---------- */
  function msg(text, ok) {
    var e = g("pMsg"); if (!e) return;
    e.textContent = text; e.className = "fmsg " + (ok ? "ok" : "err");
  }
  function renderProfile() {
    btn.textContent = T("Profil", "Profile");
    moreBtn.textContent = "\u2630 " + T("Lainnya", "More");
    var b = g("profBody"); if (!b) return;
    if (!me) {
      b.innerHTML = '<h2>' + T("Profil", "Profile") + '</h2><p class="sub">' +
        T("Masuk dulu untuk melihat profil.", "Log in to view your profile.") +
        '</p><button class="btn primary" type="button" id="pGo">' + T("Masuk / Daftar", "Log in / Sign up") + '</button>';
      g("pGo").onclick = function () { go("auth"); };
      return;
    }
    var locked = !!me.wallet && !editing;
    b.innerHTML =
      '<h2>' + T("Profil", "Profile") + '</h2><p class="sub" id="pWho"></p>' +
      '<div class="mst"><div>' + T("Saldo", "Balance") + '<b id="pBal"></b></div>' +
      '<div>Wallet<b id="pStat"></b></div></div>' +
      '<label for="pWallet">' + T("Alamat wallet BSC (BEP-20)", "BSC wallet address (BEP-20)") + '</label>' +
      '<input id="pWallet" placeholder="0x..." autocomplete="off" autocapitalize="off" spellcheck="false">' +
      (locked ? '<div class="pbadge">\u2713 ' + T("Wallet tersimpan", "Wallet saved") + '</div>' : '') +
      '<button class="btn' + (locked ? '' : ' primary') + '" type="button" id="pSave">' +
        (locked ? T("Ubah Wallet", "Change Wallet") : T("Simpan Wallet", "Save Wallet")) + '</button>' +
      (me.wallet && editing ? '<button class="btn" type="button" id="pCancel">' + T("Batal", "Cancel") + '</button>' : '') +
      '<div class="fmsg" id="pMsg"></div><div class="lnk" id="pLink"></div>' +
      '<p class="note">' + T("Jangan pernah memasukkan seed phrase atau private key. Cukup alamat publik (0x...).", "Never enter your seed phrase or private key. Only the public address (0x...).") + '</p>' +
      '<button class="btn" type="button" id="pOut">' + T("Keluar", "Log out") + '</button>';
    g("pWho").textContent = (me.name ? me.name + " \u2022 " : "") + me.email;
    g("pBal").textContent = f6(liveBalance());
    g("pStat").textContent = me.wallet ? "\u2713 " + T("Tersimpan", "Saved") : T("Belum diisi", "Not set");
    var inp = g("pWallet");
    if (me.wallet && !editing) inp.value = me.wallet;
    inp.readOnly = locked;
    if (me.wallet) {
      var a = document.createElement("a");
      a.href = "https://bscscan.com/address/" + me.wallet;
      a.target = "_blank"; a.rel = "noopener noreferrer";
      a.textContent = T("Lihat di BscScan", "View on BscScan");
      g("pLink").appendChild(a);
    }
    g("pSave").onclick = function () {
      if (locked) { editing = true; renderProfile(); var i = g("pWallet"); i.readOnly = false; i.focus(); i.select(); }
      else saveWallet();
    };
    if (g("pCancel")) g("pCancel").onclick = function () { editing = false; renderProfile(); };
    g("pOut").onclick = function () { api("logout", {}).then(function () { location.reload(); }); };
  }
  function saveWallet() {
    var w = g("pWallet").value.trim();
    if (!/^0x[a-fA-F0-9]{40}$/.test(w)) return msg(errText("invalid_wallet"));
    g("pSave").disabled = true;
    api("wallet", { wallet: w }).then(function (r) {
      if (g("pSave")) g("pSave").disabled = false;
      if (!r.ok) return msg(errText(r.data.error));
      me.wallet = r.data.wallet || w.toLowerCase();
      editing = false;
      renderProfile();
      msg(T("Wallet berhasil disimpan \u2713", "Wallet saved successfully \u2713"), true);
    });
  }

  /* ---------- Mining ---------- */
  var tickM = null;
  function mmsg(text, ok) {
    var e = g("mnMsg"); if (!e) return;
    e.textContent = text; e.className = "mn-msg " + (ok ? "ok" : "err");
  }
  function renderMine() {
    var b = g("mnBody"); if (!b) return;
    clearInterval(tickM);
    if (!me) {
      b.innerHTML = '<div class="mn-orb"><div class="mn-coin">BTW</div></div>' +
        '<div class="mn-card"><p style="margin-bottom:14px;color:#3d4163">' + T("Masuk dulu untuk mulai mining.", "Log in to start mining.") +
        '</p><button class="mn-btn" type="button" id="mnGo">' + T("Masuk / Daftar", "Log in / Sign up") + '</button></div>';
      g("mnGo").onclick = function () { go("auth"); };
      return;
    }
    var RATE = me.rate || 0.004, HRS = me.session_hours || 24, DUR = HRS * 3600000;
    var skew = me.server_now ? new Date(me.server_now).getTime() - Date.now() : 0;
    var start = me.mine_start ? new Date(me.mine_start).getTime() : 0;
    b.innerHTML =
      '<div class="mn-orb" id="mnOrb"><div class="mn-coin">BTW</div></div>' +
      '<div class="mn-bal"><i class="mn-dot"></i><span id="mnBal">0</span></div>' +
      '<div class="mn-card">' +
        '<div class="mn-row"><span>' + T("Hadiah per sesi", "Reward per session") + '</span><b>' + (RATE * HRS).toLocaleString("id-ID", { maximumFractionDigits: 3 }) + ' BTW</b></div>' +
        '<div class="mn-row"><span>Rate</span><em>' + String(RATE).replace(".", ",") + ' / ' + T("jam", "hr") + '</em></div>' +
        '<div class="mn-row"><span>' + T("Durasi sesi", "Session length") + '</span><em>' + HRS + ' ' + T("jam", "hrs") + '</em></div>' +
      '</div>' +
      '<div class="mn-tiles">' +
        '<div class="mn-card mn-tile"><small>' + T("Poin sesi ini", "This session") + '</small><b id="mnEarn">0</b></div>' +
        '<div class="mn-card mn-tile"><small>Status</small><b id="mnStat">-</b></div>' +
      '</div>' +
      '<div class="mn-prog"><i id="mnBar"></i></div>' +
      '<button class="mn-btn" type="button" id="mnBtn" disabled>-</button>' +
      '<div class="mn-msg" id="mnMsg"></div>';
    g("mnBtn").onclick = claim;

    function upd() {
      var bt = g("mnBtn"); if (!bt) return clearInterval(tickM);
      var now = Date.now() + skew;
      var elapsed = start ? Math.max(0, Math.min(now - start, DUR)) : 0;
      var earned = RATE * (elapsed / 3600000);
      g("mnBal").textContent = f6(me.balance + earned);
      g("mnEarn").textContent = f6(earned);
      g("mnBar").style.width = (start ? Math.round(elapsed / DUR * 100) : 0) + "%";
      var left = start ? start + DUR - now : 0;
      var running = start && left > 0;
      g("mnOrb").classList.toggle("run", !!running);
      if (running) {
        var s = Math.ceil(left / 1000), h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), c = s % 60;
        bt.disabled = true;
        bt.textContent = [h, m, c].map(function (x) { return String(x).padStart(2, "0"); }).join(":");
        g("mnStat").textContent = "Mining";
      } else {
        bt.disabled = false;
        bt.textContent = start ? T("Mulai Sesi Baru", "Start New Session") : T("Mulai Mining", "Start Mining");
        g("mnStat").textContent = start ? T("Selesai", "Done") : T("Siap", "Ready");
      }
    }
    upd(); tickM = setInterval(upd, 1000);
  }
  function claim() {
    g("mnBtn").disabled = true;
    api("claim", {}).then(function (r) {
      load().then(function () {
        if (r.ok) mmsg(T("Sesi mining 24 jam dimulai!", "24-hour mining session started!"), true);
        else mmsg(errText(r.data.error));
      });
    });
  }

  /* ---------- Muat data & navigasi ---------- */
  function load() {
    return api("me").then(function (r) {
      me = (r.ok && r.data.user) ? r.data.user : null;
      renderProfile(); renderMine();
    });
  }
  var _go = go;
  go = function (n) {
    _go(n);
    closeMenu();
    sync();
    if (n === "profile") editing = false;
    if (n === "profile" || n === "mine") load();
  };
  ["lang-id", "lang-en"].forEach(function (id) {
    g(id).addEventListener("click", function () { renderProfile(); renderMine(); });
  });
  renderProfile(); renderMine(); sync();
  load().then(function () { if (me && location.hash === "#mine") go("mine"); });
})();
