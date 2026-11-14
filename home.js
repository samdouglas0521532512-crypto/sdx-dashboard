/* SDX Members Dashboard: home page widgets + metallic theme switcher */
(function () {
  "use strict";
  function X() { return window.SDX; }
  function esc(s) { return X().esc(s); }
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  var css = document.createElement("style");
  css.textContent = ":root{--accent:#c9ced6;--accent-hi:#ffffff;--ink:#0a0a0a}" +
    ".hw-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:16px;align-items:stretch}" +
    ".hw-link{display:flex;flex-direction:column;gap:10px;color:#f4f4f5;transition:transform .15s}.hw-link:hover{transform:translateY(-2px)}.hw-link .go{margin-top:auto;display:flex;justify-content:space-between;align-items:center;font-size:12px;color:var(--muted)}" +
    ".hw-two{grid-template-columns:repeat(auto-fit,minmax(360px,1fr))}@media (max-width:700px){.hw-two{grid-template-columns:1fr}}.hw-full{grid-column:1/-1}.hw-span2{grid-column:span 2}@media (max-width:700px){.hw-span2{grid-column:auto}}.hw-acts{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:auto}.hw-acts a{display:flex;align-items:center;justify-content:space-between;gap:8px;min-height:42px;padding:0 12px;border-radius:10px;background:#0b0b0c;box-shadow:inset 0 0 0 1px #1f2023;font-size:12px;color:#e6e8eb}.hw-acts a:hover{box-shadow:inset 0 0 0 1px var(--accent)}.hw-acts a span{color:var(--accent)}" +
    ".hw-k{font-size:11px;color:var(--muted)}.hw-v{font:700 24px var(--sg)}" +
    ".hw-ring{--p:0;width:92px;height:92px;border-radius:50%;background:conic-gradient(var(--accent) calc(var(--p)*1%),#1a1a1c 0);display:flex;align-items:center;justify-content:center;flex:none}.hw-ring>div{width:76px;height:76px;border-radius:50%;background:#0d0d0e;display:flex;flex-direction:column;align-items:center;justify-content:center}" +
    ".hw-check{display:flex;gap:10px;align-items:center;min-height:36px;font-size:13px;cursor:pointer}.hw-check input{width:17px;height:17px;accent-color:var(--accent);flex:none}" +
    ".hw-bar{height:6px;border-radius:3px;background:#1a1a1c;overflow:hidden}.hw-bar>div{height:100%;background:var(--metal)}" +
    ".hw-days{display:grid;grid-template-columns:repeat(7,1fr);gap:6px;max-width:420px}.hw-days>div{aspect-ratio:1;border-radius:6px;background:#141416;box-shadow:inset 0 0 0 1px #1f2023;display:flex;align-items:center;justify-content:center;font-size:10px;color:#6b7078}.hw-days>div.on{background:var(--metal);color:var(--ink);font-weight:700;box-shadow:none}";
  document.head.appendChild(css);

  // ======================= HOME WIDGETS =======================
  var LINES = [
    "Trade the plan, not your feelings.",
    "One good trade is better than five rushed ones.",
    "Protect the account first. Profit comes second.",
    "The market will be here tomorrow. Your capital might not be if you force it.",
    "Consistency beats intensity.",
    "Wait for your setup. Patience is a position.",
    "Journal every trade. The data tells you the truth."
  ];
  // Sam's live schedule (UK time): live trading 08:00 to 10:30, daily breakdown 19:00
  var SCHEDULE = [["Live trading", 480, 630], ["Daily breakdown", 1140, 1200]];
  function ukNow() {
    var p = {}; new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", hour: "2-digit", minute: "2-digit", weekday: "long", day: "numeric", month: "long", hour12: false }).formatToParts(new Date()).forEach(function (x) { p[x.type] = x.value; });
    return { t: (parseInt(p.hour, 10) % 24) * 60 + parseInt(p.minute, 10), label: p.weekday + " " + p.day + " " + p.month, hour: parseInt(p.hour, 10) % 24 };
  }
  function nextSession() {
    var n = ukNow(), live = SCHEDULE.filter(function (s) { return n.t >= s[1] && n.t < s[2]; })[0];
    if (live) return { live: true, name: live[0], text: "On now until " + hm(live[2]) };
    var up = SCHEDULE.filter(function (s) { return s[1] > n.t; })[0], mins, name;
    if (up) { mins = up[1] - n.t; name = up[0]; } else { mins = 1440 - n.t + SCHEDULE[0][1]; name = SCHEDULE[0][0] + " tomorrow"; }
    return { live: false, name: name, text: "Starts in " + (Math.floor(mins / 60) ? Math.floor(mins / 60) + "h " : "") + (mins % 60) + "m", at: up ? hm(up[1]) : hm(SCHEDULE[0][1]) };
  }
  function hm(m) { var h = Math.floor(m / 60), x = m % 60; return (h < 10 ? "0" : "") + h + ":" + (x < 10 ? "0" : "") + x; }
  function greet(h) { return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening"; }
  function dayKey(d) { return (d || "").slice(0, 10); }
  function streak(dates) {
    var set = {}; dates.forEach(function (d) { if (d) set[dayKey(d)] = 1; });
    var n = 0, t = new Date(); if (!set[t.toISOString().slice(0, 10)]) t.setDate(t.getDate() - 1);
    while (set[t.toISOString().slice(0, 10)]) { n++; t.setDate(t.getDate() - 1); }
    return n;
  }
  function last14(dates) {
    var set = {}; dates.forEach(function (d) { if (d) set[dayKey(d)] = 1; });
    var out = []; for (var i = 13; i >= 0; i--) { var t = new Date(); t.setDate(t.getDate() - i); var k = t.toISOString().slice(0, 10); out.push([k, !!set[k], t.toLocaleDateString("en-GB", { weekday: "narrow" })]); }
    return out;
  }
  function card(inner, extra) { return '<section class="card pad" style="display:flex;flex-direction:column;gap:14px;' + (extra || "") + '">' + inner + "</section>"; }
  function headRow(title, link, linkText) { return '<div style="display:flex;justify-content:space-between;align-items:center;gap:10px"><span class="eyebrow">' + title + "</span>" + (link ? '<a href="' + link + '" class="muted" style="font-size:12px">' + linkText + "</a>" : "") + "</div>"; }

  function lotCalc() {
    return card(headRow("QUICK LOT SIZE", "#/lots", "Full calculator") +
      '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px"><label class="field">Balance<input class="input" id="qlBal" type="number" step="any" placeholder="10000" style="height:44px"></label><label class="field">Risk %<input class="input" id="qlRisk" type="number" step="0.1" value="1" style="height:44px"></label><label class="field">Stop (pips)<input class="input" id="qlSl" type="number" step="0.1" placeholder="20" style="height:44px"></label></div>' +
      '<div style="display:flex;justify-content:space-between;align-items:flex-end;gap:10px"><div><div class="hw-k">Lot size</div><div class="hw-v" id="qlOut" style="font-size:34px">0.00</div></div><div style="text-align:right"><div class="hw-k">Risking</div><div class="hw-v" id="qlCash" style="font-size:20px">$0.00</div></div></div>' +
      '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px" id="qlLadder"></div>' +
      '<div class="note" style="font-size:11px">For pairs that end in USD, like GBPUSD and EURUSD. Use the full calculator for gold, indices and other pairs.</div>');
  }
  function wireLot(el) {
    var b = $("#qlBal", el), r = $("#qlRisk", el), s = $("#qlSl", el); if (!b) return;
    try { b.value = localStorage.getItem("sdx-ql-bal") || ""; } catch (e) { }
    function go() {
      var bal = parseFloat(b.value), risk = parseFloat(r.value), sl = parseFloat(s.value);
      try { localStorage.setItem("sdx-ql-bal", b.value); } catch (e) { }
      if (!(bal > 0 && risk > 0 && sl > 0)) { $("#qlOut", el).textContent = "0.00"; $("#qlCash", el).textContent = "$0.00"; $("#qlLadder", el).innerHTML = [0.5, 1, 2].map(function (rp) { return '<div style="border-radius:10px;padding:8px 10px;background:#0b0b0c;box-shadow:inset 0 0 0 1px #1f2023"><div class="hw-k">' + rp + '% risk</div><div style="font:600 15px var(--sg)" class="muted">—</div></div>'; }).join(""); return; }
      var cash = bal * risk / 100, lots = cash / (sl * 10);
      $("#qlLadder", el).innerHTML = [0.5, 1, 2].map(function (rp) { var l = Math.floor(bal * rp / 100 / (sl * 10) * 100) / 100; return '<div style="border-radius:10px;padding:8px 10px;background:#0b0b0c;box-shadow:inset 0 0 0 1px ' + (rp === risk ? "var(--accent)" : "#1f2023") + '"><div class="hw-k">' + rp + '% risk</div><div style="font:600 15px var(--sg)">' + l.toFixed(2) + ' lots</div></div>'; }).join("");
      $("#qlOut", el).textContent = (Math.floor(lots * 100) / 100).toFixed(2); $("#qlCash", el).textContent = "$" + cash.toFixed(2);
    }
    [b, r, s].forEach(function (i) { i.oninput = go; }); go();
  }

  var FLAG = { USD: "US", GBP: "UK", EUR: "EU", JPY: "JP", AUD: "AU", NZD: "NZ", CAD: "CA", CHF: "CH", CNY: "CN" };
  async function loadNews(el) {
    var host = $("#hwNews", el); if (!host) return;
    host.innerHTML = card(headRow("TODAY'S NEWS", "#/calendar", "Full calendar") + '<div class="note">Loading…</div>');
    var ev = [];
    try {
      var r = await fetch(window.SDX_CONFIG.AUTH_URL + "/calendar"); var j = await r.json();
      var today = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London" }).format(new Date());
      ev = (j.events || []).filter(function (e) { var imp = String(e.impact || "").toLowerCase(); return (imp === "high" || imp === "medium") && new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London" }).format(new Date(e.date)) === today; })
        .map(function (e) { var d = new Date(e.date); return { t: d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/London" }), ms: d.getTime(), c: e.country, title: e.title, high: String(e.impact).toLowerCase() === "high", f: e.forecast || "", p: e.previous || "" }; })
        .sort(function (a, b) { return a.ms - b.ms; });
    } catch (e) { host.innerHTML = card(headRow("TODAY'S NEWS", "#/calendar", "Full calendar") + '<div class="note">News is not available right now.</div>'); return; }
    var now = Date.now(), next = ev.filter(function (e) { return e.ms > now; })[0];
    host.innerHTML = card(headRow("TODAY'S NEWS", "#/calendar", "Full calendar") +
      (next ? '<div style="border-radius:12px;padding:12px 14px;background:' + (next.high ? "rgba(255,138,138,.07);box-shadow:inset 0 0 0 1px rgba(255,138,138,.3)" : "#0b0b0c;box-shadow:inset 0 0 0 1px #1f2023") + '"><div class="hw-k">Next up · in ' + mins(next.ms - now) + '</div><div style="font:600 15px var(--sg);margin-top:4px">' + esc(next.c) + " " + esc(next.title) + "</div></div>" : "") +
      (ev.length ? '<div style="display:flex;flex-direction:column">' + ev.slice(0, 6).map(function (e) { var past = e.ms < now; return '<div style="display:flex;gap:12px;align-items:center;padding:9px 0;border-top:1px solid #18181a;' + (past ? "opacity:.45" : "") + '"><span style="font:600 13px var(--sg);width:44px">' + e.t + '</span><span style="width:8px;height:8px;border-radius:50%;flex:none;background:' + (e.high ? "#ff8a8a" : "#f2c56b") + '"></span><span class="mini" style="color:#e6e8eb">' + esc(e.c) + '</span><span style="font-size:13px;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(e.title) + "</span></div>"; }).join("") + "</div>"
        : '<div style="font:600 15px var(--sg)">No big news today.</div><div class="note" style="font-size:12px">No high or medium impact events. Still check the calendar before you trade.</div>'), "height:100%");
  }
  function mins(ms) { var m = Math.max(0, Math.round(ms / 6e4)); return (Math.floor(m / 60) ? Math.floor(m / 60) + "h " : "") + (m % 60) + "m"; }

  function spark(T) {
    var s = T.slice().sort(function (a, b) { return (a.trade_date || "") < (b.trade_date || "") ? -1 : 1; }), c = 0, pts = [0];
    s.forEach(function (t) { c += Number(t.r) || 0; pts.push(c); });
    if (pts.length < 3) return "";
    var lo = Math.min.apply(null, pts), hi = Math.max.apply(null, pts); if (hi === lo) hi = lo + 1;
    var W = 300, H = 60, xy = pts.map(function (v, i) { return [(i / (pts.length - 1)) * W, H - 4 - (v - lo) / (hi - lo) * (H - 8)]; });
    var d = xy.map(function (p, i) { return (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1); }).join(" ");
    var z = H - 4 - (0 - lo) / (hi - lo) * (H - 8);
    return '<div><div class="hw-k" style="margin-bottom:6px">Running R this month</div><svg viewBox="0 0 ' + W + " " + H + '" preserveAspectRatio="none" style="width:100%;height:60px;display:block"><defs><linearGradient id="hwg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="var(--accent)" stop-opacity=".35"/><stop offset="1" stop-color="var(--accent)" stop-opacity="0"/></linearGradient></defs><line x1="0" x2="' + W + '" y1="' + z.toFixed(1) + '" y2="' + z.toFixed(1) + '" stroke="#26272a" stroke-dasharray="3 4"/><path d="' + d + " L" + W + " " + H + " L0 " + H + ' Z" fill="url(#hwg)"/><path d="' + d + '" fill="none" stroke="var(--accent-hi)" stroke-width="2" vector-effect="non-scaling-stroke"/></svg></div>';
  }

  // ---- achievements
  var ICON = {
    trade: '<path d="M4 17l5-5 4 4 7-8"/><path d="M15 8h5v5"/>',
    fire: '<path d="M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-3 2-4 2-7 2 1 3 2 3 4"/>',
    check: '<path d="M5 12l4 4 10-10"/>',
    book: '<path d="M4 5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2z"/><path d="M8 7h6"/>',
    play: '<polygon points="8 5 19 12 8 19"/>',
    shield: '<path d="M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6z"/>',
    star: '<polygon points="12 3 15 9 21 9.5 16.5 14 18 20 12 17 6 20 7.5 14 3 9.5 9 9"/>',
    brain: '<circle cx="12" cy="12" r="8"/><path d="M12 4v16M4 12h16"/>',
    target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1"/>'
  };
  function badges(list) {
    var got = list.filter(function (b) { return b.ok; }).length, next = list.filter(function (b) { return !b.ok; })[0];
    return card(headRow("ACHIEVEMENTS", "", "") +
      '<div style="display:flex;justify-content:space-between;align-items:flex-end"><div style="font:700 30px var(--sg)">' + got + '<span class="muted" style="font-size:16px"> / ' + list.length + '</span></div><span class="muted" style="font-size:12px">unlocked</span></div>' +
      '<div style="display:flex;gap:16px;flex-wrap:wrap;align-items:center"><div style="flex:3 1 420px;display:grid;grid-template-columns:repeat(auto-fill,minmax(70px,1fr));gap:10px">' + list.map(function (b) {
        return '<div title="' + esc(b.name + ": " + b.how) + '" style="display:flex;flex-direction:column;align-items:center;gap:6px;text-align:center"><div style="width:48px;height:48px;border-radius:50%;display:flex;align-items:center;justify-content:center;' + (b.ok ? "background:var(--metal);box-shadow:0 4px 14px rgba(0,0,0,.4),inset 0 1px 0 rgba(255,255,255,.6)" : "background:#121214;box-shadow:inset 0 0 0 1px #24262a;opacity:.55") + '"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="' + (b.ok ? "var(--ink)" : "#6b7078") + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + ICON[b.icon] + '</svg></div><span style="font-size:10px;line-height:1.3;color:' + (b.ok ? "#e6e8eb" : "#6b7078") + '">' + esc(b.name) + "</span></div>";
      }).join("") + "</div>" +
      (next ? '<div style="flex:1 1 240px;border-radius:12px;padding:12px 14px;background:#0b0b0c;box-shadow:inset 0 0 0 1px #1f2023;display:flex;flex-direction:column;gap:6px"><div class="hw-k">Next to unlock</div><div style="font:600 14px var(--sg)">' + esc(next.name) + '</div><div class="note" style="font-size:12px">' + esc(next.how) + "</div>" + (next.p != null ? '<div class="hw-bar"><div style="width:' + Math.min(100, next.p) + '%"></div></div>' : "") + "</div>" : '<div style="flex:1 1 240px;font:600 14px var(--sg)">Every achievement unlocked. Proper work.</div>') + "</div>", "grid-column:1/-1");
  }
  function vidDone() { var e = window.SDX_PAGES && window.SDX_PAGES.eduStats ? window.SDX_PAGES.eduStats() : null; return e || { done: 0, total: 5 }; }

  async function freeMonth(el, view) {
    var host = $("#hwMonth", el);
    var r; try { r = await X().sb.from("signal_logs").select("*"); } catch (e) { r = { data: [] }; }
    var L = (r && r.data) || [], m = new Date().toISOString().slice(0, 7);
    var month = L.filter(function (x) { return (x.created_at || x.updated_at || "").slice(0, 7) === m; });
    var took = month.filter(function (x) { return x.took; }), pnl = took.reduce(function (a, x) { return a + (Number(x.pnl_amount) || 0); }, 0);
    var fr = month.length ? Math.round(took.length / month.length * 100) : 0;
    var act = L.map(function (x) { return x.created_at; }), stk = streak(act), days = last14(act);
    if (view === "home") {
      sumCard(el, "#hwSumProg", "MY PROGRESS", "Your numbers", "Signals taken, profit, streak and achievements.", "#/progress", '<span style="font:700 26px var(--sg)">' + fr + '%</span><span class="muted"> follow rate · </span><span class="' + (pnl > 0 ? "pos" : pnl < 0 ? "neg" : "") + '" style="font:600 16px var(--sg)">' + (pnl < 0 ? "-$" : "$") + Math.abs(pnl).toFixed(0) + "</span><span class=\"muted\"> this month</span>");
      return;
    }
    if (!host) return;
    host.outerHTML = card(headRow("MY MONTH", "#/tracker/mine", "Signal journal") +
      '<div style="display:flex;gap:18px;align-items:center"><div class="hw-ring" style="--p:' + fr + '"><div><div style="font:700 22px var(--sg)">' + fr + '%</div><div class="muted" style="font-size:10px">follow rate</div></div></div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;flex:1"><div><div class="hw-k">Signals taken</div><div class="hw-v">' + took.length + '</div></div><div><div class="hw-k">Profit</div><div class="hw-v ' + (pnl > 0 ? "pos" : pnl < 0 ? "neg" : "") + '">' + (pnl < 0 ? "-$" : "$") + Math.abs(pnl).toFixed(0) + '</div></div><div><div class="hw-k">Logging streak</div><div class="hw-v">' + stk + ' <span class="muted" style="font-size:12px">day' + (stk === 1 ? "" : "s") + '</span></div></div><div><div class="hw-k">Missed</div><div class="hw-v">' + (month.length - took.length) + "</div></div></div></div>" +
      '<div><div class="hw-k" style="margin-bottom:6px">Last 14 days</div><div class="hw-days">' + days.map(function (d) { return '<div class="' + (d[1] ? "on" : "") + '" title="' + d[0] + '">' + d[2] + "</div>"; }).join("") + "</div></div>" +
      (month.length ? "" : '<div class="note" style="font-size:12px">Tick the signals you take in your signal journal to see your own results here.</div>'), "height:100%");
    var tk = L.filter(function (x) { return x.took; }).length, v = vidDone(), lr = L.length ? Math.round(tk / L.length * 100) : 0;
    var aEl = $("#hwAch", el); if (aEl) aEl.outerHTML = badges([
      { name: "First video", icon: "play", ok: v.done >= 1, how: "Watch your first education video.", p: v.done ? 100 : 0 },
      { name: "First signal", icon: "trade", ok: L.length >= 1, how: "Log your first signal in your signal journal.", p: L.length ? 100 : 0 },
      { name: "3 day streak", icon: "fire", ok: stk >= 3, how: "Log signals 3 days in a row.", p: stk / 3 * 100 },
      { name: "All videos", icon: "book", ok: v.total && v.done >= v.total, how: "Finish every education video.", p: v.total ? v.done / v.total * 100 : 0 },
      { name: "10 signals", icon: "target", ok: L.length >= 10, how: "Log 10 signals.", p: L.length * 10 },
      { name: "7 day streak", icon: "fire", ok: stk >= 7, how: "Log signals 7 days in a row.", p: stk / 7 * 100 },
      { name: "Disciplined", icon: "shield", ok: L.length >= 10 && lr >= 80, how: "Take 80% or more of the signals over at least 10.", p: L.length >= 10 ? lr / 80 * 100 : L.length * 10 },
      { name: "In profit", icon: "star", ok: pnl > 0 && took.length >= 5, how: "Be in profit this month after at least 5 signals taken.", p: took.length / 5 * 100 }
    ]);
  }

  function sumCard(el, sel, eyebrow, title, sub, href, big, pct) {
    var host = $(sel, el); if (!host) return;
    host.innerHTML = '<a class="card pad hw-link" href="' + href + '" style="height:100%"><span class="eyebrow">' + eyebrow + '</span><div style="font:600 19px var(--sg)">' + esc(title) + '</div><div class="note" style="font-size:13px">' + esc(sub) + "</div>" + (big ? '<div style="margin-top:6px">' + big + "</div>" : "") + (pct != null ? '<div class="hw-bar"><div style="width:' + Math.max(0, Math.min(100, pct)) + '%"></div></div>' : "") + '<div class="go"><span>Open</span><span style="color:var(--accent)">&rarr;</span></div></a>';
  }

  async function homeWidgets(el, opts) {
    if (!el) return;
    opts = opts || {};
    var J = window.SDX_JOURNAL, elite = !!opts.elite, n = ukNow(), ses = nextSession();
    var name = opts.name ? String(opts.name).split(/\s+/)[0] : "";
    var line = LINES[Math.floor(Date.now() / 864e5) % LINES.length];
    var view = opts.view || "home";
    var greetCard = card('<div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start"><div><div class="muted" style="font-size:12px">' + esc(n.label) + '</div><div style="font:600 26px var(--sg);margin-top:4px">' + greet(n.hour) + (name ? ", " + esc(name) : "") + '.</div></div><span class="mini">' + hm(n.t) + " UK</span></div>" +
        '<div style="font-size:15px;line-height:1.6;color:#d6d8dc">' + esc(line) + "</div>" +
        '<div style="display:flex;align-items:center;gap:12px;border-radius:12px;padding:12px 14px;background:#0b0b0c;box-shadow:inset 0 0 0 1px ' + (ses.live ? "rgba(255,92,92,.45)" : "#1f2023") + '"><span style="width:10px;height:10px;border-radius:50%;flex:none;background:' + (ses.live ? "#ff5c5c;box-shadow:0 0 10px #ff5c5c" : "var(--accent)") + '"></span><div style="flex:1"><div style="font:600 14px var(--sg)">' + (ses.live ? esc(ses.name) + " is live" : "Next: " + esc(ses.name) + (ses.at ? " at " + ses.at : "")) + '</div><div class="muted" style="font-size:12px">' + esc(ses.text) + '</div></div><a class="btn ' + (ses.live ? "btn-metal" : "btn-ghost") + '" href="#/live" style="height:38px;font-size:12px">' + (ses.live ? "Join" : "Schedule") + "</a></div>" +
        '<div class="hw-acts">' + (elite ? [["Log a trade", "#/journal/trades"], ["Pre-session TA", "#/journal/t/presession"], ["AI review", "#/journal/ai"], ["Signal journal", "#/tracker/mine"]] : [["Signal journal", "#/tracker/mine"], ["Trade service", "#/service"], ["Lot sizing", "#/lots"], ["News calendar", "#/calendar"]]).map(function (a) { return '<a href="' + a[1] + '">' + a[0] + "<span>&rarr;</span></a>"; }).join("") + "</div>", "height:100%;grid-row:span 2");
    var html;
    if (view === "home") html = '<div class="hw-grid">' + greetCard +
      '<div id="hwSumPrep"></div><div id="hwSumProg"></div><div id="hwSumEdu"></div><div id="hwSumMore"></div></div>';
    else if (view === "prep") html = '<div class="hw-grid hw-two"><div id="hwChecklist"></div><div id="hwPlan"></div><div id="hwNews"></div>' + lotCalc() + "</div>";
    else html = '<div style="display:flex;flex-direction:column;gap:16px"><div class="hw-grid"><div id="hwMonth"></div><div id="hwCal" class="hw-span2"></div></div><div class="hw-grid hw-two"><div id="hwFunded"></div><div id="hwGoals"></div></div><div class="hw-grid"><div id="hwAch" class="hw-full"></div></div></div>';
    el.innerHTML = html;
    wireLot(el);
    loadNews(el);
    var eduP = (window.SDX_PAGES && window.SDX_PAGES.eduStats && !window.SDX_PAGES.eduStats() && window.SDX_PAGES.eduCard) ? window.SDX_PAGES.eduCard(document.createElement("div")) : Promise.resolve();
    if (view === "home") {
      sumCard(el, "#hwSumPrep", "DAILY PREP", elite ? "Get ready for today" : "Today's news & lot size", elite ? "Checklist, today's plan, news and lot size." : "What's on the news today and your lot size.", "#/prep", "Loading…");
      sumCard(el, "#hwSumProg", "MY PROGRESS", "Your numbers", elite ? "Win rate, R, P&L calendar, funded accounts and achievements." : "Signals taken, profit, streak and achievements.", "#/progress", "Loading…");
      eduP.then(function () { var v = vidDone(); sumCard(el, "#hwSumEdu", "EDUCATION", v.total && v.done >= v.total ? "All videos watched" : "Keep learning", v.total && v.done >= v.total ? "Every video done. Rewatch any time." : (v.total - v.done) + " video" + (v.total - v.done === 1 ? "" : "s") + " left to watch.", "#/education", '<span style="font:700 26px var(--sg)">' + v.done + '</span><span class="muted"> / ' + v.total + " watched</span>", v.total ? v.done / v.total * 100 : 0); });
      sumCard(el, "#hwSumMore", elite ? "JOURNAL" : "SIGNAL JOURNAL", elite ? "Your journal" : "Track the signals you take", elite ? "Plans, trades, backtests, reviews and your AI review." : "Tick each signal you take and see your own results.", elite ? "#/journal" : "#/tracker/mine");
    }
    if (!elite) { ["#hwChecklist", "#hwPlan", "#hwCal", "#hwFunded", "#hwGoals"].forEach(function (x) { var n2 = $(x, el); if (n2) n2.remove(); }); $$(".hw-two", el).forEach(function (g) { if (!g.children.length) g.remove(); }); if (view === "progress" && window.SDX_PAGES && window.SDX_PAGES.eduCard) { var eh = document.createElement("div"); eh.id = "hwEdu"; eh.className = "hw-span2"; var g1 = $(".hw-grid", el); if (g1) g1.appendChild(eh); window.SDX_PAGES.eduCard(eh).then(function () { var e = $("#hwEdu section", el); if (e) e.style.height = "100%"; }); } await eduP; freeMonth(el, view); return; }
    if (!J) return;
    var err = await J.load(); if (err) return;
    await J.loadTrades();
    var D = J.D, trades = D.trades || [];

    // ---- this month + streak
    var m = J.todayUK().slice(0, 7);
    var live = J.of("t:live").map(function (x) { return { date: x.data.date, r: parseFloat(x.data.r), pnl: J.num(x.data.pnl) }; });
    var monthT = trades.filter(function (t) { return (t.trade_date || "").slice(0, 7) === m; });
    var w = monthT.filter(function (t) { return t.result === "Win"; }).length, R = monthT.reduce(function (a, t) { return a + (Number(t.r) || 0); }, 0);
    var activity = trades.map(function (t) { return t.trade_date; }).concat(live.map(function (x) { return x.date; })).concat(J.of("t:presession").map(function (x) { return x.data.date; })).concat(D.items.filter(function (i) { return /^(rv:|t:|fday|shot)/.test(i.kind); }).map(function (i) { return (i.updated_at || i.created_at || "").slice(0, 10); }));
    var stk = streak(activity), days = last14(activity);
    var mEl = $("#hwMonth", el);
    if (mEl) mEl.outerHTML = card(headRow("MY MONTH", "#/journal/ai", "AI review") +
      '<div style="display:flex;gap:18px;align-items:center"><div class="hw-ring" style="--p:' + (monthT.length ? Math.round(w / monthT.length * 100) : 0) + '"><div><div style="font:700 22px var(--sg)">' + (monthT.length ? Math.round(w / monthT.length * 100) : 0) + '%</div><div class="muted" style="font-size:10px">win rate</div></div></div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;flex:1"><div><div class="hw-k">Trades</div><div class="hw-v">' + monthT.length + '</div></div><div><div class="hw-k">Total R</div><div class="hw-v ' + (R > 0 ? "pos" : R < 0 ? "neg" : "") + '">' + (R > 0 ? "+" : "") + R.toFixed(1) + 'R</div></div><div><div class="hw-k">Journal streak</div><div class="hw-v">' + stk + ' <span class="muted" style="font-size:12px">day' + (stk === 1 ? "" : "s") + '</span></div></div><div><div class="hw-k">Wins / losses</div><div class="hw-v" style="font-size:18px">' + w + " / " + monthT.filter(function (t) { return t.result === "Loss"; }).length + "</div></div></div></div>" +
      spark(monthT) +
      '<div><div class="hw-k" style="margin-bottom:6px">Last 14 days</div><div class="hw-days">' + days.map(function (d) { return '<div class="' + (d[1] ? "on" : "") + '" title="' + d[0] + '">' + d[2] + "</div>"; }).join("") + "</div></div>" +
      (stk === 0 ? '<div class="note" style="font-size:12px">Log something today to start your streak.</div>' : ""), "height:100%");


    if (view === "home") {
      var ck0 = J.docBy("checklist"), ci = 0, cd = 0; (ck0 ? ck0.data.blocks : []).forEach(function (b) { if (b.type === "check") b.items.forEach(function (x) { ci++; if (x.d) cd++; }); });
      var tp = J.of("t:presession").filter(function (x) { return x.data.date === J.todayUK(); }).length;
      sumCard(el, "#hwSumPrep", "DAILY PREP", ci && cd === ci ? "Ready to trade" : "Get ready for today", "Checklist, today's plan, news and lot size.", "#/prep", ci ? '<span style="font:700 26px var(--sg)">' + cd + '</span><span class="muted"> / ' + ci + " checklist ticked · " + tp + " pair" + (tp === 1 ? "" : "s") + " planned</span>" : '<span class="muted">Set up your checklist</span>', ci ? cd / ci * 100 : 0);
      sumCard(el, "#hwSumProg", "MY PROGRESS", "Your numbers", "Win rate, R, P&L calendar, funded accounts and achievements.", "#/progress", '<span style="font:700 26px var(--sg)">' + (monthT.length ? Math.round(w / monthT.length * 100) : 0) + '%</span><span class="muted"> win rate · </span><span class="' + (R > 0 ? "pos" : R < 0 ? "neg" : "") + '" style="font:600 16px var(--sg)">' + (R > 0 ? "+" : "") + R.toFixed(1) + 'R</span><span class="muted"> this month</span>');
    }
    // ---- risk guard: warn after a rough day, praise after a good one
    var today = J.todayUK(), tT = trades.filter(function (t) { return t.trade_date === today; }), tR = tT.reduce(function (a, t) { return a + (Number(t.r) || 0); }, 0), tL = tT.filter(function (t) { return t.result === "Loss"; }).length;
    if (view === "home" && tT.length && (tL >= 2 || tR <= -2 || tR >= 3)) {
      var good = tR >= 3 && tL < 2, g = document.createElement("section");
      g.className = "card hw-guard"; g.style.cssText = "grid-column:1/-1;display:flex;align-items:center;gap:16px;flex-wrap:wrap;padding:16px 20px;box-shadow:inset 0 0 0 1px " + (good ? "rgba(127,217,154,.4)" : "rgba(255,138,138,.45)") + ";background:linear-gradient(160deg," + (good ? "rgba(127,217,154,.08)" : "rgba(255,138,138,.08)") + " 0%,#111113 70%)";
      g.innerHTML = '<div style="width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex:none;background:' + (good ? "rgba(127,217,154,.15)" : "rgba(255,138,138,.15)") + '"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="' + (good ? "#7fd99a" : "#ff8a8a") + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + (good ? '<path d="M5 12l4 4 10-10"/>' : '<path d="M12 3l9 16H3z"/><path d="M12 10v4M12 17h.01"/>') + '</svg></div><div style="flex:1;min-width:220px"><div style="font:600 16px var(--sg)">' + (good ? "Great day. " + (tR > 0 ? "+" : "") + tR.toFixed(1) + "R banked." : "Today: " + tL + " loss" + (tL === 1 ? "" : "es") + ", " + (tR > 0 ? "+" : "") + tR.toFixed(1) + "R from " + tT.length + " trade" + (tT.length === 1 ? "" : "s") + ".") + '</div><div class="note" style="font-size:13px">' + (good ? "Protect it. The best traders know when they're done for the day." : "Step away from the charts. Check your risk plan and come back fresh tomorrow.") + "</div></div>" + '<a class="btn btn-ghost" href="' + (good ? "#/journal/trades" : (J.docBy("risk") ? "#/journal/d/" + J.docBy("risk").id : "#/journal")) + '" style="height:40px">' + (good ? "Journal it" : "Risk plan") + "</a>";
      var grid = $(".hw-grid", el); if (grid) grid.insertBefore(g, grid.firstChild);
    }

    // ---- P&L calendar
    var CAL = { off: 0 };
    function drawCal() {
      var host = $("#hwCal", el); if (!host) return;
      var base = new Date(); base.setDate(1); base.setMonth(base.getMonth() + CAL.off);
      var y = base.getFullYear(), mo = base.getMonth(), key = y + "-" + (mo < 9 ? "0" : "") + (mo + 1);
      var byDay = {};
      trades.forEach(function (t) { if ((t.trade_date || "").slice(0, 7) === key) { var d = byDay[t.trade_date] || (byDay[t.trade_date] = { r: 0, n: 0 }); d.r += Number(t.r) || 0; d.n++; } });
      J.of("t:live").forEach(function (x) { var dd = x.data.date || ""; if (dd.slice(0, 7) === key && x.data.r != null && x.data.r !== "") { var d = byDay[dd] || (byDay[dd] = { r: 0, n: 0 }); d.r += Number(x.data.r) || 0; d.n++; } });
      var first = (new Date(y, mo, 1).getDay() + 6) % 7, dim = new Date(y, mo + 1, 0).getDate(), cells = [];
      for (var i = 0; i < first; i++) cells.push(null);
      for (var dd2 = 1; dd2 <= dim; dd2++) cells.push(dd2);
      var vals = Object.keys(byDay).map(function (k) { return Math.abs(byDay[k].r); }), mx = Math.max.apply(null, vals.concat([1]));
      var tot = Object.keys(byDay).reduce(function (a, k) { return a + byDay[k].r; }, 0), gd = Object.keys(byDay).filter(function (k) { return byDay[k].r > 0; }).length, rd = Object.keys(byDay).filter(function (k) { return byDay[k].r < 0; }).length;
      var today = J.todayUK();
      host.innerHTML = card('<div style="display:flex;justify-content:space-between;align-items:center;gap:10px"><span class="eyebrow">P&amp;L CALENDAR</span><div style="display:flex;align-items:center;gap:8px"><button class="chip" data-cal="-1" style="min-height:30px;padding:0 10px">&larr;</button><span style="font:600 13px var(--sg);min-width:110px;text-align:center">' + base.toLocaleDateString("en-GB", { month: "long", year: "numeric" }) + '</span><button class="chip" data-cal="1" style="min-height:30px;padding:0 10px"' + (CAL.off >= 0 ? " disabled" : "") + ">&rarr;</button></div></div>" +
        '<div style="display:flex;gap:18px;flex-wrap:wrap;font-size:12px" class="muted"><span>Month: <b class="' + (tot > 0 ? "pos" : tot < 0 ? "neg" : "") + '">' + (tot > 0 ? "+" : "") + tot.toFixed(1) + "R</b></span><span>Green days: <b style=\"color:#7fd99a\">" + gd + '</b></span><span>Red days: <b style="color:#ff8a8a">' + rd + "</b></span></div>" +
        '<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:6px">' + ["M", "T", "W", "T", "F", "S", "S"].map(function (d) { return '<div class="muted" style="font-size:10px;text-align:center">' + d + "</div>"; }).join("") +
        cells.map(function (d) {
          if (!d) return "<div></div>";
          var k = key + "-" + (d < 10 ? "0" : "") + d, v = byDay[k], a = v ? Math.min(1, Math.abs(v.r) / mx) : 0;
          var bg = v ? (v.r > 0 ? "rgba(127,217,154," + (0.12 + a * 0.45) + ")" : v.r < 0 ? "rgba(255,138,138," + (0.12 + a * 0.45) + ")" : "#1c1c1f") : "#101012";
          return '<a href="#/journal/trades" title="' + k + (v ? ": " + v.n + " trades, " + v.r.toFixed(1) + "R" : "") + '" style="min-height:52px;border-radius:8px;padding:6px 7px;display:flex;flex-direction:column;justify-content:space-between;background:' + bg + ";box-shadow:inset 0 0 0 1px " + (k === today ? "var(--accent)" : "#1a1a1c") + ';color:#e6e8eb"><span style="font-size:10px;color:' + (v ? "#e6e8eb" : "#55595f") + '">' + d + "</span>" + (v ? '<span style="font:700 12px var(--sg)">' + (v.r > 0 ? "+" : "") + (Math.round(v.r * 10) / 10) + "R</span>" : "") + "</a>";
        }).join("") + "</div>", "height:100%");
      $$("[data-cal]", host).forEach(function (b) { b.onclick = function () { CAL.off = Math.min(0, CAL.off + +b.dataset.cal); drawCal(); }; });
    }
    drawCal();

    // ---- today's plan (quick pre-session TA)
    function drawPlan() {
      var host = $("#hwPlan", el); if (!host) return;
      var todays = J.of("t:presession").filter(function (x) { return x.data.date === J.todayUK(); });
      host.innerHTML = card(headRow("TODAY'S PLAN", "#/journal/t/presession", "All analysis") +
        (todays.length ? '<div style="display:flex;flex-direction:column;gap:8px">' + todays.map(function (x) { var b = x.data.bias || ""; return '<div style="display:flex;gap:10px;align-items:center;padding:10px 12px;border-radius:10px;background:#0b0b0c;box-shadow:inset 0 0 0 1px #1f2023"><span style="font:700 14px var(--sg);min-width:70px">' + esc(x.data.pair || "") + '</span><span class="tag" style="background:' + (b === "Bullish" ? "rgba(127,217,154,.14);color:#7fd99a" : b === "Bearish" ? "rgba(255,138,138,.14);color:#ff8a8a" : "#1c1c1e;color:#a3a7ae") + '">' + esc((b || "NO BIAS").toUpperCase()) + '</span><span class="note" style="font-size:12px;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(x.data.plan || x.data.draw || "") + "</span></div>"; }).join("") + "</div>" : '<div class="note" style="font-size:13px">Mark your bias before the session. It takes 30 seconds.</div>') +
        '<div style="display:flex;flex-direction:column;gap:8px;margin-top:auto"><input class="input" id="hpPair" placeholder="Pair, e.g. GBPUSD" style="height:42px"><div class="chips" id="hpBias"><button class="chip" data-b="Bullish">Bullish</button><button class="chip" data-b="Bearish">Bearish</button><button class="chip" data-b="No bias">No bias</button></div><input class="input" id="hpNote" placeholder="Plan or draw on liquidity (optional)" style="height:42px"><button class="btn btn-metal" id="hpAdd" style="height:42px">Add to today\'s plan</button><span class="muted" id="hpMsg" style="font-size:11px"></span></div>', "height:100%");
      var bias = "";
      $$("#hpBias .chip", host).forEach(function (c) { c.onclick = function () { bias = c.dataset.b; $$("#hpBias .chip", host).forEach(function (x) { x.classList.toggle("on", x === c); }); }; });
      $("#hpAdd", host).onclick = async function () {
        var pair = $("#hpPair", host).value.trim().toUpperCase(); if (!pair) { $("#hpMsg", host).textContent = "Add the pair first."; return; }
        try { await J.add("t:presession", { date: J.todayUK(), pair: pair, bias: bias || "No bias", plan: $("#hpNote", host).value.trim(), outcome: "" }); drawPlan(); }
        catch (e) { $("#hpMsg", host).textContent = "Couldn't save: " + (e.message || e); }
      };
    }
    drawPlan();

    // ---- today's checklist (their Check list page)
    var ck = J.docBy("checklist"), cEl = $("#hwChecklist", el);
    function drawCheck() {
      var items = []; (ck ? ck.data.blocks : []).forEach(function (b, bi) { if (b.type === "check") b.items.forEach(function (it, k) { items.push([bi, k, it, b.name]); }); });
      var done = items.filter(function (x) { return x[2].d; }).length;
      var host = $("#hwChecklist", el); if (!host) return;
      host.innerHTML = card(headRow("PRE-TRADE CHECKLIST", ck ? "#/journal/d/" + ck.id : "#/journal", "Edit") +
        (items.length ? '<div style="display:flex;justify-content:space-between;align-items:center"><span style="font:600 15px var(--sg)">' + (done === items.length ? "All ticked. You're ready." : done + " of " + items.length + " ticked") + '</span>' + (done ? '<button class="chip" id="hwClear" style="min-height:30px">Clear</button>' : "") + '</div><div class="hw-bar"><div style="width:' + Math.round(done / items.length * 100) + '%"></div></div>' +
          '<div style="max-height:220px;overflow:auto;display:flex;flex-direction:column">' + items.map(function (x) { return '<label class="hw-check" style="' + (x[2].d ? "color:#6b7078;text-decoration:line-through" : "") + '"><input type="checkbox" data-hk="' + x[0] + ":" + x[1] + '"' + (x[2].d ? " checked" : "") + ">" + esc(x[2].t) + ' <span class="muted" style="font-size:10px;margin-left:auto">' + esc(x[3]) + "</span></label>"; }).join("") + "</div>"
          : '<div class="note">Your checklist is empty. Add the things you check before every trade and tick them off here each day.</div><a class="btn btn-metal" href="' + (ck ? "#/journal/d/" + ck.id : "#/journal") + '" style="align-self:flex-start;height:40px">Set up checklist</a>'), "height:100%");
      $$("[data-hk]", host).forEach(function (c) { c.onchange = async function () { var p = c.dataset.hk.split(":"); ck.data.blocks[+p[0]].items[+p[1]].d = c.checked; drawCheck(); try { await J.save(ck); } catch (e) { } }; });
      var cl = $("#hwClear", host); if (cl) cl.onclick = async function () { ck.data.blocks.forEach(function (b) { if (b.type === "check") b.items.forEach(function (x) { x.d = false; }); }); drawCheck(); try { await J.save(ck); } catch (e) { } };
    }
    if (cEl) drawCheck();

    // ---- funded accounts
    var A = J.of("facc"), fEl = $("#hwFunded", el);
    if (fEl) fEl.outerHTML = card(headRow("FUNDED ACCOUNTS", "#/journal/funded", "Open") +
      (A.length ? A.slice(0, 4).map(function (a) {
        var mm = J.accMetrics(a), d = a.data, ml = J.num(d.maxLoss), safe = ml ? Math.max(0, Math.min(100, (mm.buffer || 0) / ml * 100)) : null;
        return '<div style="display:flex;flex-direction:column;gap:6px;padding:10px 0;border-top:1px solid #18181a"><div style="display:flex;justify-content:space-between;gap:10px"><span style="font:600 14px var(--sg)">' + esc(d.name || "Account") + ' <span class="mini">' + esc((d.phase || "").toUpperCase()) + '</span></span><span style="font:600 14px var(--sg)" class="' + (mm.pnl > 0 ? "pos" : mm.pnl < 0 ? "neg" : "") + '">' + (mm.pnl >= 0 ? "+" : "") + J.money(mm.pnl) + "</span></div>" +
          (mm.target != null ? '<div style="display:flex;justify-content:space-between;font-size:11px" class="muted"><span>Target</span><span>' + (mm.left === 0 ? "Hit" : J.money(mm.left) + " left") + '</span></div><div class="hw-bar"><div style="width:' + (mm.pct || 0) + '%"></div></div>' : "") +
          (safe != null ? '<div style="display:flex;justify-content:space-between;font-size:11px" class="muted"><span>Room before max loss</span><span style="color:' + (safe < 30 ? "#ff8a8a" : "#7fd99a") + '">' + J.money(mm.buffer) + '</span></div><div class="hw-bar"><div style="width:' + safe + "%;background:" + (safe < 30 ? "#ff8a8a" : "#7fd99a") + '"></div></div>' : "") + "</div>";
      }).join("") : '<div class="note">Add your prop firm accounts to see how close you are to passing and how much room you have before max loss.</div><a class="btn btn-ghost" href="#/journal/funded" style="align-self:flex-start;height:40px">Add account</a>'), "height:100%");

    // ---- goals
    var gEl = $("#hwGoals", el), gd = [J.docBy("goalsyear"), J.docBy("goals")].filter(Boolean), tot = 0, dn = 0, top = [];
    gd.forEach(function (g) { g.data.blocks.forEach(function (b) { if (b.type === "check") b.items.forEach(function (x) { tot++; if (x.d) dn++; else if (top.length < 4) top.push(x.t); }); }); });
    if (gEl) gEl.outerHTML = card(headRow("GOALS", gd[0] ? "#/journal/d/" + gd[0].id : "#/journal", "Open") +
      (tot ? '<div style="display:flex;justify-content:space-between;align-items:flex-end"><div style="font:700 30px var(--sg)">' + dn + '<span class="muted" style="font-size:16px"> / ' + tot + '</span></div><span class="muted" style="font-size:12px">goals hit</span></div><div class="hw-bar"><div style="width:' + Math.round(dn / tot * 100) + '%"></div></div>' + (top.length ? '<div style="display:flex;flex-direction:column;gap:6px">' + top.map(function (t) { return '<div style="font-size:13px;color:#d6d8dc;display:flex;gap:8px"><span class="metal-text">●</span>' + esc(t) + "</div>"; }).join("") + "</div>" : "")
        : '<div class="note">Write down what you want to achieve this year. Tick them off as you hit them.</div><a class="btn btn-ghost" href="' + (gd[0] ? "#/journal/d/" + gd[0].id : "#/journal") + '" style="align-self:flex-start;height:40px">Set goals</a>'));

    await eduP;
    var allT = trades.length + J.of("t:live").length + J.of("t:futures").length, ckItems = 0; (ck ? ck.data.blocks : []).forEach(function (b) { if (b.type === "check") ckItems += b.items.length; });
    var planOk = J.of("plan").some(function (p) { return (p.data.blocks || []).some(function (b) { return (b.type === "check" || b.type === "list") && b.items.length >= 3; }); });
    var v2 = vidDone(), passed = A.some(function (a) { return a.data.phase === "Funded"; }), rv = J.of("rv:weekly").length + J.of("rv:monthly").length, ai = J.of("aireview").length + J.of("pagereview").length;
    var aEl2 = $("#hwAch", el); if (aEl2) aEl2.outerHTML = badges([
      { name: "First trade", icon: "trade", ok: allT >= 1, how: "Log your first trade in your journal.", p: allT ? 100 : 0 },
      { name: "Plan written", icon: "book", ok: planOk, how: "Write at least 3 rules in one of your entry model plans.", p: planOk ? 100 : 0 },
      { name: "Checklist set", icon: "check", ok: ckItems >= 5, how: "Add 5 or more items to your pre-trade checklist.", p: ckItems / 5 * 100 },
      { name: "3 day streak", icon: "fire", ok: stk >= 3, how: "Use your journal 3 days in a row.", p: stk / 3 * 100 },
      { name: "All videos", icon: "play", ok: v2.total && v2.done >= v2.total, how: "Finish every education video.", p: v2.total ? v2.done / v2.total * 100 : 0 },
      { name: "First review", icon: "target", ok: rv >= 1, how: "Fill in your first weekly or monthly review.", p: rv ? 100 : 0 },
      { name: "AI reviewed", icon: "brain", ok: ai >= 1, how: "Get the AI coach to review your data.", p: ai ? 100 : 0 },
      { name: "50 trades", icon: "trade", ok: allT >= 50, how: "Log 50 trades. Enough data to trust your numbers.", p: allT / 50 * 100 },
      { name: "7 day streak", icon: "fire", ok: stk >= 7, how: "Use your journal 7 days in a row.", p: stk / 7 * 100 },
      { name: "Funded", icon: "star", ok: passed, how: "Pass an evaluation. Mark an account as Funded.", p: passed ? 100 : A.length ? 50 : 0 }
    ]);
  }

  function pageHead(eyebrow, title, sub) { return '<section class="hero" style="min-height:170px"><div class="eyebrow">' + eyebrow + "</div><h1>" + title + '</h1><div style="font-size:14px;color:#2a2c30">' + sub + "</div></section>"; }
  window.SDX_PREP = function (page, opts) { page.innerHTML = pageHead("SD TRADING EDUCATION", "Daily prep.", opts && opts.elite ? "Everything to tick off before you take a trade." : "Today's news and your lot size before you trade.") + '<div id="hwBody"></div>'; homeWidgets(page.querySelector("#hwBody"), Object.assign({}, opts, { view: "prep" })); };
  window.SDX_PROGRESS = function (page, opts) { page.innerHTML = pageHead("SD TRADING EDUCATION", "My progress.", opts && opts.elite ? "Your results, your accounts and what you've unlocked." : "Your signal results and what you've unlocked.") + '<div id="hwBody"></div>'; homeWidgets(page.querySelector("#hwBody"), Object.assign({}, opts, { view: "progress" })); };
  window.SDX_HOME = homeWidgets;
})();
