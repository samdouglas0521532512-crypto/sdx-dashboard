/* SDX Members Dashboard */
(function () {
  "use strict";
  var C = window.SDX_CONFIG;
  var sb = window.supabase.createClient(C.SUPABASE_URL, C.SUPABASE_ANON_KEY);
  var app = document.getElementById("app");
  var state = { session: null, member: null, messages: [], channel: null, period: "month", clock: null };

  // ---------- results from the SDX Trade Tracker sheet ----------
  var TRADES = [
    ["October 2026", "GER30", "Win", "1:2", "1.0%", "+2.0R"],
    ["October 2026", "GER30", "Loss", "1:3", "1.5%", "-1.0R"],
    ["October 2026", "XAUUSD", "BE", "1:3", "1.0%", "0R"],
    ["October 2026", "XAUUSD", "Win", "1:7.2", "0.25%", "+7.2R"],
    ["October 2026", "XAUUSD", "Win", "1:2", "1.0%", "+2.0R"],
    ["October 2026", "GER30", "Win", "1:5.7", "1.0%", "+5.7R"],
    ["November 2026", "XAUUSD", "Loss", "1:2.3", "1.0%", "-1.0R"],
    ["November 2026", "XAUUSD", "Win", "1:1.5", "1.0%", "+1.5R"],
    ["November 2026", "XAUUSD", "BE", "1:1.5", "1.0%", "0R"]
  ];
  var MONTHS = [
    ["October 2026", 6, 4, 1, 1, "66.7%", "+10.0%", "+15.9R"],
    ["November 2026", 3, 1, 1, 1, "33.3%", "+0.5%", "+0.5R"]
  ];
  var TOTAL = ["Total", 9, 5, 2, 2, "55.6%", "+10.5%", "+16.4R"];
  var PERIODS = {
    today: ["0", "0", "0", "0", "0%", "0R"],
    week: ["0", "0", "0", "0", "0%", "0R"],
    month: ["3", "1", "1", "1", "33.3%", "+0.5R"],
    all: ["9", "5", "2", "2", "55.6%", "+16.4R"]
  };

  // ---------- helpers ----------
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  var ALLOWED = { B: 1, STRONG: 1, I: 1, EM: 1, U: 1, S: 1, CODE: 1, PRE: 1, A: 1, BR: 1 };
  function safeHtml(html) {
    var tpl = document.createElement("template");
    tpl.innerHTML = html || "";
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 1) {
          if (!ALLOWED[n.tagName]) { n.replaceWith(document.createTextNode(n.textContent)); return; }
          Array.prototype.slice.call(n.attributes).forEach(function (a) {
            if (!(n.tagName === "A" && a.name === "href" && /^https?:\/\//i.test(a.value))) n.removeAttribute(a.name);
          });
          if (n.tagName === "A") { n.setAttribute("target", "_blank"); n.setAttribute("rel", "noopener"); }
          walk(n);
        }
      });
    })(tpl.content);
    return tpl.innerHTML;
  }
  var ICON = {
    dashboard: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>',
    service: '<path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4z"/>',
    tracker: '<polyline points="3 17 9 11 13 15 21 7"/><polyline points="15 7 21 7 21 13"/>',
    breakdowns: '<rect x="3" y="5" width="18" height="14" rx="2"/><polygon points="10 9 15 12 10 15"/>',
    journal: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/>',
    calendar: '<rect x="3" y="4" width="18" height="17" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="16" y1="2" x2="16" y2="6"/>',
    lots: '<rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="11" x2="16" y2="11"/><line x1="8" y1="15" x2="16" y2="15"/>',
    socials: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.6" y1="13.5" x2="15.4" y2="17.5"/><line x1="15.4" y1="6.5" x2="8.6" y2="10.5"/>',
    brokers: '<path d="M3 21h18"/><path d="M5 21V10l7-5 7 5v11"/><line x1="9" y1="21" x2="9" y2="14"/><line x1="15" y1="21" x2="15" y2="14"/>',
    edu: '<path d="M22 10L12 5 2 10l10 5 10-5z"/><path d="M6 12v5c3 2 9 2 12 0v-5"/>'
  };
  function svg(name) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + ICON[name] + "</svg>"; }
  var NAV = [
    ["WORKSPACE", [["dashboard", "Dashboard", "dashboard"], ["service", "Trade Service", "service"], ["tracker", "Trade Tracker", "tracker"], ["breakdowns", "Trade Breakdowns", "breakdowns", 1], ["journal", "Journal", "journal", 1]]],
    ["TOOLKIT", [["calendar", "Calendar", "calendar", 1], ["lots", "Lot Sizing", "lots", 1], ["socials", "Socials", "socials", 1]]],
    ["PARTNERS", [["brokers", "Brokers", "brokers", 1], ["edu", "Educational Platform", "edu", 0, C.ELITE_PACK_URL]]]
  ];
  function brand() {
    return '<div class="brand-row"><img src="assets/sd-mark.png" alt="SD"><span class="sep"></span><span class="word">TRADING<br>EDUCATION</span></div>';
  }
  function route() { return (location.hash.replace(/^#\/?/, "") || "dashboard").split("/")[0]; }

  // ---------- auth ----------
  function renderLogin(msg) {
    app.innerHTML =
      '<div class="center-screen"><div class="login">' + brand() +
      '<div class="login-card"><div class="eyebrow">MEMBERS DASHBOARD</div>' +
      '<h1>Sign <span class="metal-text">in.</span></h1>' +
      '<div class="note">Use the email you bought the Elite Pack with. We will email you a link to sign in. No password needed.</div>' +
      '<form id="loginForm" style="display:flex;flex-direction:column;gap:12px">' +
      '<label class="field">Email<input class="input" id="email" type="email" required autocomplete="email" placeholder="you@email.com"></label>' +
      '<button class="btn btn-metal" type="submit">Email me a sign-in link</button></form>' +
      '<div class="note" id="loginMsg">' + (msg ? esc(msg) : "") + "</div></div></div></div>";
    document.getElementById("loginForm").addEventListener("submit", async function (e) {
      e.preventDefault();
      var email = document.getElementById("email").value.trim();
      var out = document.getElementById("loginMsg");
      out.textContent = "Sending…";
      var res = await sb.auth.signInWithOtp({ email: email, options: { emailRedirectTo: location.origin + location.pathname } });
      out.textContent = res.error ? "Could not send the link: " + res.error.message : "Check your inbox for the sign-in link. It can take a minute.";
    });
  }
  function renderNoAccess() {
    app.innerHTML =
      '<div class="center-screen"><div class="login">' + brand() +
      '<div class="login-card"><div class="eyebrow">ELITE PACK MEMBERS ONLY</div>' +
      '<h1>No access <span class="metal-text">yet.</span></h1>' +
      '<div class="note">' + esc(state.session.user.email) + " is not on the Elite Pack list. If you have just bought it, give it a few minutes and try again.</div>" +
      '<a class="btn btn-metal" href="' + esc(C.ELITE_PACK_URL) + '" target="_blank" rel="noopener">Get the Elite Pack</a>' +
      '<button class="btn btn-ghost" id="signOut">Use a different email</button></div></div></div>';
    document.getElementById("signOut").onclick = function () { sb.auth.signOut(); };
  }
  async function loadMember() {
    var r = await sb.from("members").select("email,name,plan,active").maybeSingle();
    state.member = r.data && r.data.active ? r.data : null;
  }

  // ---------- shell ----------
  function renderShell() {
    var cur = route();
    var nav = NAV.map(function (g) {
      return '<div class="group"><div class="label">' + g[0] + "</div>" + g[1].map(function (n) {
        var ext = n[4];
        var href = ext ? ext : "#/" + n[0];
        return '<a class="nav' + (cur === n[0] ? " active" : "") + (n[3] ? " soon" : "") + '" href="' + esc(href) + '"' + (ext ? ' target="_blank" rel="noopener"' : "") + ">" + svg(n[2]) + esc(n[1]) + "</a>";
      }).join("") + "</div>";
    }).join("");
    var nm = state.member.name || state.session.user.email.split("@")[0];
    var initials = nm.split(/\s+/).map(function (w) { return w[0]; }).join("").slice(0, 2).toUpperCase();
    var titles = { dashboard: "Dashboard", service: "Trade Service", tracker: "Trade Tracker" };
    app.innerHTML =
      '<div class="shell"><nav class="side" aria-label="Main menu">' + brand() + nav +
      '<div class="me"><div class="avatar">' + esc(initials) + '</div><div><div class="name">' + esc(nm) + '</div><div class="plan">' + esc(state.member.plan || "Elite Pack") + '</div></div><button id="out">Sign out</button></div></nav>' +
      '<main class="main"><div class="topbar"><span>' + esc(titles[cur] || "Coming soon") + '</span><span class="live-dot">LIVE</span></div><div id="page" style="display:flex;flex-direction:column;gap:26px"></div></main></div>';
    document.getElementById("out").onclick = function () { sb.auth.signOut(); };
    var page = document.getElementById("page");
    if (cur === "dashboard") renderDashboard(page);
    else if (cur === "service") renderService(page);
    else if (cur === "tracker") renderTracker(page);
    else page.innerHTML = '<div class="soon-page"><div class="eyebrow">COMING SOON</div><div class="title">On its <span class="metal-text">way.</span></div><div class="note">This section is being built.</div></div>';
  }

  // ---------- trade feed data ----------
  async function loadMessages() {
    var r = await sb.from("messages").select("*").order("sent_at", { ascending: true }).limit(1000);
    state.messages = r.data || [];
  }
  function subscribe() {
    if (state.channel) return;
    state.channel = sb.channel("feed").on("postgres_changes", { event: "*", schema: "public", table: "messages" }, function (p) {
      if (p.eventType === "DELETE") {
        state.messages = state.messages.filter(function (m) { return m.id !== p.old.id; });
      } else {
        var i = state.messages.findIndex(function (m) { return m.id === p.new.id; });
        if (i >= 0) state.messages[i] = p.new; else state.messages.push(p.new);
        state.messages.sort(function (a, b) { return a.sent_at < b.sent_at ? -1 : 1; });
      }
      var cur = route();
      if (cur === "service" || cur === "dashboard") renderShell();
    }).subscribe();
  }
  function runningTrade() {
    var byId = {};
    state.messages.forEach(function (m) { byId[m.message_id] = m; });
    for (var i = state.messages.length - 1; i >= 0; i--) {
      var m = state.messages[i];
      if (m.kind !== "signal") continue;
      var closed = state.messages.some(function (x) { return x.reply_to === m.message_id && (x.kind === "win" || x.kind === "loss" || x.kind === "be"); });
      var later = state.messages.some(function (x) { return x.kind === "signal" && x.sent_at > m.sent_at; });
      if (!closed && !later && (Date.now() - new Date(m.sent_at).getTime()) < 2 * 86400000) return m;
      return null;
    }
    return null;
  }
  function plainFirstLine(m) { return (m.plain || "").split("\n").filter(Boolean).slice(0, 2).join(" · ") || (m.photo_url ? "Chart" : ""); }

  // ---------- pages ----------
  function renderDashboard(page) {
    var d = PERIODS[state.period];
    var pc = d[5].charAt(0) === "-" ? "neg" : d[5] === "0R" ? "" : "pos";
    var tabs = [["today", "Today"], ["week", "This week"], ["month", "This month"], ["all", "All time"]].map(function (p) {
      return '<button class="tab' + (p[0] === state.period ? " on" : "") + '" data-p="' + p[0] + '">' + p[1] + "</button>";
    }).join("");
    var run = runningTrade();
    page.innerHTML =
      '<section class="hero"><img class="mark" src="assets/sd-mark.png" alt="" aria-hidden="true"><div class="eyebrow">SD TRADING EDUCATION</div><h1>Members dashboard.</h1></section>' +
      '<section class="card pad" style="display:flex;flex-direction:column;gap:18px"><div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:12px"><div class="eyebrow">TRADE SERVICE RESULTS</div><div class="tabs">' + tabs + '</div></div>' +
      '<div class="tiles">' +
      tile("Trades sent", d[0]) + tile("Won", d[1], "pos") + tile("Lost", d[2], "neg") + tile("Breakeven", d[3]) + tile("Win rate", d[4]) + tile("Profit", d[5], pc) +
      "</div></section>" +
      '<div class="row"><section class="card pad" style="flex:3 1 440px;min-width:0;display:flex;flex-direction:column;gap:14px"><div style="display:flex;justify-content:space-between"><div class="eyebrow">CURRENT ACTIVE TRADES</div><a href="#/service" class="muted" style="font-size:12px">Trade service</a></div>' +
      (run ? '<div class="bubble k-signal" style="max-width:none"><div class="head"><span class="from metal-text">SDX Trade Ideas</span><span class="tag">RUNNING</span></div>' + (run.photo_url ? '<img class="chart" src="' + esc(run.photo_url) + '" alt="Chart">' : "") + '<div class="body">' + safeHtml(run.html) + "</div></div>"
        : '<div style="min-height:200px;border-radius:12px;background:radial-gradient(90% 120% at 50% 0%,#18191b 0%,#0a0a0b 70%);box-shadow:inset 0 0 0 1px #1a1a1c;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;text-align:center"><div style="font-family:var(--sg);font-size:20px;font-weight:600">No current running trades</div><div class="note">When a trade is sent it shows here live.</div></div>') +
      '</section><section class="card pad" style="flex:2 1 300px;display:flex;flex-direction:column;gap:14px"><div style="display:flex;justify-content:space-between"><div class="eyebrow">THE MARKET</div><span class="muted" id="clock" style="font-size:13px"></span></div><div id="sessions"></div></section></div>';
    page.querySelectorAll(".tab").forEach(function (b) { b.onclick = function () { state.period = b.dataset.p; renderShell(); }; });
    drawSessions();
  }
  function tile(k, v, cls) { return '<div class="tile"><span class="k">' + k + '</span><span class="v ' + (cls || "") + '">' + esc(v) + "</span></div>"; }
  function drawSessions() {
    var el = document.getElementById("sessions"); if (!el) return;
    var parts = {}; new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", hour: "2-digit", minute: "2-digit", weekday: "short", hour12: false }).formatToParts(new Date()).forEach(function (p) { parts[p.type] = p.value; });
    var hh = parseInt(parts.hour, 10) % 24, mm = parseInt(parts.minute, 10), wd = parts.weekday, t = hh * 60 + mm;
    var weekend = wd === "Sat" || (wd === "Sun" && t < 1320) || (wd === "Fri" && t >= 1320);
    var S = [["Asia", 0, 540, "00:00–09:00"], ["London", 480, 1020, "08:00–17:00"], ["New York", 780, 1320, "13:00–22:00"]];
    var open = S.filter(function (s) { return !weekend && t >= s[1] && t < s[2]; });
    var now = weekend ? "Markets closed" : open.length === 2 ? open[0][0] + " / " + open[1][0] + " overlap" : open.length ? open[0][0] + " session" : "Between sessions";
    var nxt = weekend ? "Opens Sunday 22:00" : (function () { var u = S.filter(function (s) { return s[1] > t; })[0]; if (!u) return "Asia opens at 00:00"; var m = u[1] - t; return u[0] + " opens in " + (Math.floor(m / 60) ? Math.floor(m / 60) + "h " : "") + (m % 60) + "m"; })();
    document.getElementById("clock").textContent = (hh < 10 ? "0" : "") + hh + ":" + (mm < 10 ? "0" : "") + mm + " UK";
    el.innerHTML = '<div style="font-family:var(--sg);font-size:22px;font-weight:600">' + now + '</div><div class="note" style="margin-bottom:12px">' + nxt + "</div>" +
      S.map(function (s) {
        var on = open.indexOf(s) > -1; var pct = on ? Math.round((t - s[1]) / (s[2] - s[1]) * 100) : (!weekend && t >= s[2] ? 100 : 0);
        return '<div class="sess' + (on ? " on" : "") + '" style="margin-top:10px"><span class="n">' + s[0] + '</span><div class="bar"><div class="fill" style="width:' + pct + '%"></div></div><span class="h">' + s[3] + "</span></div>";
      }).join("");
  }

  function renderService(page) {
    var run = runningTrade();
    var TAG = { signal: "NEW SIGNAL", win: "TAKE PROFIT", loss: "STOP LOSS", be: "BREAKEVEN", update: "TRADE UPDATE" };
    var byId = {}; state.messages.forEach(function (m) { byId[m.message_id] = m; });
    var lastDay = "", items = "";
    state.messages.forEach(function (m) {
      var dt = new Date(m.sent_at);
      var day = dt.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/London" }).toUpperCase();
      if (day !== lastDay) { items += '<div class="day">' + esc(day) + "</div>"; lastDay = day; }
      var time = dt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/London" });
      var rep = m.reply_to && byId[m.reply_to] ? '<div class="reply"><b>Reply</b>' + esc(plainFirstLine(byId[m.reply_to])) + "</div>" : "";
      items += '<div class="bubble k-' + esc(m.kind || "note") + '"><div class="head"><span class="from metal-text">SDX Trade Ideas</span>' + (TAG[m.kind] ? '<span class="tag">' + TAG[m.kind] + "</span>" : "") + "</div>" + rep +
        (m.photo_url ? '<img class="chart" loading="lazy" src="' + esc(m.photo_url) + '" alt="Chart">' : "") +
        (m.html ? '<div class="body">' + safeHtml(m.html) + "</div>" : "") +
        '<span class="time">' + time + (m.edited_at ? " · edited" : "") + "</span></div>";
    });
    page.innerHTML =
      '<div style="display:flex;flex-direction:column;gap:8px"><div class="eyebrow">TRADE SERVICE</div><h1 class="title">Trade <span class="metal-text">service.</span></h1></div>' +
      '<section class="pinned' + (run ? " live" : "") + '"><div style="display:flex;align-items:center;gap:12px"><span class="eyebrow">PINNED</span><span style="font-size:14px;font-weight:600">' + (run ? esc(plainFirstLine(run)) : "No current running trades") + '</span></div><span class="muted" style="font-size:12px">' + (run ? "Running now" : "A running trade pins here first") + "</span></section>" +
      '<section class="card"><div class="feed-head"><div class="who"><div class="pic"><img src="assets/sd-mark.png" alt=""></div><div><div style="font-size:15px;font-weight:700" class="metal-text">SDX Trade Ideas</div><div class="muted" style="font-size:11px">Live from Telegram</div></div></div><a href="#/tracker" class="muted" style="font-size:12px">Results</a></div>' +
      '<div class="feed"><div class="feed-inner">' + (items || '<div class="note" style="text-align:center;padding:40px">No messages yet.</div>') + "</div></div></section>";
  }

  function renderTracker(page) {
    var rows = "";
    MONTHS.forEach(function (mo) {
      var ts = TRADES.map(function (t, i) { return [i, t]; }).filter(function (x) { return x[1][0] === mo[0]; });
      var pos = mo[7].charAt(0) !== "-";
      ts.forEach(function (x, k) {
        var t = x[1], cls = t[2] === "Win" ? "win" : t[2] === "Loss" ? "loss" : "be";
        var bt = k === 0 ? "border-top:2px solid #060606" : "";
        rows += "<tr>" + (k === 0 ? '<td rowspan="' + ts.length + '" class="month-cell ' + (pos ? "pos" : "neg") + '">' + mo[0] + "</td>" : "") +
          '<td style="font-weight:600;' + bt + '">' + t[1] + '</td><td style="' + bt + '"><span class="pill ' + cls + '">' + (t[2] === "BE" ? "Breakeven" : t[2]) + '</span></td><td style="color:#c9ccd1;' + bt + '">' + t[3] + '</td><td style="color:#c9ccd1;' + bt + '">' + t[4] + '</td><td class="r ' + (cls === "win" ? "pos" : cls === "loss" ? "neg" : "") + '" style="font-family:var(--sg);font-weight:600;' + bt + '">' + t[5] + "</td></tr>";
      });
    });
    var sum = MONTHS.slice().reverse().concat([TOTAL]).map(function (m) {
      var tot = m[0] === "Total", pos = m[7].charAt(0) !== "-", c = pos ? "pos" : "neg";
      return '<tr style="' + (tot ? "background:#0f0f11" : "") + '"><td style="font-weight:600;white-space:nowrap">' + (tot ? "Total" : '<span style="display:inline-flex;align-items:center;gap:8px"><span style="width:8px;height:8px;border-radius:50%;background:' + (pos ? "#7fd99a" : "#ff8a8a") + '"></span>' + m[0] + "</span>") + "</td>" +
        [1, 2, 3, 4, 5].map(function (i) { return '<td class="r" style="color:#c9ccd1">' + m[i] + "</td>"; }).join("") +
        '<td class="r ' + c + '" style="font-weight:600">' + m[6] + '</td><td class="r ' + c + '" style="font-family:var(--sg);font-weight:700">' + m[7] + "</td></tr>";
    }).join("");
    page.innerHTML =
      '<div style="display:flex;flex-direction:column;gap:8px"><div class="eyebrow">TRADE SERVICE</div><h1 class="title">Trade <span class="metal-text">tracker.</span></h1></div>' +
      '<div class="row" style="align-items:flex-start"><section class="card" style="flex:3 1 520px;min-width:0"><div class="scroll-x"><table style="min-width:560px"><thead><tr style="background:#0c0c0d"><th style="text-align:center">Month</th><th>Pair</th><th>W/L</th><th>RR</th><th>Risk</th><th class="r">Result</th></tr></thead><tbody>' + rows + "</tbody></table></div></section>" +
      '<section class="card" style="flex:2 1 460px;min-width:0"><div class="eyebrow" style="padding:16px 14px 4px">MONTHLY SUMMARY</div><div class="scroll-x"><table style="min-width:520px"><thead><tr><th>Month</th><th class="r">Trades</th><th class="r">Wins</th><th class="r">Losses</th><th class="r">BE</th><th class="r">Win rate</th><th class="r">% Gain</th><th class="r">Total R</th></tr></thead><tbody>' + sum + "</tbody></table></div></section></div>" +
      '<div class="note">Results tracked from the start of the group · 01/10/2026</div>';
  }

  // ---------- boot ----------
  async function start(session) {
    state.session = session;
    if (!session) { renderLogin(); return; }
    await loadMember();
    if (!state.member) { renderNoAccess(); return; }
    await loadMessages();
    subscribe();
    renderShell();
    clearInterval(state.clock);
    state.clock = setInterval(function () { if (route() === "dashboard") drawSessions(); }, 30000);
  }
  window.addEventListener("hashchange", function () { if (state.member) renderShell(); });
  var startedFor = undefined;
  sb.auth.onAuthStateChange(function (event, session) {
    if (event === "SIGNED_OUT") {
      if (state.channel) { sb.removeChannel(state.channel); state.channel = null; }
      state.member = null; state.session = null; startedFor = null; renderLogin(); return;
    }
    var uid = session ? session.user.id : null;
    if (uid === startedFor) return;
    startedFor = uid;
    setTimeout(function () { start(session); }, 0);
  });
})();
