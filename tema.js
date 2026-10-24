(function () {
  var css = `
html:root{--bg:#f4f5fb;--fg:#1b1d3a;--muted:#7a7fa3;--accent:#6b5ff0;--accent2:#6b5ff0;--card:#ffffff;--line:rgba(88,76,214,.16);--surface2:#ecebff}
html body{background-color:#f4f5fb!important;background-image:radial-gradient(900px 420px at 50% -140px,rgba(107,95,240,.18),transparent 70%)!important;color:#1b1d3a!important}
html body header{background:#fff!important;border-bottom:1px solid rgba(88,76,214,.14)!important;box-shadow:0 2px 14px rgba(60,60,140,.06)}
html body .brand{color:#1b1d3a!important}
html body .accbtn{background:linear-gradient(180deg,#ffd75a,#f5b82e)!important;color:#3a2a00!important;box-shadow:0 4px 12px rgba(245,184,46,.35)!important;border:0!important}
html body .lang{border-color:rgba(88,76,214,.25)!important}
html body .lang button{color:#7a7fa3!important}
html body .lang button.on{background:#6b5ff0!important;color:#fff!important}

html body nav.bottom{background:#fff!important;border-bottom:1px solid rgba(88,76,214,.14)!important;box-shadow:0 6px 16px rgba(60,60,140,.06)!important}
html body nav.bottom button{background:#f4f5fb!important;color:#5b5f86!important;border:1px solid rgba(88,76,214,.14)!important}
html body nav.bottom button.on{background:#6b5ff0!important;color:#fff!important;border-color:#6b5ff0!important;box-shadow:0 6px 14px rgba(107,95,240,.35)!important}
html body nav.bottom button.locked{color:#a4a8c4!important}
html body #navDrawer{background:#fff!important;border:1px solid rgba(88,76,214,.18)!important;box-shadow:0 18px 40px rgba(60,60,140,.22)!important}

html body .card,html body .panel,html body .contract,html body .lockcard{background:#fff!important;border:1px solid rgba(88,76,214,.12)!important;box-shadow:0 8px 24px rgba(60,60,140,.09)!important;border-radius:20px!important}
html body .lockcard{border-style:dashed!important;border-color:rgba(107,95,240,.4)!important;background:#f7f6ff!important}
html body .lockcard .t{color:#5b52e8!important}
html body .panel h2{color:#1b1d3a!important}
html body .fm h2{color:#5b52e8!important}
html body .panel p,html body .list{color:#2c2f55!important}
html body .muted{color:#7a7fa3!important}
html body .card .label{color:#8a8fb0!important}
html body .gold{color:#d9a400!important}
html body .mono{background:#f0efff!important;color:#4b44c8!important;border:1px solid rgba(88,76,214,.18)!important}
html body td{color:#2c2f55!important;border-bottom-color:rgba(88,76,214,.12)!important}

html body h1,html body .ch{color:#1b1d3a!important}
html body .tagline{color:#5b5f86!important}
html body .badge{background:#fff3c4!important;border:1px solid #f2d56b!important;color:#7a5a00!important}

html body .btn{background:#fff!important;border:1px solid rgba(107,95,240,.4)!important;color:#5b52e8!important}
html body .btn:hover{background:#f1f0ff!important;border-color:#6b5ff0!important}
html body .btn.primary{background:#6b5ff0!important;border-color:#6b5ff0!important;color:#fff!important;box-shadow:0 8px 18px rgba(107,95,240,.32)!important}
html body .btn.primary:hover{background:#5b4de0!important}
html body .btn:disabled{opacity:.5}

html body .wpmenu button{background:#fff!important;border:1px solid rgba(88,76,214,.2)!important;color:#5b5f86!important}
html body .wpmenu button.on{background:#6b5ff0!important;border-color:#6b5ff0!important;color:#fff!important}

html body .fm label{color:#3d4163!important}
html body .fm input{background:#fff!important;color:#1b1d3a!important;border:1px solid rgba(88,76,214,.28)!important}
html body .fm input:focus{outline:2px solid #6b5ff0!important}
html body .fm .sub{color:#7a7fa3!important}
html body .tabs2 button{background:#ecebff!important;color:#5b52e8!important}
html body .tabs2 button.on{background:#6b5ff0!important;color:#fff!important}
html body .mst div{background:#f4f5fb!important;color:#7a7fa3!important}
html body .mst b{color:#1b1d3a!important}
html body .bal .n{color:#d9a400!important}
html body .bal .u{color:#8a8fb0!important}
html body .fmsg.err{background:#ffe3e3!important;color:#a12626!important}
html body .fmsg.ok{background:#dcf7e6!important;color:#17663b!important}
html body .pbadge{background:#dcf7e6!important;color:#17663b!important}
html body .lnk a{color:#5b52e8!important}
html body .note{color:#8a8fb0!important}

html body #tokenBody div[style*="0c1120"]{background:#fff!important;color:#7a7fa3!important}
html body #tokenBody b[style*="f5b82e"]{color:#d9a400!important}
html body #toast{background:#1b1d3a!important;color:#fff!important}
`;
  var st = document.createElement("style");
  st.id = "tema-ungu";
  st.textContent = css;
  document.head.appendChild(st);
  var m = document.querySelector('meta[name="theme-color"]');
  if (m) m.setAttribute("content", "#ffffff");
})();
