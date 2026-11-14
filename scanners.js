/* SDX Members Dashboard: Scanners page */
(function () {
  "use strict";
  var P = window.SDX_PAGES;
  function X() { return window.SDX; }
  function esc(s) { return X().esc(s); }
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  // Edit this list to add, rename or open up scanners. status: "live" or "soon".
  var SCANNERS = [
    {
      id: "platinum", name: "SDX Sniper", tag: "BREAKER STRUCTURE 60%", status: "live", tf: "Any timeframe M5 and up",
      line: "Waits for a clean break of structure, then sets a limit order on the POI past the 60% of that range. Entries come from the next timeframe down.",
      shows: ["Entry, SL and TP lines that follow the setup", "POIs from the leg that caused the break", "Draws on liquidity marked", "Confirmation checklist in the top right that goes green as each step happens", "Past trades marked with small arrows"],
      how: ["Wait for the break of structure. The leg that breaks must be at least 5 candles.", "Buys only from a POI past the 60% of the range. Sells the other way round.", "The scanner sets the limit order before price gets there.", "SL at the range low for buys, range high for sells. TP is 2R.", "If the checklist says unconfirmed structure, it was an MSS, not a BOS. No trade."],
      chart: { title: "60% BREAKER", dir: "buy", box: "POI", check: ["BOS", "5+ candle leg", "Past 60%", "POI tap", "Limit set"] }
    },
    {
      id: "chrome", name: "SDX Pulse", tag: "TREND SIGNALS", status: "live", tf: "15M trend, 5M or 1M entry",
      line: "Our take on the Cipher. Buy and Sell signals with a multi-timeframe dashboard. Only take the signal when the timeframes agree.",
      shows: ["Buy and Sell signals", "Entry, SL and TP1 to TP3", "Dashboard: trend, direction, state and strength per timeframe", "Trigger panel underneath the chart"],
      how: ["Check the 15M. Going down, only look for sells. Going up, only buys.", "Check the 5M or 1M goes the same way. All three agreeing is the best trade.", "Wait for the signal, then get in.", "Stop loss around 20 to 30 pips plus the spread. Never more than 60.", "At TP1 move your stop to entry. At TP2 close the trade."],
      chart: { title: "TREND", dir: "buy", box: "", check: ["15M trend", "5M agrees", "1M agrees", "Signal", "TP1 hit"] }
    },
    {
      id: "titanium", name: "SDX Fortress", tag: "SMC SUPPLY & DEMAND", status: "live", tf: "M1, M5 and M15",
      line: "Full smart money indicator. Sets an entry on every supply and demand zone and keeps them on the chart until they are used, without cramming it.",
      shows: ["Supply and demand zones with entries set", "Trend for M1, M5 and M15", "Zones stay valid until price uses them", "Entry, SL and TP on every zone"],
      how: ["Check the trend on M1, M5 and M15.", "Only take sells from supply when all three are bearish.", "Only take buys from demand when all three are bullish.", "If the timeframes don't agree, leave it."],
      chart: { title: "SMC", dir: "sell", box: "SUPPLY", check: ["M15 bearish", "M5 bearish", "M1 bearish", "Supply zone", "Entry set"] }
    },
    {
      id: "obsidian", name: "SDX Phantom", tag: "FAILED BREAK", status: "live", tf: "M15 and higher",
      line: "Catches the fake breaks. When price tries to break a level and only wicks through, it marks the breaker block or flipped order block for the entry.",
      shows: ["Failed breaks marked when price closes back inside", "Breaker block and OB flip zones", "Entry, SL and TP 2R", "Works on M15 and higher"],
      how: ["Price tries to break a high or low but closes back as a wick. That is the failed break.", "Wait for price to come into the breaker block or flipped order block.", "SL at the low for buys, the high for sells.", "TP is 2R."],
      chart: { title: "FAILED BREAK", dir: "sell", box: "BREAKER", check: ["Level tested", "Wick only", "Close inside", "Breaker block", "Entry"] }
    },
    {
      id: "cobalt", name: "SDX Raid", tag: "SESSION SWEEP", status: "soon", tf: "Session levels, M5 entries",
      line: "Only marks session liquidity: Asia high and low, then London high and low. Waits for a sweep into a POI, the M5 shift, then the pullback.",
      shows: ["Asia and London highs and lows", "Unswept levels stay valid", "M5 market structure shift out of the POI", "Entry at 0.5 of the shift, TP at the other side of the session"],
      how: ["Price sweeps a session high or low into a POI.", "On the M5, wait for the market structure shift out of that POI.", "Entry is the pullback to 0.5 of the shift.", "TP is the other side of the same session. London low swept, target London high."],
      chart: { title: "SESSION SWEEP", dir: "sell", box: "SESSION", check: ["Session sweep", "Into POI", "M5 MSS", "0.5 pullback", "Entry"] }
    },
    {
      id: "iridium", name: "SDX Leviathan", tag: "INSTITUTIONAL ORDER FLOW", status: "soon", tf: "Coming soon",
      line: "Follows institutional order flow so you can see which side the big money is on. More details when it launches.",
      shows: ["Order flow direction", "Key institutional levels", "Buy and Sell signals with SL and TP"],
      how: ["Full guide coming when the scanner launches."],
      chart: { title: "ORDER FLOW", dir: "buy", box: "ORDER FLOW", check: ["Flow bullish", "Key level", "Reaction", "Confirmation", "Entry"] }
    }
  ];

  // ---------- drawn example chart ----------
  function rnd(seed) { var x = Math.sin(seed) * 10000; return x - Math.floor(x); }
  function chartSvg(sc, k) {
    var W = 680, H = 300, n = 46, cw = 7, gap = 3.4, buy = sc.chart.dir === "buy";
    // the story in price points (bigger = higher): leg up breaks the old high, pullback into the zone, sweep, entry, run to target
    var WP = [[0, 100], [6, 128], [9, 119], [14, 142], [22, 121], [25, 111], [27, 119], [40, 137], [45, 136]];
    function path(i) { for (var j = 0; j < WP.length - 1; j++) if (i <= WP[j + 1][0]) { var a = WP[j], b = WP[j + 1], t = (i - a[0]) / (b[0] - a[0]); return a[1] + (b[1] - a[1]) * t; } return WP[WP.length - 1][1]; }
    var flip = function (v) { return buy ? v : 240 - v; };
    var pts = [];
    for (var i = 0; i < n; i++) {
      var o = path(i - 0.5 < 0 ? 0 : i - 0.5) + (rnd(i * 13 + k) - 0.5) * 2, c = path(i + 0.5) + (rnd(i * 17 + k * 3) - 0.5) * 2;
      var h = Math.max(o, c) + 1 + rnd(i * 5 + k) * 3.5, l = Math.min(o, c) - 1 - rnd(i * 7 + k) * 3.5;
      if (i === 25) l -= 3;
      pts.push([flip(o), flip(buy ? h : l), flip(buy ? l : h), flip(c)]);
    }
    var lo = 92, hi = 162;
    if (!buy) { lo = 240 - 162; hi = 240 - 92; }
    var y = function (v) { return 18 + (1 - (v - lo) / (hi - lo)) * (H - 36); };
    var x0 = 24, cx = function (i) { return x0 + i * (cw + gap); };
    var ent = flip(119), sl = flip(108), tp = flip(141);
    var g = '<rect width="' + W + '" height="' + H + '" fill="#050506"/>';
    for (var gy = 0; gy < 6; gy++) g += '<line x1="0" x2="' + W + '" y1="' + (20 + gy * 52) + '" y2="' + (20 + gy * 52) + '" stroke="#111214"/>';
    g += '<text x="' + (cx(22)) + '" y="' + (H / 2 + 14) + '" text-anchor="middle" fill="#ffffff" fill-opacity=".035" font-family="Space Grotesk,sans-serif" font-size="38" font-weight="700" letter-spacing="4">SDX TRADING</text>';
    if (sc.chart.box) {
      var z1 = y(flip(114)), z2 = y(flip(122));
      g += '<rect x="' + cx(13) + '" y="' + Math.min(z1, z2) + '" width="' + (cx(33) - cx(13)) + '" height="' + Math.abs(z2 - z1) + '" fill="rgba(201,206,214,.09)" stroke="rgba(201,206,214,.4)" stroke-dasharray="3 3"/><text x="' + (cx(13) + 6) + '" y="' + (Math.min(z1, z2) + 12) + '" fill="#c9ced6" font-size="10" font-family="Inter,sans-serif">' + sc.chart.box + "</text>";
    }
    var bY = y(flip(128));
    g += '<line x1="' + cx(6) + '" x2="' + cx(13) + '" y1="' + bY + '" y2="' + bY + '" stroke="#8d939b" stroke-dasharray="4 3"/><text x="' + (cx(9) - 4) + '" y="' + (bY + (buy ? -5 : 13)) + '" fill="#8d939b" font-size="10" font-family="Inter,sans-serif">BOS</text>';
    pts.forEach(function (q, i) {
      var up = q[3] > q[0], col = up ? "#e9edf2" : "#5e646d";
      g += '<line x1="' + (cx(i) + cw / 2) + '" x2="' + (cx(i) + cw / 2) + '" y1="' + y(Math.max(q[1], q[2])) + '" y2="' + y(Math.min(q[1], q[2])) + '" stroke="' + col + '"/><rect x="' + cx(i) + '" y="' + y(Math.max(q[0], q[3])) + '" width="' + cw + '" height="' + Math.max(1.5, Math.abs(y(q[3]) - y(q[0]))) + '" fill="' + col + '"/>';
    });
    var ex1 = cx(27), ex2 = cx(n - 1) + 36;
    [[tp, "TP", "#7fd99a"], [ent, "Entry", "#e9edf2"], [sl, "SL", "#ff8a8a"]].forEach(function (L) {
      g += '<line x1="' + ex1 + '" x2="' + ex2 + '" y1="' + y(L[0]) + '" y2="' + y(L[0]) + '" stroke="' + L[2] + '" stroke-width="1.2"/><rect x="' + (ex2 - 42) + '" y="' + (y(L[0]) - 8) + '" width="42" height="16" rx="3" fill="' + L[2] + '"/><text x="' + (ex2 - 21) + '" y="' + (y(L[0]) + 4) + '" text-anchor="middle" fill="#050506" font-size="10" font-weight="700" font-family="Inter,sans-serif">' + L[1] + "</text>";
    });
    g += '<rect x="' + (cx(27) - 34) + '" y="' + (y(ent) - 8) + '" width="30" height="16" rx="4" fill="url(#m' + k + ')"/><text x="' + (cx(27) - 19) + '" y="' + (y(ent) + 4) + '" text-anchor="middle" fill="#0a0a0a" font-size="10" font-weight="700" font-family="Inter,sans-serif">' + (buy ? "Buy" : "Sell") + "</text>";
    var tx = W - 146, rows = sc.chart.check, ty = 14;
    g += '<rect x="' + tx + '" y="' + ty + '" width="136" height="' + (24 + rows.length * 17) + '" rx="6" fill="#0b0b0c" fill-opacity=".92" stroke="#24262a"/><text x="' + (tx + 10) + '" y="' + (ty + 16) + '" fill="#c9ced6" font-size="9" letter-spacing="1.5" font-family="Inter,sans-serif">' + esc(sc.chart.title || sc.tag) + "</text>";
    rows.forEach(function (r, i) { var on = i < rows.length - (k % 2); g += '<rect x="' + (tx + 10) + '" y="' + (ty + 24 + i * 17) + '" width="9" height="9" rx="2" fill="' + (on ? "#7fd99a" : "#26282c") + '"/><text x="' + (tx + 25) + '" y="' + (ty + 32 + i * 17) + '" fill="' + (on ? "#e6e8eb" : "#6b7078") + '" font-size="10" font-family="Inter,sans-serif">' + esc(r) + "</text>"; });
    return '<svg viewBox="0 0 ' + W + " " + H + '" style="width:100%;height:auto;display:block;border-radius:12px"><defs><linearGradient id="m' + k + '" x1="0" x2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".4" stop-color="#9aa0a8"/><stop offset=".7" stop-color="#ffffff"/><stop offset="1" stop-color="#c9ced6"/></linearGradient></defs>' + g + "</svg>";
  }

  // ---------- access requests (saved per student) ----------
  var REQ = { rows: null };
  async function loadReq() {
    try { var r = await X().sb.from("journal_items").select("*").eq("kind", "scanreq"); REQ.rows = r.error ? [] : (r.data || []); } catch (e) { REQ.rows = []; }
  }
  function reqFor(id) { return (REQ.rows || []).filter(function (r) { return r.data && r.data.scanner === id; })[0]; }

  // ======================= SCANNER TERMINAL =======================
  var METAL = {
    platinum: ["#ffffff", "#c9ced6", "#7d838c"], chrome: ["#ffffff", "#e9edf2", "#3e434a"], titanium: ["#dfe5ec", "#9aa6b4", "#4f5a67"],
    obsidian: ["#6b7078", "#24272c", "#050506"], cobalt: ["#d6e6ff", "#7aa8ec", "#24508f"], iridium: ["#f0ebff", "#b6aae6", "#5c4f96"]
  };
  var GLYPH = {
    platinum: '<path d="M7 15l3-3 2 2 5-6"/><path d="M14 8h3v3"/>', chrome: '<path d="M4 12h3l2-5 3 10 2-5h6"/>',
    titanium: '<rect x="6" y="6" width="12" height="5" rx="1"/><rect x="6" y="13" width="12" height="5" rx="1"/>', obsidian: '<path d="M5 9h14"/><path d="M12 9v9"/><path d="M9 15l3 3 3-3"/>',
    cobalt: '<circle cx="12" cy="12" r="6"/><path d="M12 6v6l4 2"/>', iridium: '<path d="M4 16c3-6 5-6 8-2s5 4 8-2"/><path d="M4 11c3-6 5-6 8-2s5 4 8-2" opacity=".5"/>'
  };
  function badge(id, size) {
    var m = METAL[id] || METAL.platinum, z = size || 44, gid = "bg" + id + z;
    return '<svg width="' + z + '" height="' + z + '" viewBox="0 0 48 48" style="flex:none"><defs><linearGradient id="' + gid + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + m[0] + '"/><stop offset=".45" stop-color="' + m[1] + '"/><stop offset=".55" stop-color="' + m[2] + '"/><stop offset="1" stop-color="' + m[1] + '"/></linearGradient></defs><path d="M24 2l19 11v22L24 46 5 35V13z" fill="url(#' + gid + ')" stroke="rgba(255,255,255,.35)"/><g transform="translate(12 12)" fill="none" stroke="' + (id === "obsidian" ? "#e9edf2" : "#0a0a0a") + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + (GLYPH[id] || "") + "</g></svg>";
  }
  var PAIRS = [["GBPUSD", "OANDA:GBPUSD"], ["EURUSD", "OANDA:EURUSD"], ["XAUUSD", "OANDA:XAUUSD"], ["GBPJPY", "OANDA:GBPJPY"], ["NAS100", "OANDA:NAS100USD"], ["US30", "OANDA:US30USD"], ["GER30", "OANDA:DE30EUR"], ["AUDUSD", "OANDA:AUDUSD"]];
  var TFS = [["1", "M1"], ["5", "M5"], ["15", "M15"], ["60", "1H"], ["240", "4H"]];
  var T = { sc: "platinum", pair: "GBPUSD", tf: "5", tab: "about", sig: null, signals: null, filter: "all", chan: null };
  function tvSym(p) { var f = PAIRS.filter(function (x) { return x[0] === p; })[0]; return f ? f[1] : "OANDA:" + p; }
  function scById(id) { return SCANNERS.filter(function (s) { return s.id === id; })[0]; }

  async function loadSignals() {
    try {
      var r = await X().sb.from("scanner_signals").select("*").order("created_at", { ascending: false }).limit(200);
      T.signals = r.error ? [] : (r.data || []);
    } catch (e) { T.signals = []; }
  }
  function sigsFor(id) { return (T.signals || []).filter(function (g) { return g.scanner === id; }); }
  function timeAgo(t) { var m = Math.round((Date.now() - new Date(t).getTime()) / 6e4); return m < 1 ? "now" : m < 60 ? m + "m" : m < 1440 ? Math.floor(m / 60) + "h" : Math.floor(m / 1440) + "d"; }
  var ST = { waiting: ["WAITING", "#1c1c1e", "#c9ced6"], triggered: ["IN TRADE", "rgba(160,190,255,.14)", "#b8c8ff"], tp: ["TP HIT", "rgba(127,217,154,.14)", "#7fd99a"], sl: ["SL HIT", "rgba(255,138,138,.14)", "#ff8a8a"], be: ["BREAKEVEN", "#18181a", "#c9ced6"], cancelled: ["CANCELLED", "#151517", "#6b7078"] };

  function chartFrame() {
    if (window.SDX_PREVIEW_CHART) return '<div id="tvBox" style="height:100%;min-height:420px"></div>';
    var src = "https://s.tradingview.com/widgetembed/?frameElementId=tv&symbol=" + encodeURIComponent(tvSym(T.pair)) + "&interval=" + T.tf + "&hidesidetoolbar=0&symboledit=1&saveimage=0&toolbarbg=0a0a0a&theme=dark&style=1&timezone=Europe%2FLondon&withdateranges=1&locale=en";
    return '<iframe id="tvFrame" src="' + src + '" style="width:100%;height:100%;min-height:420px;border:0;display:block;background:#050506" allowtransparency="true" scrolling="no"></iframe>';
  }
  function levelsCard(g) {
    if (!g) return "";
    var st = ST[g.status] || ST.waiting, rr = Math.abs((g.tp - g.entry) / ((g.entry - g.sl) || 1));
    return '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px">' + [["Entry", g.entry, "#e9edf2"], ["Stop loss", g.sl, "#ff8a8a"], ["Take profit", g.tp, "#7fd99a"], ["Reward", rr.toFixed(1) + "R", "#e9edf2"]].map(function (x) { return '<div style="background:#0b0b0c;border-radius:10px;padding:10px 12px;box-shadow:inset 0 0 0 1px #1f2023"><div class="muted" style="font-size:10px">' + x[0] + '</div><div style="font:600 15px var(--sg);color:' + x[2] + '">' + x[1] + "</div></div>"; }).join("") + "</div>";
  }

  P.scanners = async function (page) {
    page.innerHTML = '<div class="note">Loading scanners…</div>';
    await Promise.all([loadReq(), loadSignals()]);
    drawT(page);
    try {
      if (T.chan) X().sb.removeChannel(T.chan);
      T.chan = X().sb.channel("scan").on("postgres_changes", { event: "*", schema: "public", table: "scanner_signals" }, function () { loadSignals().then(function () { if (document.body.contains(page)) drawSide(page); }); }).subscribe();
    } catch (e) { }
  };

  function drawT(page) {
    var sc = scById(T.sc), rq = reqFor(sc.id), soon = sc.status !== "live";
    var html =
      '<div style="display:flex;justify-content:space-between;align-items:flex-end;gap:14px;flex-wrap:wrap"><div style="display:flex;flex-direction:column;gap:8px"><div class="eyebrow">SD TRADING EDUCATION</div><h1 class="title" style="margin:0">Scanners</h1></div>' +
      '<div class="note" style="font-size:12px;max-width:420px">Pick a scanner, watch the chart and the live signals. Tap a signal to load it on the chart.</div></div>' +
      // scanner selector
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px">' + SCANNERS.map(function (s) {
        var on = s.id === T.sc, n = sigsFor(s.id).filter(function (g) { return g.status === "waiting" || g.status === "triggered"; }).length;
        return '<button data-sc="' + s.id + '" style="display:flex;gap:12px;align-items:center;text-align:left;padding:12px;border-radius:14px;cursor:pointer;border:none;color:#f4f4f5;font:13px Inter;background:' + (on ? "linear-gradient(180deg,#18191c,#101113)" : "#0c0c0d") + ";box-shadow:inset 0 0 0 1px " + (on ? "rgba(255,255,255,.35)" : "#1c1d20") + (on ? ",0 8px 24px rgba(0,0,0,.4)" : "") + '">' + badge(s.id, 38) + '<span style="display:flex;flex-direction:column;gap:2px;min-width:0"><span style="font:600 14px var(--sg);white-space:nowrap">' + esc(s.name) + '</span><span style="font-size:10px;letter-spacing:.12em;color:#8e939b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + esc(s.tag) + '</span><span style="font-size:11px;color:' + (s.status === "live" ? "#7fd99a" : "#8e939b") + '">' + (s.status === "live" ? "Live" + (n ? " · " + n + " active" : "") : "Coming soon") + "</span></span></button>";
      }).join("") + "</div>" +
      // terminal
      '<div style="display:grid;grid-template-columns:minmax(0,1fr) 340px;gap:16px;align-items:stretch" class="sc-term">' +
        '<section class="card" style="display:flex;flex-direction:column;min-height:560px">' +
          '<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;padding:12px 14px;border-bottom:1px solid #18181a"><div style="display:flex;gap:10px;align-items:center">' + badge(sc.id, 30) + '<div><div style="font:600 15px var(--sg)">' + esc(sc.name) + '</div><div class="muted" style="font-size:11px">' + esc(sc.tf) + "</div></div></div>" +
          '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center"><select class="input" id="tPair" style="height:36px;width:auto;font-size:13px">' + PAIRS.map(function (p) { return '<option' + (p[0] === T.pair ? " selected" : "") + ">" + p[0] + "</option>"; }).join("") + '</select><div class="tabs">' + TFS.map(function (t) { return '<button class="tab' + (t[0] === T.tf ? " on" : "") + '" data-tf="' + t[0] + '" style="min-height:30px;padding:0 10px">' + t[1] + "</button>"; }).join("") + '</div><a class="btn btn-ghost" target="_blank" rel="noopener" href="https://www.tradingview.com/chart/?symbol=' + encodeURIComponent(tvSym(T.pair)) + '" style="height:36px;font-size:12px">Open in TradingView</a></div></div>' +
          '<div id="tChart" style="flex:1;position:relative">' + chartFrame() + "</div>" +
          '<div id="tSel" style="padding:12px 14px;border-top:1px solid #18181a"></div>' +
        "</section>" +
        '<section class="card" style="display:flex;flex-direction:column;min-height:560px"><div id="tSide" style="display:flex;flex-direction:column;flex:1;min-height:0"></div></section>' +
      "</div>" +
      // about / how / access
      '<section class="card pad" style="display:flex;flex-direction:column;gap:16px">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap"><div class="tabs">' + [["about", "What it does"], ["how", "How to trade it"], ["access", "Get it on TradingView"]].map(function (t) { return '<button class="tab' + (T.tab === t[0] ? " on" : "") + '" data-tab="' + t[0] + '">' + t[1] + "</button>"; }).join("") + "</div>" +
        '<span class="tag" style="background:' + (soon ? "#1c1c1e;color:#8e939b" : "rgba(127,217,154,.14);color:#7fd99a") + '">' + (soon ? "COMING SOON" : "LIVE") + "</span></div>" +
        '<div id="tTab"></div></section>' +
      '<div class="note" style="font-size:11px">Scanners help you find setups. They do not trade for you and they will not win every time. Always follow your risk plan. This is education, not financial advice.</div>';
    if (OPEN.id) html += accessModal();
    page.innerHTML = html;
    if (!document.getElementById("scTermCss")) { var st = document.createElement("style"); st.id = "scTermCss"; st.textContent = "@media (max-width:980px){.sc-term{grid-template-columns:1fr !important}}"; document.head.appendChild(st); }
    $$("[data-sc]", page).forEach(function (b) { b.onclick = function () { T.sc = b.dataset.sc; T.sig = null; T.filter = "all"; drawT(page); }; });
    $$("[data-tf]", page).forEach(function (b) { b.onclick = function () { T.tf = b.dataset.tf; drawT(page); }; });
    $("#tPair", page).onchange = function () { T.pair = this.value; drawT(page); };
    $$("[data-tab]", page).forEach(function (b) { b.onclick = function () { T.tab = b.dataset.tab; drawT(page); }; });
    drawTab(page); drawSide(page); drawSel(page);
    if (window.SDX_PREVIEW_CHART) window.SDX_PREVIEW_CHART($("#tvBox", page), T, sigOn());
    wireAccess(page);
  }
  function sigOn() { return T.sig ? (T.signals || []).filter(function (g) { return g.id === T.sig; })[0] : null; }
  function drawSel(page) {
    var el = $("#tSel", page); if (!el) return; var g = sigOn();
    if (!g) { el.innerHTML = '<div class="note" style="font-size:12px">Tap a signal on the right to see its levels here and load the pair on the chart.</div>'; return; }
    var st = ST[g.status] || ST.waiting;
    el.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:10px"><div style="font:600 15px var(--sg)">' + esc(g.symbol) + " · " + esc(g.tf) + " · " + (g.side === "buy" ? "Buy" : "Sell") + '</div><span class="tag" style="background:' + st[1] + ";color:" + st[2] + '">' + st[0] + "</span></div>" + levelsCard(g);
  }
  function drawSide(page) {
    var el = $("#tSide", page); if (!el) return;
    var sc = scById(T.sc), all = sigsFor(T.sc), list = all.filter(function (g) { return T.filter === "all" ? true : T.filter === "active" ? (g.status === "waiting" || g.status === "triggered") : (g.status === "tp" || g.status === "sl" || g.status === "be"); });
    var done = all.filter(function (g) { return g.status === "tp" || g.status === "sl" || g.status === "be"; }), wins = done.filter(function (g) { return g.status === "tp"; }).length;
    el.innerHTML = '<div style="padding:14px 14px 10px;display:flex;flex-direction:column;gap:10px;border-bottom:1px solid #18181a"><div style="display:flex;justify-content:space-between;align-items:center"><span class="eyebrow">LIVE SIGNALS</span><span class="live-dot" style="font-size:10px">LIVE</span></div>' +
      '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">' + [["Active", all.filter(function (g) { return g.status === "waiting" || g.status === "triggered"; }).length], ["Win rate", done.length ? Math.round(wins / done.length * 100) + "%" : "–"], ["Closed", done.length]].map(function (x) { return '<div><div class="muted" style="font-size:10px">' + x[0] + '</div><div style="font:600 18px var(--sg)">' + x[1] + "</div></div>"; }).join("") + "</div>" +
      '<div class="chips">' + [["all", "All"], ["active", "Active"], ["closed", "Closed"]].map(function (f) { return '<button class="chip' + (T.filter === f[0] ? " on" : "") + '" data-flt="' + f[0] + '" style="min-height:30px">' + f[1] + "</button>"; }).join("") + "</div></div>" +
      '<div style="flex:1;overflow:auto;max-height:470px">' + (sc.status !== "live" ? '<div class="note" style="padding:20px;text-align:center">' + esc(sc.name) + " is coming soon.</div>" : list.length ? list.map(function (g) {
        var st = ST[g.status] || ST.waiting, on = g.id === T.sig;
        return '<button data-sig="' + g.id + '" style="width:100%;text-align:left;display:flex;flex-direction:column;gap:6px;padding:12px 14px;border:none;border-bottom:1px solid #141416;cursor:pointer;color:#e6e8eb;font:12px Inter;background:' + (on ? "#141518" : "transparent") + ";box-shadow:" + (on ? "inset 2px 0 0 #e9edf2" : "none") + '"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><span style="display:flex;gap:8px;align-items:center"><span style="font:700 14px var(--sg)">' + esc(g.symbol) + '</span><span class="mini">' + esc(g.tf) + '</span><span style="font:600 12px var(--sg);color:' + (g.side === "buy" ? "#7fd99a" : "#ff8a8a") + '">' + (g.side === "buy" ? "BUY" : "SELL") + '</span></span><span class="muted" style="font-size:10px">' + timeAgo(g.created_at) + '</span></div><div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><span class="muted" style="font-size:11px">E ' + g.entry + " · SL " + g.sl + " · TP " + g.tp + '</span><span class="tag" style="background:' + st[1] + ";color:" + st[2] + ';font-size:9px">' + st[0] + "</span></div></button>";
      }).join("") : '<div style="padding:24px 18px;text-align:center;display:flex;flex-direction:column;gap:8px;align-items:center"><div style="font:600 14px var(--sg)">No signals yet</div><div class="note" style="font-size:12px">When ' + esc(sc.name) + " finds a setup it shows here straight away.</div></div>") + "</div>";
    $$("[data-flt]", el).forEach(function (b) { b.onclick = function () { T.filter = b.dataset.flt; drawSide(page); }; });
    $$("[data-sig]", el).forEach(function (b) {
      b.onclick = function () {
        var g = (T.signals || []).filter(function (x) { return String(x.id) === b.dataset.sig; })[0]; if (!g) return;
        T.sig = g.id; var tfm = { M1: "1", M5: "5", M15: "15", "1H": "60", H1: "60", "4H": "240", H4: "240" }[String(g.tf).toUpperCase()];
        T.pair = g.symbol; if (tfm) T.tf = tfm; drawT(page);
      };
    });
  }
  function drawTab(page) {
    var el = $("#tTab", page), sc = scById(T.sc), rq = reqFor(sc.id); if (!el) return;
    if (T.tab === "about") el.innerHTML = '<div style="display:grid;grid-template-columns:minmax(0,1.2fr) minmax(0,1fr);gap:22px" class="sc-term"><div style="display:flex;flex-direction:column;gap:10px"><div style="display:flex;gap:14px;align-items:center">' + badge(sc.id, 52) + '<div><div style="font:700 22px var(--sg)">' + esc(sc.name) + '</div><div class="eyebrow" style="margin-top:4px">' + esc(sc.tag) + '</div></div></div><div style="font-size:14px;line-height:1.7;color:#d6d8dc">' + esc(sc.line) + '</div></div><div style="display:flex;flex-direction:column;gap:8px"><span class="eyebrow">ON YOUR CHART</span>' + sc.shows.map(function (s) { return '<div style="display:flex;gap:10px;font-size:13px;color:#c9ccd1"><span class="metal-text" style="font-weight:700">+</span>' + esc(s) + "</div>"; }).join("") + "</div></div>";
    else if (T.tab === "how") el.innerHTML = '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px">' + sc.how.map(function (h, i) { return '<div style="background:#0b0b0c;border-radius:12px;padding:14px;box-shadow:inset 0 0 0 1px #1f2023;display:flex;flex-direction:column;gap:8px"><span class="metal-text" style="font:700 22px var(--sg)">0' + (i + 1) + '</span><span style="font-size:13px;line-height:1.6;color:#d6d8dc">' + esc(h) + "</span></div>"; }).join("") + "</div>";
    else el.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap"><div style="display:flex;flex-direction:column;gap:6px;max-width:620px"><div style="font:600 17px var(--sg)">Use ' + esc(sc.name) + ' on your own TradingView.</div><div class="note" style="font-size:13px">It\'s invite-only. Request access with your TradingView username and we add you. Then on TradingView go to Indicators, then Invite-only scripts.</div>' + (rq ? '<div style="font-size:13px;color:' + (rq.data.status === "added" ? "#7fd99a" : "#c9ced6") + '">' + (rq.data.status === "added" ? "Added as @" + esc(rq.data.tv) + ". You're good to go." : "Requested as @" + esc(rq.data.tv) + ". We'll add you shortly.") + "</div>" : "") + "</div>" +
      (sc.status !== "live" ? '<button class="btn btn-ghost" disabled style="opacity:.6">Coming soon</button>' : '<button class="btn ' + (rq ? "btn-ghost" : "btn-metal") + '" data-req="' + sc.id + '">' + (rq ? "Change username" : "Get access") + "</button>") + "</div>";
    $$("[data-req]", el).forEach(function (b) { b.onclick = function () { OPEN.id = b.dataset.req; drawT(page); }; });
  }
  var OPEN = { id: null };
  function accessModal() {
    var sc = scById(OPEN.id), rq = reqFor(OPEN.id);
    return '<div class="panel-wrap"><section class="panel" style="max-width:480px"><div style="display:flex;justify-content:space-between;align-items:center"><div style="display:flex;gap:12px;align-items:center">' + badge(sc.id, 36) + '<div style="font-family:var(--sg);font-size:20px;font-weight:600">Get ' + esc(sc.name) + '</div></div><button class="x" id="scClose">×</button></div>' +
      '<div class="note" style="font-size:13px">Enter your TradingView username exactly as it shows on your profile. We\'ll add you to the invite-only script.</div>' +
      '<label class="field">TradingView username<input class="input" id="scTv" placeholder="e.g. jordansmith_fx" value="' + esc(rq ? rq.data.tv : "") + '" autocomplete="off"></label>' +
      '<div style="display:flex;gap:10px"><button class="btn btn-metal" id="scSend">' + (rq ? "Update request" : "Request access") + '</button></div><span class="muted" id="scMsg" style="font-size:12px"></span></section></div>';
  }
  function wireAccess(page) {
    if (!OPEN.id) return;
    $("#scClose", page).onclick = function () { OPEN.id = null; drawT(page); };
    $("#scTv", page).focus();
    $("#scSend", page).onclick = async function () {
      var tv = $("#scTv", page).value.trim().replace(/^@/, "");
      if (!/^[A-Za-z0-9_.-]{2,40}$/.test(tv)) { $("#scMsg", page).textContent = "Enter your TradingView username, letters, numbers and _ only."; return; }
      $("#scMsg", page).textContent = "Sending…";
      try {
        var rq = reqFor(OPEN.id), data = { scanner: OPEN.id, name: scById(OPEN.id).name, tv: tv, status: rq && rq.data.status === "added" && rq.data.tv === tv ? "added" : "requested", at: new Date().toISOString() };
        if (rq) { rq.data = data; var u = await X().sb.from("journal_items").update({ data: data, updated_at: data.at }).eq("id", rq.id); if (u.error) throw u.error; }
        else { var r = await X().sb.from("journal_items").insert({ user_id: (await X().sb.auth.getSession()).data.session.user.id, kind: "scanreq", data: data }).select().single(); if (r.error) throw r.error; REQ.rows.push(r.data); }
        OPEN.id = null; T.tab = "access"; drawT(page);
      } catch (e) { $("#scMsg", page).textContent = "Couldn't send: " + (e.message || e); }
    };
  }
})();
